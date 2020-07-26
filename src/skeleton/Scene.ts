/**
 * стейт сцены PIXI
 */

import State from "./State";
import Picture from "./gui/Picture";
import * as PIXI from "pixi.js";
import Container from "./gui/Container";
import Button from "./gui/Button";
import Anim from "./gui/Anim";
import Label from "./gui/Label";
import Control from "./gui/Control";
import Tween from "./Tween";
import Tile from "./gui/Tile";

type ControlTypes = "picture" | "container";

export default class Scene extends State {
    static readonly ROOT_CONTAINER = "root";

    public controls: { [containerName: string]: { [name: string]: any } };
    public buttons: { [containerName: string]: { [name: string]: any } };
    public anims: { [containerName: string]: { [name: string]: any } };
    public tweens: Tween[];

    public mousePos: number[];
    public fpsCounter: number;
    public lastFpsTime: number;
    public fps: number;
    public fpsText: Label | undefined;
    public needResort: boolean;

    private addFunction = {
        picture: this.addPicture,
        tile: this.addTile,
        button4state: this.addButton4State,
        anim: this.addAnim,
        label: this.addLabel,
        container: this.addContainer
    };

    /**
     * запуск
     */
    start() {
        super.start();
        this.fpsCounter = 0;
        this.lastFpsTime = 0;
        this.controls = {"root": {}};
        this.buttons = {"root": {}};
        this.anims = {"root": {}};
        this.tweens = [];
        this.initRootContainer();
        this.showScene();
    }

    initRootContainer(): void {
        this.controls[Scene.ROOT_CONTAINER][Scene.ROOT_CONTAINER] = new Container({nickname: Scene.ROOT_CONTAINER}, 0, this, this.stage);
    }

    getRootContainer(): Container {
        return <Container>this.controls[Scene.ROOT_CONTAINER][Scene.ROOT_CONTAINER];
    }

    /**
     * показать сцену
     */
    showScene(): void {
        window.api.packs.forEach((pack: { fonts: { [key: string]: any }, scene: PackItem[] }) => {
            let scene: PackItem[] = pack.scene;
            if (scene) {
                this.addItemsToContainer(scene, this.getRootContainer());
                this.needResort = true;
            }
        });
    }

    addPicture(data: PackItemParams, order: number, parent?: Container): Picture {
        let picture = new Picture(data, order, this);
        picture.parent = parent || this.getRootContainer();
        this.controls[picture.parent.nickname][data.nickname] = picture;
        return picture;
    }

    addTile(data: PackItemParams, order: number, parent?: Container): Tile {
        let picture = new Tile(data, order, this);
        picture.parent = parent || this.getRootContainer();
        this.controls[picture.parent.nickname][data.nickname] = picture;
        return picture;
    }

    addLabel(data: PackItemParams, order: number, parent?: Container): Label {
        let label = new Label(data, order, this);
        label.parent = parent || this.getRootContainer();
        this.controls[label.parent.nickname][label.nickname] = label;
        return label;
    }

    addAnim(data: PackItemParams, order: number, parent?: Container): Anim {
        let amim = new Anim(data, order, this);
        amim.parent = parent || this.getRootContainer();
        this.controls[amim.parent.nickname][data.nickname] = amim;
        this.anims[amim.parent.nickname][data.nickname] = amim;
        return amim;
    }

    addButton4State(data: PackItemParams, order: number, parent?: Container): Button {
        let button = new Button(data, order, this);
        button.parent = parent || this.getRootContainer();
        this.controls[button.parent.nickname][data.nickname] = button;
        this.buttons[button.parent.nickname][data.nickname] = button;
        return button;
    }

    addContainer(data: PackItemParams, order: number, parent?: Container): Container {
        let container = new Container(data, order, this);
        container.parent = parent || this.getRootContainer();
        if (this.controls[container.nickname] === undefined) {
            // инициализируем все нужные массивы для контролов
            this.controls[container.nickname] = [];
            this.anims[container.nickname] = [];
            this.buttons[container.nickname] = [];
        } else {
            console.error("Container name duplicate", container.nickname);
        }

        this.controls[data.nickname] = [];
        this.controls[container.parent.nickname][data.nickname] = container;

        if (Array.isArray(data.items)) this.addItemsToContainer(data.items, container);

        return container
    }

    addItemsToContainer(items: PackItem[], container: Container): Container {
        let childCreateOrder = 0;

        items.forEach((item: PackItem) => {
            // убедимся, что контейнер умеет работать с этим типом контролов
            if (Object.keys(this.addFunction).includes(item.type)) {
                // Добавим контрол в контейнер
                let c = this.addFunction[<ControlTypes>item.type].call(this, item.data, childCreateOrder, container);
                if (c !== undefined) {
                    c.visible = item.data.visible;
                    childCreateOrder++;
                } else {
                    console.error("Broken control", item);
                }
            } else {
                console.error("Unknown control type", item.type, item);
            }
        });
        return container;
    }

    regControl(containerName: string, controlName: string, control: Control) {
        this.controls[containerName][controlName] = control;
    }

