import * as PIXI from "pixi.js";
import Scene from "../Scene";
import Control from "./Control";

export default class Button extends Control {
    public isCheckButton: boolean;
    protected _displayObject: PIXI.Sprite;

    private _enabled: boolean;
    private _checked: boolean;
    private _pressed: boolean;
    private _isOver: boolean;

    private _state: ButtonState;
    private readonly _states: {
        [key: number]: {
            texture: PIXI.Texture
        }
    };

    public onStateChanged: (prevState: ButtonState, currentState: ButtonState) => void;

    constructor(data: PackItemParams, order: number, scene: Scene, displayObject?: PIXIElement) {
        let sprite: PIXI.Sprite = <PIXI.Sprite>displayObject || new PIXI.Sprite(scene.findTexture(<string>data.stayid) || PIXI.Texture.WHITE);
        super(data, order, scene, sprite);
        this.isCheckButton = false;

        this._enabled = data.enabled || true;
        this._checked = false;

        this._states = {};

        this._states[ButtonState.NORMAL] = {texture: scene.findTexture(<string>data.stayid) || PIXI.Texture.WHITE};
        this._states[ButtonState.HOVER] = {texture: scene.findTexture(<string>data.hoverid) || PIXI.Texture.WHITE};
        this._states[ButtonState.DISABLED] = {texture: scene.findTexture(<string>data.disableid) || PIXI.Texture.WHITE};
        this._states[ButtonState.PRESSED] = {texture: scene.findTexture(<string>data.downid) || PIXI.Texture.WHITE};

        this._state = ButtonState.NORMAL;

        this._displayObject.interactive = true;
        // уберём курсор на задизейбленных кнопках
        this._displayObject.buttonMode = this._enabled;

        this._displayObject
            .on("pointerover", this.onButtonOver.bind(this))
            .on("pointerout", this.onButtonOut.bind(this));

        if (window.nativeMobileCheck()) {
            // console.log("MOB");
            this._displayObject.on("touchstart", this.onMobileButtonDown.bind(this))
                .on("touchend", this.onMobileButtonUp.bind(this))
                .on("touchendoutside", this.onMobileButtonOut.bind(this));
        } else {
            // console.log("DESK");
            this._displayObject.on("pointerdown", this.onButtonDown.bind(this))
                .on("pointerup", this.onButtonUp.bind(this))
                .on("pointerupoutside", this.onButtonUp.bind(this));
        }
        if (data.width !== undefined) {
            this.width = data.width;
        }
        if (data.height !== undefined) {
            this.height = data.height;
        }
        this.tint = data.tint || 0xffffff;
    }

    /**
     * Установка визуального состояния кнопки
     */
    set state(state: ButtonState) {
        if (this._state !== state) {
            const prevState = this._state;

            // установка новой текстуры
            this._displayObject.texture = this._states[state].texture;

            // переключение сейта
            this._state = state;

            if (this.onStateChanged !== undefined) {
                this.onStateChanged(prevState, this._state);
            }
        }
    }

    /**
     * Взятие визуального состояния кнопки
     */
    get state(): ButtonState {
        return this._state;
    }

    setStayTexture(texture: PIXI.Texture): void {
        this._states[ButtonState.NORMAL].texture = texture;
        if (this._state === ButtonState.NORMAL && this._displayObject !== undefined) {
            this._displayObject.texture = texture;
        }
    }

    setDownTexture(texture: PIXI.Texture): void {
        this._states[ButtonState.PRESSED].texture = texture;
        if (this._state === ButtonState.PRESSED && this._displayObject !== undefined) {
            this._displayObject.texture = texture;
        }
    }

    setHoverTexture(texture: PIXI.Texture): void {
        this._states[ButtonState.HOVER].texture = texture;
        if (this._state === ButtonState.HOVER && this._displayObject !== undefined) {
            this._displayObject.texture = texture;
        }
    }

    setDisableTexture(texture: PIXI.Texture): void {
        this._states[ButtonState.DISABLED].texture = texture;
        if (this._state === ButtonState.DISABLED && this._displayObject !== undefined) {
            this._displayObject.texture = texture;
        }
    }

    getStayTexture(): PIXI.Texture {
        return <PIXI.Texture>this._states[ButtonState.NORMAL].texture;
    }

