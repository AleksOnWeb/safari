import * as PIXI from "pixi.js";
import State from "../skeleton/State";
import Resource = PIXI.LoaderResource;
import Texture = PIXI.Texture;

/**
 * Загружает все ресурсы из resource_list.json, который должен находиться в директории установленной методом setAssetsPath.
 * В секциях ресурс-листа можно указывать другие ресурс-листы, по-умолчанию будет
 * браться секция default, однако через ":" можно указать любую другую.
 * @example "./path/to/resources/resource_list.json:light"
 * ВАЖНОЕ ПРИМЕЧАНИЕ: инклюд ресурс-листов имеет два ограничения:
 *   1. в ресурс-листе нельзя заинклюдить ресурс-лист, который уже был заинклюден в дереве;
 *   2. во всём дереве не может присутствовать более одной секции некоторого ресурс-листа;
 */
export default class Loader extends State {
    public static assetsAlias: { [key: string]: string; };
    public static nextState: string;
    public static subtype?: string;
    public static assetsPath?: string;

    private started: boolean;
    private _mobile: boolean;
    public _packs: any[];
    public _textures: Texture[];
    public _spines: any;
    public _particlesData: any;
    public _i18n: any;
    public _audioSprites: any[];//Howl[];

    // данные собираемые из ресурс-листов
    private resolutions: { [subtype: string]: [number, number] } | undefined;
    private listToLoad: string[];
    private i18nPath: string | undefined;

    public static _seriesPreview: string | undefined;

    private static pLoader: PIXI.Loader;

    private static netErrorTimer: undefined | number;
    private static netErrorTimeOut = 30000;

    init() {

        this.started = false;
        let seriesPreview = localStorage.getItem("seriesPreview");
        Loader._seriesPreview = seriesPreview ? seriesPreview : undefined;
        Loader.pLoader = new PIXI.Loader;

        Loader.pLoader.use(this.middleware().bind(this));
    }

    start(): void {

        window.changeResolution(800, 600);

        this._audioSprites = [];

        Loader.pLoader.reset();

        this._packs = [];
        this._textures = [];
        this._spines = {};
        this._particlesData = {};
        this._i18n = {};
        this._mobile = false;

        // у лобби дефолтное превью
        if (Loader.nextState === "Lobby") {
            Loader.seriesPreview = undefined;
        }

        // обновим превью
        Loader.updateSeriesPreview();

        // покажем HTML5 зазрузку
        Loader.showProgressBar(true);

        this.started = true;

        // загрузим все необходимые ресурсы
        this.loadResourceList(Loader.assetsPath + "resource_list.json", Loader.subtype)
            .then(() => this.onAssetsLoaded1());
    }

    /**
     * Рекурсивно загружает ресурс-лист и все содержащиеся в нём ресурс-листы.
     * Формирует из всех ресурс-листов список ресурсов для загрузки (listToLoad), записывает их размер (из size),
     * а также записывает параметры из ресурс-листа (только из корневого).
     * В корневом ресурс-листе может содержаться путь до файла интернационализации (i18n.json),
     * а также некоторая дополнительная информация (resolutions, xp_supported, ...).
     */
    loadResourceList(path: string, subtype?: string, root = true): Promise<void> {
        console.warn(path, subtype, root);
        return new Promise<void>((resolve) => {
            Loader.pLoader
                .add(path)
                .load((_loader: PIXI.Loader, res: { [name: string]: PIXI.LoaderResource }) => {
                    let resource_list = res[path].data;
                    if (!resource_list) {
                        this.error("resource list not found");
                        return;
                    }

                    // корневой ресурс-лист может содержать i18n и некоторую дополнительную информацию
                    if (root) {
                        // сразу сбросим список загрузки (будем его заполнять с нуля)
                        this.listToLoad = [];

                        // если разрешения указаны - запомним их
                        this.resolutions = resource_list.resolutions ? resource_list.resolutions : undefined;

                        // добавим путь к переводам
                        this.i18nPath = resource_list.i18n ? resource_list.i18n : undefined;

                        // мобильный пак?
                        this._mobile = subtype === undefined && window.mobileAndTabletcheck() && resource_list.mobile;

                        // определение подтипа для корневого ресурс-листа
                        if (subtype === undefined) {
                            subtype = this._mobile ? "mobile" : "default";
                        }
                    }

                    // если не смогли определить подтип - загрузим дефолт
                    if (subtype === undefined || resource_list[subtype] === undefined) {
                        subtype = "default";
                    }

                    let promise = Promise.resolve();
                    resource_list[subtype].forEach((item: string) => {
                        // если итем - ресурс-лист, то его тоже нужно загрузить
                        if (item.includes("resource_list.json")) {
                            let pathAndSubtype = item.split(":");
                            promise = promise.then(() => this.loadResourceList(pathAndSubtype[0], pathAndSubtype[1], false));
                        } else {
                            this.listToLoad.push(item);
                        }
                    });
                    promise.then(resolve);
                });
        });
    }

    /**
     * загружена первая часть (заголовки)
     */
    onAssetsLoaded1() {
        Loader.showProgressBar(true);
        this.loadMainAssets();
    }

