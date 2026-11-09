/**
 * Concrete Observer / Listener: ToastNotificationListener
 * 
 * Subscribes to EMAIL_RECEIVED and dispatches toast notifications
 * for incoming emails to UI consumer components.
 */

import { IMailEventListener, MailEventPayloads } from '../../../types/observer.types';

export interface ToastItem {
  id: string;
  senderName: string;
  senderAddress: string;
  subject: string;
  receivedAt: string;
}

export type ToastSubscriber = (toast: ToastItem) => void;

export class ToastNotificationListener implements IMailEventListener<'EMAIL_RECEIVED'> {
  public readonly listenerName = 'ToastNotificationListener';
  private subscribers: Set<ToastSubscriber> = new Set();

  public subscribe(cb: ToastSubscriber): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  public update(_event: 'EMAIL_RECEIVED', data: MailEventPayloads['EMAIL_RECEIVED']): void {
    if (!data.newEmails || data.newEmails.length === 0) return;

    // Dispatch a toast item for each new incoming message
    data.newEmails.forEach((email) => {
      const toast: ToastItem = {
        id: `toast_${email.id}_${Date.now()}`,
        senderName: email.senderName,
        senderAddress: email.senderAddress,
        subject: email.subject || '(No Subject)',
        receivedAt: email.receivedAt,
      };

      this.subscribers.forEach((cb) => {
        try {
          cb(toast);
        } catch (e) {
          console.error('[ToastNotificationListener] Error notifying subscriber:', e);
        }
      });
    });
  }
}

