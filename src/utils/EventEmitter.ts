import { EventType, EventHandler, IEventEmitter } from '../types';

export class EventEmitter implements IEventEmitter {
    private handlers: Map<EventType, Set<EventHandler>> = new Map();

    public on<T>(event: EventType, handler: EventHandler<T>): void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler as EventHandler);
    }

    public off<T>(event: EventType, handler: EventHandler<T>): void {
        const eventHandlers = this.handlers.get(event);
        if (eventHandlers) {
            eventHandlers.delete(handler as EventHandler);
        }
    }

    public emit<T>(event: EventType, data: T): void {
        const eventHandlers = this.handlers.get(event);
        if (eventHandlers) {
            eventHandlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    public once<T>(event: EventType, handler: EventHandler<T>): void {
        const onceHandler: EventHandler<T> = (data: T) => {
            this.off(event, onceHandler);
            handler(data);
        };
        this.on(event, onceHandler);
    }

    public removeAllListeners(event?: EventType): void {
        if (event) {
            this.handlers.delete(event);
        } else {
            this.handlers.clear();
        }
    }
}