    /**
     * Загрузка основных ресурсов из заранее собранного списка (listToLoad), а также
     * загрузка файла интернационализации (если сохранён путь к нему в i18nPath).
     */
    loadMainAssets() {
        // сбросим предыдущие данные загрузки
        Loader.pLoader.reset();

        // добавим переводы к загрузке если есть
        if (this.i18nPath) {
            Loader.pLoader.add("i18n", this.i18nPath);
        }

        this.listToLoad.forEach(function (item: string) {
            // все json файлы грузим как внешние ресурсы, в дальнейшем их разберем детально
            if (item.endsWith(".json")) {
                Loader.pLoader.add(item);
            }
        });

        // запускаем загрузки
        this.started = true;
        Loader.pLoader.load(this.onAssetsLoaded2.bind(this));
    }

    /**
     * обработчик загрузки ресурсов
     * @returns {Function}
     */
    middleware() {
        const self = this;

        return function (res: Resource & { wasBin: boolean }, next: Function) {
            if (res && res.data && self.started) {
                if (res.type === 3) {
                    self._textures.push(res.texture);
                }

                if (res.name.endsWith("pack.json")) {
                    res.data.url = res.url;
                    self._packs.push(res.data);
                }
            }
            next();
        };
    }

    /**
     * загружена вторая часть (основная)
     */
    onAssetsLoaded2(_loader: PIXI.Loader, res: { [name: string]: PIXI.LoaderResource }) {
        this.netErrorTimerStart(false);
        this.started = false;
        console.log("LOADED");

        Loader.showProgressBar(false);

        // определим разрешение для нового стейта
        let w = 800;
        let h = 600;

        let r;

        // выберем разрешение из ресурс листа

        if (Loader.subtype !== undefined) {
            if (this.resolutions) {
                r = this.resolutions[Loader.subtype];
                if (r) {
                    w = r[0];
                    h = r[1];
                }
            }
        } else if (this._mobile) {
            // дефолтное разрешение для мобильных игр
            w = 853;
            h = 480;
            if (this.resolutions) {
                r = this.resolutions["mobile"];
                if (r) {
                    w = r[0];
                    h = r[1];
                }
            }
        } else {
            if (this.resolutions) {
                r = this.resolutions["default"];
                if (r) {
                    w = r[0];
                    h = r[1];
                }
            }
        }

        if (res.i18n && res.i18n.data) {
            this._i18n = res.i18n.data;
        }
        this._packs.sort((a: any, b: any) => {
            let ai = this.listToLoad.indexOf(a.url);
            let bi = this.listToLoad.indexOf(b.url);
            return ai - bi;
        });
        window.isMobile = this._mobile;
        window.changeResolution(w, h);

        // запустим основной стейт для которого все грузили
        console.warn("READY TO START", this);
        window.api.packs = this._packs;
        window.api.startState(Loader.nextState);
    }

    error(_msg: string) {
        this.started = false;

        // уничтожим контролы
        Loader.showProgressBar(false);
    }

    static showProgressBar(show = true): void {
        let bar = window.document.getElementById("progress-bar-container");
        if (bar) {
            bar.style.display = show ? "block" : "none";
        }
        let gameCont = window.document.getElementById("gameDiv");
        if (gameCont) {
            gameCont.style.display = show ? "none" : "block";
        }
    }

    static setAssetsPath(path: string) {
        // перед каждой загрузкой обязательно обнулим подтип
        Loader.subtype = undefined;
        if (Loader.assetsAlias) {
            let a = Loader.assetsAlias[path];
            if (a) {
                path = a;
            }
        }
        Loader.assetsPath = "./assets/" + path + "/";
    }

    static updateSeriesPreview() {
        let previewImg = <HTMLImageElement>document.getElementById("loader-img");
        if (previewImg) {
            previewImg.src = "";
            if (Loader.seriesPreview === undefined) {
                previewImg.src = "./assets/static/loader-logo.svg";
            }
        }
    }

    static get seriesPreview(): string | undefined {
        return Loader._seriesPreview;
    }

    static set seriesPreview(value: string | undefined) {
        console.warn("setSeriesPreview", value);
        Loader._seriesPreview = value;
        if (value) {
            localStorage.setItem("seriesPreview", value);
        } else {
            localStorage.removeItem("seriesPreview");
        }

    }

    /**
     * Запуск и остановка таймера лимитирующего количество попыток соединения
     * @param start
     */
    netErrorTimerStart(start = true) {
        // если сети нет и таймер не запущен
        if (start && Loader.netErrorTimer === undefined) {
            Loader.netErrorTimer = window.setTimeout(() => {
                // PIXI.Loader в PIXI 4 не сбрасывает своё состояние полностью методом reset
                // в сдедствии чего не способен правильно принять cbFunc для load,
                // лист загруженных объектов и вероятно что-то еще
                Loader.pLoader.destroy();
                this.init();
                this.netErrorTimerStart(false);
                this.error("Failed to download resource");
            }, Loader.netErrorTimeOut);
        }
        // если сеть появилась
        if (!start) {
            clearTimeout(Loader.netErrorTimer);
            Loader.netErrorTimer = undefined;
        }
    }
}