    getHoverTexture(): PIXI.Texture {
        return <PIXI.Texture>this._states[ButtonState.HOVER].texture;
    }

    getDownTexture(): PIXI.Texture | undefined {
        return this._states[ButtonState.PRESSED].texture;
    }

    getDisableTexture(): PIXI.Texture {
        return <PIXI.Texture>this._states[ButtonState.DISABLED].texture;
    }

    set width(value: number) {
        this._displayObject.width = value;
    }

    get width(): number {
        return this._displayObject.width;
    }

    set height(value: number) {
        this._displayObject.height = value;
    }

    get height(): number {
        return this._displayObject.height;
    }

    set enabled(value: boolean) {
        if (this._enabled !== value) {
            this._enabled = value;
            // скроем курсор на задизейбленной кнопке
            this._displayObject.buttonMode = value;

            if (!value) {
                this.state = ButtonState.DISABLED;
                this._pressed = false;
            } else {
                if (this.isCheckButton) {
                    this.state = this._checked ? ButtonState.HOVER : ButtonState.NORMAL;
                } else {
                    this.state = this._isOver ? ButtonState.HOVER : ButtonState.NORMAL;
                }
            }
        }
    }

    get enabled(): boolean {
        return this._enabled;
    }

    set checked(value: boolean) {
        if (this._checked !== value) {
            this._checked = value;
            this.state = this._enabled ? (this._checked ? ButtonState.HOVER : ButtonState.NORMAL) : ButtonState.DISABLED;
        }
    }

    get checked(): boolean {
        return this._checked;
    }

    private onButtonDown(): void {
        if (this._enabled) {
            if (!this.isCheckButton) {
                this._pressed = true;
                this.state = this._states[ButtonState.PRESSED].texture ? ButtonState.PRESSED : ButtonState.DISABLED;
            }
            this._scene.onButtonDown(this.nickname);
        }
    }

    /**
     * Как должны работать мобильные кнопки:
     * клик считается на окончание касания
     * если мы коснулись кнопки и увели палец в строну или на другую кнопку - ниодна из кнопок не должна сработать
     */
    private onMobileButtonDown(): void {
        if (this._enabled) {
            if (!this.isCheckButton) {
                this._pressed = true;
                this.state = this._states[ButtonState.PRESSED].texture ? ButtonState.PRESSED : ButtonState.DISABLED;
            }
        }
    }

    private onMobileButtonUp(): void {
        // Если кнопка активна и мы на неё изначально нажимали
        if (this._enabled) {
            if (!this.isCheckButton) {
                if (!this._pressed) return;
                this._pressed = false;
                this.state = ButtonState.NORMAL;
            }
            this._scene.onButtonUp(this.nickname);
        }
    }

    private onMobileButtonOut(): void {
        if (this._enabled) {
            this._isOver = false;
            this._pressed = false;
            if (!this.isCheckButton) {
                this.state = ButtonState.NORMAL;
            }
        }
    }

    private onButtonUp(): void {
        if (this._enabled) {
            if (!this.isCheckButton) {
                if (!this._pressed) return;
                this.state = this._isOver ? ButtonState.HOVER : ButtonState.NORMAL;
            }
            if (this._pressed) {
                this._scene.onButtonUp(this.nickname);
                this._pressed = false;
            }
        }
    }

    private onButtonOver(): void {
        this._isOver = true;
        if (this._enabled) {
            if (this._pressed) {
                return;
            }
            if (!this.isCheckButton) {
                this.state = ButtonState.HOVER;
            }
        }
    }

    private onButtonOut(): void {
        this._isOver = false;
        if (this._enabled) {
            if (this._pressed) {
                return;
            }
            if (!this.isCheckButton) {
                this.state = ButtonState.NORMAL;
            }
        }
    }

    set tint(value: number) {
        this._displayObject.tint = value;
    }

    get tint(): number {
        return this._displayObject.tint;
    }

    /*clone(copyParams: boolean = false): Control {
        let cloneControl = new Button()
        this._scene.buttons[this.parent.nickname][n] = super.clone(copyParams,cloneControl);
        return cloneControl;
    }*/
}

export enum ButtonState {
    NORMAL,
    DISABLED,
    PRESSED,
    HOVER
}
