import { Clock } from "three";
import EventEmitter from "./event-emitter";
import requestAnimationFrameFn from "./request-animation-frame";

export default class Time extends EventEmitter {
    private _start: number;
    private _current: number;
    private _elapsed: number;
    private _delta: number;
    private _clock: Clock;
    private _raf: ReturnType<typeof requestAnimationFrameFn>;

    constructor() {
        super();
        this._start = Date.now();
        this._current = this._start;
        this._elapsed = 0;
        this._delta = 16;
        this._clock = new Clock();
        this._raf = requestAnimationFrameFn(() => this.tick());
        this._raf.start();
    }
    tick() {
        const currentTime = Date.now();
        this._delta = currentTime - this._current;
        this._current = currentTime;
        this._elapsed = this._current - this._start;
        const delta = this._clock.getDelta();
        const elapsedTime = this._clock.getElapsedTime();
        this.emit("tick", delta, elapsedTime);
    }
    destroy() {
        this.pause();
        this.off("tick");
    }
    pause() {
        this._raf.pause();
    }
    resume() {
        this._raf.resume();
    }
    isActive() {
        this._raf.isActive();
    }
}