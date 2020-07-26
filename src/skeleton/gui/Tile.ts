import * as PIXI from "pixi.js";
import Control from "./Control";
import Scene from "../Scene";

export default class Tile extends Control {
    protected _displayObject: PIXI.TilingSprite;

    constructor(data: PackItemParams, order: number, scene: Scene, displayObject?: PIXIElement) {
        let sprite: PIXI.TilingSprite = <PIXI.Sprite>displayObject || new PIXI.TilingSprite(scene.findTexture(<string>data.textureid) || PIXI.Texture.WHITE);
        super(data, order, scene, sprite);
        if (data.width !== undefined) {
            this.width = data.width;
        }
        if (data.height !== undefined) {
            this.height = data.height;
        }
        this.tint = data.tint || 0xffffff;
        this.anchor = {x: data.anchorx || 0, y: data.anchory || 0};
    }

    set tilePositionX(value: number) {
        this._displayObject.tilePosition.x = value;
    }

    get tilePositionX(): number {
        return this._displayObject.tilePosition.x;
    }

    set tilePositionY(value: number) {
        this._displayObject.tilePosition.y = value;
    }

    get tilePositionY(): number {
        return this._displayObject.tilePosition.y;
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

    set anchor(value: Point) {
        this._displayObject.anchor.set(value.x, value.y);
    }

    get anchor(): Point {
        return {x: this._displayObject.anchor.x, y: this._displayObject.anchor.y}
    }

    set tint(value: number) {
        this._displayObject.tint = value;
    }

    get tint(): number {
        return this._displayObject.tint;
    }
}