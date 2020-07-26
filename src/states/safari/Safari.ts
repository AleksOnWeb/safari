import Scene from "../../skeleton/Scene";
import Tween from "../../skeleton/Tween";
import Label from "../../skeleton/gui/Label";
import Tile from "../../skeleton/gui/Tile";

export default class Safari extends Scene {
    private _tw1?: Tween;
    private _tw2?: Tween;
    private _play: boolean;
    private _speed: number;
    private _bgPosition: number;

    /**
     * Запуск игры
     */
    start(): void {
        super.start();

        this._bgPosition = 0;

        // время в милисекундах за которое проходит экран целиком
        this._speed = 15000;

        this.fpsText = <Label>this.getControl("fps_text", "game");
        this.startMove();
    }

    /**
     * запускаем движение
     */
    startMove(): void {
        // движение экрана
        this._tw1 = this.addTween()
            .addControl("tile", "game")
            .do({tilePositionX: [this._bgPosition + 0, this._bgPosition - 1280]})
            .start(this._speed, undefined, -1);

        // покачивание машины
        this._tw2 = this.addTween()
            .addControl("car", "game")
            .do({rotation: [-0.05, 0.05]}, Tween.LinearBack)
            .start(2000, undefined, -1);
        this._play = true;
    }

    /**
     * Останавливаем движение
     */
    stopMove(): void {
        if (this._tw1) this._tw1.stop();
        if (this._tw2) this._tw2.stop();
        this._bgPosition = (<Tile>this.getControl("tile", "game")).tilePositionX;
        this._play = false;
    }

    /**
     * Обработка кликов по кнопке
     * @param nickname
     */
    onButtonUp(nickname: string): void {
        super.onButtonUp(nickname);
        if (nickname === "btn_start_stop") {
            if (this._play) {
                this.stopMove();
            } else {
                this.startMove();
            }
            this.getControl("lb_play", "game").visible = this._play;
            this.getControl("lb_stop", "game").visible = !this._play;
        }
    }
}