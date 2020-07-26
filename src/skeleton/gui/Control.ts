import Scene from "../Scene";
import Container from "./Container";

type DestroyParams = { children?: boolean };
export default class Control {
    public ox: number;
    public oy: number;
    public z: number;

    protected _displayObject: PIXIElement;

    protected _scene: Scene;

    private _createOrder: number;
    private _nickname: string;
    private _parent: Container;

    constructor(data: PackItemParams, order: number, scene: Scene, displayObject?: PIXI.DisplayObject) {
        this._displayObject = displayObject || new PIXI.Sprite(PIXI.Texture.EMPTY);
        this._scene = scene;
        this.x = this.ox = data.x || 0;
        this.y = this.oy = data.y || 0;
        this.alpha = data.alpha || 1;
        this.rotation = data.rotation || 0;
        this.scale = {x: data.scalex || 1, y: data.scaley || 1};
        this.nickname = data.nickname;
        this.createOrder = order;
    }

    get x(): number {
        return this._displayObject.x;
    }

    set x(value: number) {
        this._displayObject.x = value;
    }

    get y(): number {
        return this._displayObject.y;
    }

    set y(value: number) {
        this._displayObject.y = value;
    }

    set scale(value: Point) {
        this._displayObject.scale.set(value.x, value.y);
    }

    get scale(): Point {
        return {x: this._displayObject.scale.x, y: this._displayObject.scale.y}
    }

    get alpha(): number {
        return this._displayObject.alpha;
    }

    set alpha(value: number) {
        this._displayObject.alpha = value;
    }

    get rotation(): number {
        return this._displayObject.rotation;
    }

    set rotation(value: number) {
        this._displayObject.rotation = value;
    }

    get visible(): boolean {
        return this._displayObject.visible;
    }

    set visible(value: boolean) {
        this._displayObject.visible = value;
    }

    get interactive(): boolean {
        return this._displayObject.interactive;
    }

    set interactive(value: boolean) {
        this._displayObject.interactive = value;
    }

    get createOrder(): number {
        return this._createOrder;
    }

    set createOrder(value: number) {
        this._createOrder = value;
    }

    get nickname(): string {
        return this._nickname;
    }

    set nickname(value: string) {
        if (value !== Scene.ROOT_CONTAINER && !!this.parent) {
            this._scene.controls[this.parent.nickname][value] = this;
            delete this._scene.controls[this.parent.nickname][this._nickname];
        }
        this._nickname = value;
    }

    restorePos(): void {
        this.x = this.ox;
        this.y = this.oy;
    }

    get pixiElement(): PIXIElement {
        return this._displayObject;
    }

    set mask(mask: PIXI.Graphics | null) {
        if (this.pixiElement !== undefined) {
            this.pixiElement.mask = mask;
        }
    }

    get mask(): PIXI.Graphics | null {
        if (this.pixiElement !== undefined) {
            // PIXI 5
            // At the moment, PIXI.CanvasRenderer doesn't support PIXI.Sprite as mask.
            return <PIXI.Graphics | null>this.pixiElement.mask;
        }
        return null;
    }

    /*clone(copyParams = false, cloneControl: Control): Control {
        // todo
        // генерим свободный ник для контрола на основе никнейма оригинала
        let i = 1;
        let n = this.nickname + "_clone" + i;
        while (cloneControl.scene.controls[n]) {
            i++;
            n = this.nickname + "_clone" + i;
        }
        cloneControl.nickname = n;
        this._scene.controls[this.parent.nickname][n] = cloneControl;
        cloneControl.setParent(this.sprite.parent);
        return cloneControl;
    }*/

    update(_delta?: number): void {
    }

    destroy(destroyParams?: DestroyParams): void {
        delete this._scene.controls[this.parent.nickname][this._nickname];
        this._displayObject.destroy(destroyParams);
    }

    get parent(): Container {
        return this._parent;
    }

    set parent(value: Container) {
        this._parent = value;
        value.pixiElement.addChild(this._displayObject);
    }
}