import Scene from "./Scene";
import Control from "./gui/Control";

export type TweenController = ((c: Control, k: number) => void)

export default class Tween {
    private scene: Scene;
    public controls: Control[];
    private controllers: TweenController[];
    public started: boolean;
    public finished: boolean;
    private length: number;
    private timer: number;
    private repeat: number;
    private callback: Callback | undefined;
    public restorePos: boolean;

    constructor(scene: Scene) {
        this.scene = scene;
        this.controls = [];
        this.started = false; // устанавливается на старте твина и снимается когда твин отработал
        this.finished = false; // устанавливается когда твин отработал
        this.controllers = []; // функции-обработчики
        this.length = 0;
        this.callback = undefined;

        /**
         * Восстанавливать оригинальные позиции контролов после завершения
         * @type {boolean}
         */
        this.restorePos = false;
    }

    /**
     * Добавить контрол в набор, которыми будем манипулировать
     * @param name string|object Если строка, то ищем по имени в контролах сцены | Если объект, то сразу добавляем
     * @param containerName при добавлении объекта по имени, можно указать его контейнер
     */
    addControl(name: string | Control, containerName?: string): Tween {
        if (typeof name === "string") {
            let c = this.scene.getControl(name, containerName);
            if (c) this.controls.push(c);
        } else {
            this.controls.push(name);
        }
        return this;
    }

    do(map: { [param: string]: (number | string)[] }, ease = Tween.Linear): Tween {
        let controller: TweenController;
        let simpleParams = true;
        // check params
        for (let param in map) {
            for (let i = 0; i < 2; i++) {
                if (isNaN(map[param][i])) {
                    simpleParams = false;
                    break;
                }
            }
            if(!simpleParams)break;
        }

        if (simpleParams) {
            // if params simple then make controller with less checks on every iteration
            controller = (c: Control, k: number) => {
                for (let param in map) {
                    if (c[param] !== undefined) {
                        c[param] = map[param][0] + (map[param][1] - map[param][0]) * ease(k);
                    }
                }
            };
        } else {
            controller = (c: Control, k: number) => {
                for (let param in map) {
                    if (c[param] !== undefined) {
                        let ps = <number>(isNaN(map[param][0]) ? c[map[param][0]] : map[param][0]);
                        let pe = <number>(isNaN(map[param][1]) ? c[map[param][1]] : map[param][1]);
                        c[param] = ps + (pe - ps) * ease(k);
                    }
                }
            };
        }

        this.addController(controller);
        return this;
    }

    /**
     * Добавление произвольного контроллера
     * @param controller
     * @returns {Tween}
     */
    addController(controller: TweenController): Tween {
        this.controllers.push(controller);
        return this;
    }

    /**
     * Удаление контроллеров твина
     * @returns {Tween}
     */
    clearControllers(): Tween {
        this.controllers = [];
        return this;
    }

    /**
     * Запуск твина
     * @param time длительность
     * @param callback коллбэк, который будет вызван после окончания работы твина
     * @param repeat кол-во повторов. -1 === бесконечно
     * @returns {Tween}
     */
    start(time: number, callback?: Callback, repeat = 0): Tween {
        this.length = time;
        this.callback = callback;
        this.started = true;
        this.timer = 0;
        this.repeat = repeat;
        return this;
    }

    update(delta: number): void {
        if (!this.started || this.controllers.length === 0) {
            return;
        }

        this.timer += delta;
        // TODO продумать repeat ещё раз (т.к. вот из-за этой строчки repeat будет работать криво)
        this.timer = this.timer > this.length ? this.length : this.timer;
        let k = this.timer / this.length;
        this.controls.forEach((c) => {
            this.controllers.forEach((fun) => fun(c, k));
        });

        if (this.timer >= this.length) {
            if (this.repeat > 0) {
                this.repeat--;
            }
            if (this.repeat === 0) {
                this.stop();
                if (this.restorePos) {
                    this.controls.forEach((c) => c.restorePos());
                }

                if (this.callback) {
                    this.callback();
                }
            } else {
                this.timer = 0;
            }
        }
    }

    /**
     * Остановка твина (без вызова коллбэка (!))
     * @return number k - момент, на котором остановились (от 0 до 1 (без учёта ease!))
     */
    stop(): number {
        this.started = false;
        if (this.restorePos) {
            this.controls.forEach((c) => c.restorePos());
        }
        this.finished = true;

        // вернём текущую k
        return this.timer / this.length;
    }

    /**
     * деструктор твина
     */
    destroy(): void {
        this.stop();
        this.controls = [];
        this.clearControllers();
    }

    // ==============================================================================================
    // ======================================== EASE-функции ========================================
    // ==============================================================================================


    public static Linear = function (k: number): number {
        return k;
    };

    public static LinearBack = function (k: number): number {
        return k < 0.5 ? 2 * k : -2 * k + 2;
    };
}