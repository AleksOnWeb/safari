import State from "./State";

export default class StateMachine {
    public readonly app: PIXI.Application;

    private _currentState?: State;
    private _currentStateName ?: string;
    public states: { [name: string]: State };

    constructor(app: PIXI.Application) {
        this.app = app;
        this.states = {};
        this._currentState = undefined;
    }

    addState(key: string, state: any): void {
        this.states[key] = new state(this.app.stage);
    }

    startState(key: string): void {
        let state = this.states[key];
        if (state) {
            if (this._currentState) {
                this._currentState.dispose();
            }
            this._currentState = state;
            this._currentStateName = key;
            console.warn("start state [" + key + "]");
            state.start();
        } else {
            console.warn("startState, no state [" + key + "]");
        }
    }

    get currentState(): State | undefined {
        return this._currentState;
    }

    get currentStateName(): string | undefined {
        return this._currentStateName;
    }

    update(delta: number): void {
        if (this._currentState !== undefined) {
            this._currentState.update(delta);
        }
    }
}