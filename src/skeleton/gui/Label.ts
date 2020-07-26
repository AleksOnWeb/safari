import * as PIXI from "pixi.js";
import Control from "./Control";
import Scene from "../Scene";

export default class Label extends Control {
    _displayObject: PIXI.Text;

    constructor(data: PackItemParams, order: number, scene: Scene, displayObject?: PIXIElement) {
        let style;
        if (displayObject === undefined) {
            let font;
            for (const pack of window.api.packs) {
                let fonts: { [key: string]: any } = pack.fonts;
                if (fonts) {
                    font = fonts[<string>data.fontid];
                    if (font) break;
                }
            }
            if (font === undefined) console.warn("Font " + data.fontid + " for " + data.nickname + " not find. Rollback to default");

            font.fontSize = font.size ? font.size : font.fontSize ? font.fontSize : 12;
            font.fontWeight = font.weight
                ? font.weight
                : font.fontWeight
                    ? font.fontWeight
                    : "normal";
            font.stroke = font.stroke
                ? font.stroke
                : font.border_color
                    ? font.border_color
                    : "#000000";
            font.strokeThickness = font.strokeThickness
                ? font.strokeThickness
                : font.border_width
                    ? font.border_width
                    : 0.5;
            font.fontFamily = font.fontFamily
                ? font.fontFamily
                : font.font
                    ? font.font
                    : "Arial";
            delete font.size;
            delete font.font;
            let opts = {
                fontFamily: "Arial",
                fontSize: 12,
                fontWeight: "normal",
                fontStyle: "normal",
                fontVariant: "normal",
                align: "left",
                rotation: 0,
                alpha: 1,
                fill: "#ffffff",
                stroke: "#000000",
                strokeThickness: 0.5,
                dropShadow: false,
                dropShadowColor: "#000000",
                dropShadowBlur: 10,
                dropShadowAngle: 0.5,
                dropShadowDistance: 4,
                wordWrap: false,
                breakWords: false,
                wordWrapWidth: 100
            };
            opts = window._.extend(opts, font, data);
            style = new PIXI.TextStyle(opts);
        }

        let label: PIXI.Text = <PIXI.Text>displayObject || new PIXI.Text(data.nickname, style);

        if (data.i18n) {
            label.text = scene.$t(data.i18n, data.i18nParams || {});
        } else {
            label.text = data.text || data.nickname;
        }
        super(data, order, scene, label);
        if (data.align === "center") {
            this.anchor.x = 0.5;
        }
        if (data.align === "right") {
            this.anchor.x = 1;
        }
        if(data.width){
            this.width = data.width;
        }
        if(data.height){
            this.height = data.height;
        }

        this.tint = data.tint || 0xffffff;
        this.anchor = {x: data.anchorx || 0, y: data.anchory || 0};
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