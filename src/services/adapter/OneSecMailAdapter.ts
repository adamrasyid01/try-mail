/**
 * Adapter Pattern Concrete Adapter: OneSecMailAdapter
 * 
 * Adapts the 1secmail REST API (query-parameter based)
 * to the unified ITempMailProvider target interface.
 */

import { ITempMailProvider, ProviderMailboxResult } from './ITempMailProvider';
import { IncomingEmail, EmailAttachment } from '../../types/email.types';
import { ProviderType } from '../../types/mailbox.types';
import { API_ENDPOINTS } from '../../library/constants';

interface OneSecMessageSummary {
  id: number;
  from: string;
  subject: string;
  date: string;
}

interface OneSecAttachment {
  filename: string;
  contentType: string;
  size: number;
}

interface OneSecMessageDetail {
  id: number;
  from: string;
  subject: string;
  date: string;
  attachments?: OneSecAttachment[];
  body: string;
  textBody?: string;
  htmlBody?: string;
}

export class OneSecMailAdapter implements ITempMailProvider {
  public readonly providerId: ProviderType = 'onesecmail';
  public readonly displayName: string = '1secmail (Live)';
  public readonly isOffline: boolean = false;

  private readonly baseUrl: string = API_ENDPOINTS.ONE_SEC_MAIL_BASE_URL;

  /**
   * Fetch available domains supported by 1secmail
   */
  public async getDomains(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}?action=getDomainList`);
      if (!res.ok) {
        throw new Error(`Failed to fetch 1secmail domains: HTTP ${res.status}`);
      }

      const domains: string[] = await res.json();
      return Array.isArray(domains) && domains.length > 0
        ? domains
        : ['1secmail.com', '1secmail.org', '1secmail.net'];
    } catch (error) {
      console.warn('[OneSecMailAdapter] getDomains failed, using fallback domains:', error);
      return ['1secmail.com', '1secmail.org', '1secmail.net'];
    }
  }

  /**
   * Provision a mailbox using 1secmail convention
   */
  public async createMailbox(
    customUsername?: string,
    preferredDomain?: string
  ): Promise<ProviderMailboxResult> {
    const domains = await this.getDomains();
    const domain = preferredDomain && domains.includes(preferredDomain) ? preferredDomain : domains[0];
    const username = customUsername || `trymail_${Math.random().toString(36).substring(2, 10)}`;
    const address = `${username}@${domain}`;

    return {
      id: address,
      address,
      domain,
      token: null,
    };
  }

  /**
   * Retrieve list of messages for the active address
   */
  public async getInbox(mailboxId: string): Promise<IncomingEmail[]> {
    const { login, domain } = this.parseAddress(mailboxId);

    const res = await fetch(
      `${this.baseUrl}?action=getMessages&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}`
    );

    if (!res.ok) {
      throw new Error(`1secmail inbox sync failed: HTTP ${res.status}`);
    }

    const messages: OneSecMessageSummary[] = await res.json();

    return (messages || []).map((msg) => ({
      id: String(msg.id),
      mailboxId,
      senderAddress: msg.from,
      senderName: msg.from.includes('<')
        ? msg.from.split('<')[0].trim()
        : msg.from.split('@')[0],
      subject: msg.subject || '(No Subject)',
      receivedAt: this.parseDate(msg.date),
      textContent: '',
      htmlContent: '',
      isRead: false,
      attachments: [],
    }));
  }

  /**
   * Retrieve complete message detail including HTML content and attachment URLs
   */
  public async getMessageDetail(messageId: string, mailboxId: string): Promise<IncomingEmail> {
    const { login, domain } = this.parseAddress(mailboxId);

    const res = await fetch(
      `${this.baseUrl}?action=readMessage&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(messageId)}`
    );

    if (!res.ok) {
      throw new Error(`1secmail message detail failed: HTTP ${res.status}`);
    }

    const detail: OneSecMessageDetail = await res.json();

    const attachments: EmailAttachment[] = (detail.attachments || []).map((att) => ({
      id: att.filename,
      filename: att.filename,
      contentType: att.contentType,
      sizeBytes: att.size,
      downloadUrl: `${this.baseUrl}?action=download&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(messageId)}&file=${encodeURIComponent(att.filename)}`,
    }));

    return {
      id: String(detail.id),
      mailboxId,
      senderAddress: detail.from,
      senderName: detail.from.includes('<')
        ? detail.from.split('<')[0].trim()
        : detail.from.split('@')[0],
      subject: detail.subject || '(No Subject)',
      receivedAt: this.parseDate(detail.date),
      textContent: detail.textBody || detail.body || '',
      htmlContent: detail.htmlBody || detail.body || '',
      isRead: true,
      attachments,
    };
  }

  /**
   * 1secmail expires accounts automatically; return true for local disposal
   */
  public async deleteMailbox(): Promise<boolean> {
    return true;
  }

  private parseAddress(addressOrId: string): { login: string; domain: string } {
    const parts = addressOrId.split('@');
    if (parts.length === 2) {
      return { login: parts[0], domain: parts[1] };
    }
    return { login: addressOrId, domain: '1secmail.com' };
  }

  private parseDate(dateStr: string): string {
    try {
      const d = new Date(dateStr.replace(' ', 'T') + 'Z');
      return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
}

