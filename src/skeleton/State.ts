export default class State {
    protected stage: PIXI.Container;

    constructor(stage: PIXI.Container) {
        this.stage = stage;
        this.init();
    }

    assignLoader(): void {
    }

    init(): void {
    }

    start(): void {
    }

    end(): void {
    }

    update(_delta: number) {
    }

    dispose() {
    }
}