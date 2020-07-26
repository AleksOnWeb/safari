import * as PIXI from "pixi.js";
import Scene from "../Scene";
import Control from "./Control";

export default class Anim extends Control {
    public static currentTime: number;

    public pixiElement: PIXI.Sprite;
    public startFrame: number;
    public startFrameOffset: number;
    public stopFrame: number;
    public startTime: number;
    public cycled: boolean;
    public stopped: boolean;
    public handleAnimEnd: boolean;
    public callbackEnd?: Callback;

    private _fps: number;
    private _currentFrame: number;
    //private _orig ?: Anim;
    private _frames: any;

    constructor(data: PackItemParams, order: number, scene: Scene, displayObject?: PIXIElement) {
        let sprite: PIXI.Sprite = <PIXI.Sprite>displayObject || (data.frames !== undefined ? new PIXI.Sprite(scene.findTexture(data.frames[0].id)) : PIXI.Texture.WHITE);
        super(data, order, scene, sprite);

        /**
         * повторять анимацию в цикле
         */
        this.cycled = data.cycled || true;

        /**
         * количество кадров в секунду (почему то уменьшено в 3 раза)
         */
        this._fps = data.fps || 10;

        /**
         * с какого кадра начинать анимацию (с какого кадра проигрывается анимация)
         */
        this.startFrame = 0;

        /**
         * на сколько сдвигаем анимацию
         * нужно если надо проигрывать анимации не синхронно а с отступом в несколько кадров, но теже кадры
         * и если технически запускаются они в один и тот же момент
         * это НЕ startFrame - там указывам с какого кадра играть. т.е. кадры до startFrame - проиграны никогда НЕ будут.
         */
        this.startFrameOffset = 0;

        /**
         * обработали конец анимации?
         */
        this.handleAnimEnd = false;

        /**
         * принудительно остановлено? при этом показываем 1 кадр
         */
        this.stopped = false;

        /**
         * кадр на котором остановилась анимация
         */
        this.stopFrame = 0;

        this.startTime = 0;

        this._currentFrame = 0;

        this._frames = [];
        if (data.frames !== undefined) {
            for (let i = 0; i < data.frames.length; i++) {
                this._frames[i] = scene.findTexture(data.frames[i].id);
            }
        }
    }

    set fps(value: number) {
        this._fps = value;
    }

    get fps(): number {
        return this._fps;
    }

    set currentFrame(value) {
        if (this._currentFrame !== value) {
            //console.log("this._currentFrame=" + this._currentFrame);
            this._currentFrame = value;
            this.pixiElement.texture = this._frames[this._currentFrame];
        }
    }

    get currentFrame(): number {
        return this._currentFrame;
    }

    addFrame(frame: string | PIXI.BaseTexture): void {
        this._frames.push((frame instanceof PIXI.BaseTexture) ? frame : this._scene.findTexture(frame));
    }

    /**
     * установить карды и текстуры из другой анимации
     * @param anim
     * @param start кадр с которого начинать брать (включительно)
     * @param stop кадр до которого берем (НЕ включительно)
     */
    /*setFramesFromAnim(anim: Anim, start?: number, stop?: number): void {
        if (start !== undefined && stop !== undefined) {
            this.framesDesc = anim.framesDesc.slice(start, stop);
            this._frames = anim.textures.slice(start, stop);
        } else if (start !== undefined) {
            this.framesDesc = anim.framesDesc.slice(start);
            this._frames = anim.textures.slice(start);
        } else {
            this.framesDesc = anim.framesDesc.slice();
            this._frames = anim.textures.slice();
        }
        this._currentFrame = -1;
        this.currentFrame = 0;
    }*/

    /**
     * добавить кадры из другой анимации в конец этой
     * @param anim
     * @param start кадр с которого начинать брать (включительно)
     * @param stop кадр до которого берем (НЕ включительно)
     */

    /*addFramesFromAnim(anim: Anim, start?: number, stop?: number): void {
        if (start !== undefined && stop !== undefined) {
            this.framesDesc = this.framesDesc.concat(anim.framesDesc.slice(start, stop));
            this._frames = this._frames.concat(anim.textures.slice(start, stop));
        } else if (start !== undefined) {
            this.framesDesc = this.framesDesc.concat(anim.framesDesc.slice(start));
            this._frames = this._frames.concat(anim.textures.slice(start));
        } else {
            this.framesDesc = this.framesDesc.concat(anim.framesDesc.slice());
            this._frames = this._frames.concat(anim.textures.slice());
        }
        this._currentFrame = -1;
        this.currentFrame = 0;
    }*/

    update(): void {
        // обновляем видимый кадр только если анимация реально видима
        if (this.visible) {
            this.currentFrame = this.stopped ? this.stopFrame : this.getCurrentFrame();
            // console.log("currentFrame=" + this.currentFrame);

            if (
                !this.stopped &&
                !this.cycled &&
                this.getCurrentFramesCount() >= this._frames.length
            ) {
                this.stopped = true;
                if (this.callbackEnd) {
                    let c = this.callbackEnd;
                    this.callbackEnd = undefined;
                    c();
                }
            }
        }
    }

    stop(frame: number = 0): void {
        this.stopped = true;
        if (frame > 0) {
            this.stopFrame = frame;
        } else {
            this.stopFrame = 0;
        }
        this.update();
    }

    stopAtCurrentFrame(): void {
        this.stopped = true;
        this.stopFrame = this._currentFrame;
        this.update();
    }

    start(): void {
        this.stopped = false;
        Anim.currentTime = Date.now();
        this.startTime = Anim.currentTime;
    }

    start1time(callback?: Callback): void {
        this.stopped = false;
        Anim.currentTime = Date.now();
        this.startTime = Anim.currentTime;
        this.cycled = false;
        this.callbackEnd = callback;
    }

    /**
     * сколько всего кадров прошло от начала анимации
     */
    getCurrentFramesCount(): number {
        let dt = Anim.currentTime - this.startTime;
        return Math.round(dt * this._fps / 1000) + this.startFrame + this.startFrameOffset;
    }

    getLastFrame(): number {
        return this.getFramesCount() - 1;
    }

    /**
     * сколько всего кадров в анимации
     */
    getFramesCount(): number {
        return this._frames.length;
    }

    /**
     * текущий кадр анимации который надо отрисовать
     * @return номер кадра в массиве. начиная с 0
     */
    getCurrentFrame(): number {
        if (this._frames.length > 0) {
            let frames = this.getCurrentFramesCount();
            let frame = frames % (this._frames.length - this.startFrame) + this.startFrame;
            //console.log("anim frame: " + frame + " / " + frames + " " + this.nickname);
            return this.cycled ? frame : Math.min(frames, this._frames.length - 1);
        }
        return 0;
    }

    /*restoreOrigFrames(): void {
        if (!this._orig) {
            return;
        }
        this.clear();
        this.framesDesc = this._orig.framesDesc.slice();
        this.initTextures();
    }*/
}