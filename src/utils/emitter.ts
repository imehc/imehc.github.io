import mitt from 'mitt';
import Assets from '../helper/assets';

type Events = {
    loadMap?: Assets;
    mapPlayComplete?: () => void;
};

const emitter = mitt<Events>();

export default {
    /** 监听事件 */
    $on<K extends keyof Events>(
        event: K,
        handler: (payload: Events[K]) => void
    ) {
        console.log('监听事件', event);
        emitter.on(event, handler);
    },

    /** 取消监听（必须传入同一个 handler 函数引用） */
    $off<K extends keyof Events>(
        event: K,
        handler: (payload: Events[K]) => void
    ) {
        emitter.off(event, handler);
    },

    /** 触发事件（payload 可选） */
    $emit<K extends keyof Events>(event: K, payload?: Events[K]) {
        emitter.emit(event, payload);
    },

    /** 监听一次 */
    $once<K extends keyof Events>(
        event: K,
        handler: (payload: Events[K]) => void
    ) {
        const onceHandler = (payload: Events[K]) => {
            handler(payload);
            emitter.off(event, onceHandler);
        };
        emitter.on(event, onceHandler);
    },
};