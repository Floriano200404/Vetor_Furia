/**
 * EventBus — Pub/Sub tipado em memória.
 * Responsável pelo desacoplamento entre módulos.
 * Módulos de domínio emitem eventos; o Core RPG consome.
 */

type EventHandler<T = unknown> = (payload: T) => void;

interface EventBusInterface {
  emit<T>(event: string, payload: T): void;
  on<T>(event: string, handler: EventHandler<T>): () => void;
  off<T>(event: string, handler: EventHandler<T>): void;
  clear(): void;
}

class EventBusImpl implements EventBusInterface {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  emit<T>(event: string, payload: T): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        try {
          (handler as EventHandler<T>)(payload);
        } catch (error) {
          console.error(`[EventBus] Error in handler for "${event}":`, error);
        }
      });
    }
  }

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler as EventHandler);
      if (eventHandlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

// Singleton instance
export const eventBus = new EventBusImpl();
export type { EventBusInterface, EventHandler };
