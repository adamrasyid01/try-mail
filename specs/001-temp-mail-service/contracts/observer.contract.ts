/**
 * Contract: Observer Pattern Interfaces for Temp Mail Events
 * 
 * Defines the Subject (IMailEventManager) and Subscriber (IMailEventListener)
 * contracts used to broadcast asynchronous mailbox events to UI and audio handlers.
 */

import { NormalizedEmailDetail, NormalizedEmailSummary } from './provider-adapter.contract';

export type MailEventType = 
  | 'EMAIL_RECEIVED'    // Triggered when one or more new messages arrive
  | 'MAILBOX_CREATED'   // Triggered when a new mailbox is initialized
  | 'MAILBOX_DELETED'   // Triggered when the current mailbox is cleared
  | 'SYNC_ERROR';       // Triggered on connection/polling failures

export interface MailEventMap {
  EMAIL_RECEIVED: { newEmails: NormalizedEmailSummary[]; totalCount: number };
  MAILBOX_CREATED: { address: string; providerId: string };
  MAILBOX_DELETED: { address: string };
  SYNC_ERROR: { error: string; consecutiveFailures: number };
}

export interface IMailEventListener<T extends MailEventType = MailEventType> {
  readonly listenerName: string;
  update(event: T, data: MailEventMap[T]): void;
}

export interface IMailEventManager {
  /** Subscribe a listener to all or specific event types */
  subscribe<T extends MailEventType>(eventType: T, listener: IMailEventListener<T>): void;

  /** Unsubscribe a listener from receiving events */
  unsubscribe<T extends MailEventType>(eventType: T, listener: IMailEventListener<T>): void;

  /** Broadcast an event and payload to all subscribed listeners */
  notify<T extends MailEventType>(eventType: T, data: MailEventMap[T]): void;
}

