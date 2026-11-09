/**
 * Domain Types: Observer Pattern Event Maps & Interfaces
 */

import { IncomingEmail } from './email.types';

export type MailEventType = 
  | 'EMAIL_RECEIVED' 
  | 'MAILBOX_CREATED' 
  | 'MAILBOX_DELETED' 
  | 'SYNC_ERROR';

export interface MailEventPayloads {
  EMAIL_RECEIVED: { newEmails: IncomingEmail[]; totalCount: number };
  MAILBOX_CREATED: { address: string; providerId: string };
  MAILBOX_DELETED: { address: string };
  SYNC_ERROR: { error: string; consecutiveFailures: number };
}

export interface IMailEventListener<T extends MailEventType = MailEventType> {
  readonly listenerName: string;
  update(event: T, data: MailEventPayloads[T]): void;
}