    getControl(controlName: string, containerName: string = Scene.ROOT_CONTAINER): Control {
        return this.controls[containerName][controlName];
    }

    /**
     * найти текстуру в паках по ее никнейму
     * @param name
     * @returns {*}
     */
    findTexture(name: string): PIXI.Texture | undefined {
        if (name === "WHITE") {
            return PIXI.Texture.WHITE;
        }
        if (name === "EMPTY") {
            return PIXI.Texture.EMPTY;
        }
        for (let i = 0; i < window.api.packs.length; i++) {
            let p = window.api.packs[i];
            for (let k in p.textures) {
                const texture = p.textures[k];
                if (texture.nickname === name) {
                    return PIXI.Texture.from(texture.store.toLowerCase());
                }
            }
        }
        return undefined;
    }

    onButtonDown(nickname: string): void {
        console.info("%c press [" + nickname + "]", "background: #222; color: #118D1F");
    }

    onButtonUp(nickname: string): void {
        console.info("%c up [" + nickname + "]", "background: #222; color: #118D1F");
    }

    addTween(): Tween {
        let tween = new Tween(this);
        this.tweens.push(tween);
        return tween;
    }

    /**
     * Запуск update на каждом элементе дерева
     * @param list - дерево (anims, spineAnims...)
     * @param delta
     */
    private static updateControlsList(list: { [containerName: string]: { [name: string]: { update: Callback } } }, delta: number): void {
        for (let c in list) {
            for (let name in list[c]) {
                list[c][name].update(delta);
            }
        }
    }

    update(delta: number): void {
        // обновим координаты мыши
        let p = window.renderer.plugins.interaction.mouse.global;
        this.mousePos = [Math.round(p.x), Math.round(p.y)];
        super.update(delta);
        const time = Date.now();
        // установим единое текущее время для всех анимаций
        Anim.currentTime = time;
        Scene.updateControlsList(this.anims, delta);
        for (let i = 0; i < this.tweens.length; i++) {
            this.tweens[i].update(delta * 10);
        }

        if (this.fpsText) {
            this.fpsCounter++;
            if (time - this.lastFpsTime > 1000) {
                this.lastFpsTime = time;
                this.fps = this.fpsCounter;
                this.fpsCounter = 0;
            }
            (<PIXI.Text>(<Label>this.fpsText).pixiElement).text = "FPS:" + this.fps;;
        }

        // если надо - перестроим граф сцены
        if (this.needResort) {
            // отсортируем все контейнеры на сцене
            this.resortContainer(this.getRootContainer());
            // сбросим флаг о необходимости сортировки
            this.needResort = false;
        }

    }

    /**
     * Пересортировка контролов в отдельном контейнере.
     *
     * HINTS:
     * 1)Отдельным контейнерам можно и нужно задавать createOrder указывающий на их положение в родителе
     * 2)CreateOrder у чайлдов в контейнере относительный по контейнеру, а не абсолютный по игре
     * @param container
     * @param withChildContainers
     */
    resortContainer(container: Container | undefined, withChildContainers = true): void {
        if (container !== undefined) {
            let sorted = container.children.sort((a, b) => {
                if (a.createOrder > b.createOrder) return 1;
                if (a.createOrder < b.createOrder) return -1;
                if (a.createOrder !== undefined && b.createOrder === undefined) return 1;
                if (a.createOrder === undefined && b.createOrder !== undefined) return -1;

                if (a.z > b.z) return 1;
                if (a.z < b.z) return -1;
                if (a.z !== undefined && b.z === undefined) return 1;
                if (a.z === undefined && b.z !== undefined) return -1;

                return 0;
            });
            let i = sorted.length;
            while (--i >= 0) {
                sorted[i].z = i;
                sorted[i].pixiElement.zIndex = i;
            }

            container.pixiElement.children.sort((a, b) => a.zIndex - b.zIndex);

            // сортировка контейнеров в контейнере
            if (withChildContainers) container.children
                .filter((child) => child instanceof Container)
                .forEach((cont) => this.resortContainer(<Container>cont));
        }
    };

    /**
     * Уничтожение отдельного контейнера со всем его содержимым
     * @param container
     */
    disposeContainer(container: Container) {
        if (container.nickname !== Scene.ROOT_CONTAINER) {
            // уберем из массива контролов контролы,
            // которые больше не существуют
            if (this.controls) {
                delete this.controls[container.nickname];
                delete this.controls["root"][container.nickname];
            }
            container.destroy({children: true});
        } else if (container.nickname === Scene.ROOT_CONTAINER) {
            this.anims = {"root": {}};
            this.buttons = {"root": {}};
            for (let key in this.controls) {
                for (let name in this.controls[key]) {
                    if (name !== "root" && this.controls[key][name] !== undefined) {
                        this.controls[key][name].destroy();
                        delete this.controls[key][name];
                    }
                }
            }
            this.controls = {"root": {}};
            container.pixiElement.children.forEach(child => {
                child.destroy();
            });
        }
    }

    dispose() {
        this.disposeContainer(this.getRootContainer());
        super.dispose();
    }
}
