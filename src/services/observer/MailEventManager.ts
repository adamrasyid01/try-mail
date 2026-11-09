/**
 * Observer Pattern Subject / Publisher: MailEventManager
 * 
 * Manages event subscriptions and broadcasts domain events (EMAIL_RECEIVED,
 * MAILBOX_CREATED, MAILBOX_DELETED, SYNC_ERROR) to all registered listeners.
 */

import {
  IMailEventListener,
  MailEventPayloads,
  MailEventType,
} from '../../types/observer.types';

export class MailEventManager {
  private listeners: Map<MailEventType, Set<IMailEventListener<any>>> = new Map();

  constructor() {
    // Initialize listener sets for each supported event type
    this.listeners.set('EMAIL_RECEIVED', new Set());
    this.listeners.set('MAILBOX_CREATED', new Set());
    this.listeners.set('MAILBOX_DELETED', new Set());
    this.listeners.set('SYNC_ERROR', new Set());
  }

  /**
   * Subscribe an observer/listener to a specific event type.
   * Returns an unsubscribe callback for easy cleanup in React useEffect.
   */
  public subscribe<T extends MailEventType>(
    eventType: T,
    listener: IMailEventListener<T>
  ): () => void {
    let set = this.listeners.get(eventType);
    if (!set) {
      set = new Set();
      this.listeners.set(eventType, set);
    }

    set.add(listener);

    return () => {
      this.unsubscribe(eventType, listener);
    };
  }

  /**
   * Unsubscribe an observer/listener from receiving events.
   */
  public unsubscribe<T extends MailEventType>(
    eventType: T,
    listener: IMailEventListener<T>
  ): void {
    const set = this.listeners.get(eventType);
    if (set) {
      set.delete(listener);
    }
  }

  /**
   * Notify and broadcast an event with its payload to all registered listeners.
   */
  public notify<T extends MailEventType>(
    eventType: T,
    data: MailEventPayloads[T]
  ): void {
    const set = this.listeners.get(eventType);
    if (!set || set.size === 0) {
      return;
    }

    set.forEach((listener) => {
      try {
        listener.update(eventType, data);
      } catch (error) {
        console.error(
          `[MailEventManager] Error dispatching event '${eventType}' to listener '${listener.listenerName}':`,
          error
        );
      }
    });
  }

  /**
   * Get total count of active listeners for an event type (useful for debugging/testing).
   */
  public getListenerCount(eventType: MailEventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }

  /**
   * Remove all registered listeners across all event types.
   */
  public clearAllListeners(): void {
    this.listeners.forEach((set) => set.clear());
  }
}

// Global shared instance for application-wide event notification
export const mailEventManager = new MailEventManager();

