import * as PIXI from "pixi.js";
import Control from "./Control";
import Scene from "../Scene";

export default class Container extends Control {
    _displayObject: PIXI.Container;

    constructor(data: PackItemParams, order: number, scene: Scene, displayObject?: PIXI.Container) {
        let container: PIXI.Container = displayObject || new PIXI.Container();
        super(data, order, scene, container);
    }

    set pivot(value: Point) {
        this._displayObject.pivot.set(value.x, value.y);
    }

    get pivot(): Point {
        return {x: this._displayObject.pivot.x, y: this._displayObject.pivot.y}
    }

    get children(): Control[] {
        let childs = [];
        for (let controlName in this._scene.controls[this.nickname]) {
            if (controlName !== Scene.ROOT_CONTAINER) {
                childs.push(this._scene.controls[this.nickname][controlName])
            }
        }
        return childs;
    }

    get pixiElement(): PIXI.Container {
        return this._displayObject;
    }
}