// 1. 事件名 → 参数类型的映射
interface EventMap {
    onProgress: [url: string, loaded: number, total: number];
    onError: [error: Error | string | unknown];
    onLoad: []
    tick: [delta: number, elapsedTime: number]
    resize: []
}

// 2. 辅助类型
type EventName = keyof EventMap;
type EventCallback<T extends EventName> = (...args: EventMap[T]) => void;

export default class EventEmitter {
    // 3. 内部容器：事件名 → 回调函数 Set
    private readonly events: Map<EventName, Set<EventCallback<EventName>>>;

    constructor() {
        this.events = new Map<EventName, Set<EventCallback<EventName>>>();
    }

    /** 监听事件 */
    on<T extends EventName>(event: T, callback: EventCallback<T>): void {
        let callbacks = this.events.get(event);
        if (!callbacks) {
            callbacks = new Set<EventCallback<EventName>>();
            this.events.set(event, callbacks);
        }
        callbacks.add(callback as EventCallback<EventName>); // 断言是兼容的
    }

    /** 取消监听 */
    off<T extends EventName>(event: T, callback?: EventCallback<T>): void {
        if (!callback) {
            // 如果不给回调，就把整个事件清掉
            this.events.delete(event);
            return;
        }

        const callbacks = this.events.get(event);
        if (!callbacks) return;
        callbacks.delete(callback as EventCallback<EventName>);

        // 如果 Set 空了，顺手把 key 也删掉
        if (callbacks.size === 0) this.events.delete(event);
    }

    /** 触发事件 */
    emit<T extends EventName>(event: T, ...args: EventMap[T]): void {
        const callbacks = this.events.get(event);
        if (!callbacks) return;
        // 复制一份，避免在回调里 off/on 造成遍历异常
        callbacks.forEach(callback => callback(...args));
    }

    /** 一次性监听 */
    once<T extends EventName>(event: T, callback: EventCallback<T>): void {
        const onceWrapper = (...args: EventMap[T]) => {
            callback(...args);
            this.off(event, onceWrapper as EventCallback<T>);
        };
        this.on(event, onceWrapper as EventCallback<T>);
    }
}