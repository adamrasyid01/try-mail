/**
 * Concrete Observer / Listener: TabTitleBadgeListener
 * 
 * Subscribes to mailbox events and updates the browser tab title dynamically
 * to indicate unread message counts (e.g. "(1) New Email | TryMail").
 */

import { IMailEventListener, MailEventPayloads, MailEventType } from '../../../types/observer.types';
import { NOTIFICATION_TITLES } from '../../../library/constants';

export class TabTitleBadgeListener implements IMailEventListener<MailEventType> {
  public readonly listenerName = 'TabTitleBadgeListener';
  private unreadCount: number = 0;
  private baseTitle: string = NOTIFICATION_TITLES.EMPTY_INBOX_TITLE;

  constructor(baseTitle: string = NOTIFICATION_TITLES.EMPTY_INBOX_TITLE) {
    this.baseTitle = baseTitle;
  }

  public update(event: MailEventType, data: MailEventPayloads[MailEventType]): void {
    if (typeof document === 'undefined') return;

    switch (event) {
      case 'EMAIL_RECEIVED': {
        const payload = data as MailEventPayloads['EMAIL_RECEIVED'];
        this.unreadCount += payload.newEmails.length;
        this.renderTitle();
        break;
      }
      case 'MAILBOX_CREATED':
      case 'MAILBOX_DELETED': {
        this.unreadCount = 0;
        this.resetTitle();
        break;
      }
      default:
        break;
    }
  }

  public setUnreadCount(count: number): void {
    this.unreadCount = Math.max(0, count);
    this.renderTitle();
  }

  public resetTitle(): void {
    this.unreadCount = 0;
    if (typeof document !== 'undefined') {
      document.title = this.baseTitle;
    }
  }

  private renderTitle(): void {
    if (typeof document === 'undefined') return;

    if (this.unreadCount > 0) {
      document.title = `(${this.unreadCount}) ${NOTIFICATION_TITLES.NEW_MAIL_TITLE_PREFIX} | TryMail`;
    } else {
      document.title = this.baseTitle;
    }
  }
}

