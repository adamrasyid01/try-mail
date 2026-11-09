/**
 * Adapter Pattern Concrete Adapter: MailTmAdapter
 * 
 * Adapts the public Mail.tm REST API (JSON Hydra schema)
 * to the unified ITempMailProvider target interface.
 */

import { ITempMailProvider, ProviderMailboxResult } from './ITempMailProvider';
import { IncomingEmail, EmailAttachment } from '../../types/email.types';
import { ProviderType } from '../../types/mailbox.types';
import { API_ENDPOINTS } from '../../library/constants';

interface MailTmDomainItem {
  id: string;
  domain: string;
  isActive: boolean;
}

interface MailTmAccountResponse {
  id: string;
  address: string;
  quota: number;
  used: number;
  createdAt: string;
}

interface MailTmTokenResponse {
  token: string;
  id: string;
}

interface MailTmMessageSummary {
  id: string;
  from: {
    address: string;
    name: string;
  };
  to: Array<{ address: string; name: string }>;
  subject: string;
  intro: string;
  seen: boolean;
  isDeleted: boolean;
  hasAttachments: boolean;
  size: number;
  createdAt: string;
}

interface MailTmAttachment {
  id: string;
  filename: string;
  contentType: string;
  disposition: string;
  transferEncoding: string;
  related: boolean;
  size: number;
  downloadUrl: string;
}

interface MailTmMessageDetail extends MailTmMessageSummary {
  text?: string;
  html?: string[] | string;
  attachments?: MailTmAttachment[];
}

export class MailTmAdapter implements ITempMailProvider {
  public readonly providerId: ProviderType = 'mailtm';
  public readonly displayName: string = 'Mail.tm (Live)';
  public readonly isOffline: boolean = false;

  private readonly baseUrl: string = API_ENDPOINTS.MAIL_TM_BASE_URL;

  /**
   * Fetch available domains supported by Mail.tm
   */
  public async getDomains(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/domains`);
      if (!res.ok) {
        throw new Error(`Failed to fetch domains: HTTP ${res.status}`);
      }

      const data = await res.json();
      const members: MailTmDomainItem[] = data['hydra:member'] || [];
      const activeDomains = members.filter((d) => d.isActive).map((d) => d.domain);

      return activeDomains.length > 0 ? activeDomains : ['mailtm.com'];
    } catch (error) {
      console.warn('[MailTmAdapter] getDomains failed:', error);
      return ['mailtm.com'];
    }
  }

  /**
   * Create an account and authenticate to obtain a JWT bearer token
   */
  public async createMailbox(
    customUsername?: string,
    preferredDomain?: string
  ): Promise<ProviderMailboxResult> {
    const domains = await this.getDomains();
    const domain = preferredDomain && domains.includes(preferredDomain) ? preferredDomain : domains[0];
    const username = customUsername || `trymail_${Math.random().toString(36).substring(2, 10)}`;
    const address = `${username}@${domain}`;
    const password = `P@ss_${Math.random().toString(36).substring(2, 12)}!`;

    // 1. Create account
    const accountRes = await fetch(`${this.baseUrl}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });

    if (!accountRes.ok) {
      const errBody = await accountRes.text().catch(() => '');
      throw new Error(`Mail.tm account creation failed: ${errBody || accountRes.statusText}`);
    }

    const accountData: MailTmAccountResponse = await accountRes.json();

    // 2. Obtain JWT token
    const tokenRes = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Mail.tm token authorization failed: HTTP ${tokenRes.status}`);
    }

    const tokenData: MailTmTokenResponse = await tokenRes.json();

    return {
      id: accountData.id,
      address: accountData.address,
      domain,
      token: tokenData.token,
    };
  }

  /**
   * Retrieve list of messages for the active authenticated account
   */
  public async getInbox(mailboxId: string, token?: string | null): Promise<IncomingEmail[]> {
    if (!token) {
      throw new Error('Mail.tm requires an authentication token to fetch inbox');
    }

    const res = await fetch(`${this.baseUrl}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Mail.tm inbox sync failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    const members: MailTmMessageSummary[] = data['hydra:member'] || [];

    return members.map((item) => ({
      id: item.id,
      mailboxId,
      senderAddress: item.from?.address || 'unknown@sender.com',
      senderName: item.from?.name || item.from?.address || 'Sender',
      subject: item.subject || '(No Subject)',
      receivedAt: item.createdAt || new Date().toISOString(),
      textContent: item.intro || '',
      htmlContent: '',
      isRead: Boolean(item.seen),
      attachments: [],
    }));
  }

  /**
   * Retrieve complete message content including sanitized HTML and attachments
   */
  public async getMessageDetail(
    messageId: string,
    mailboxId: string,
    token?: string | null
  ): Promise<IncomingEmail> {
    if (!token) {
      throw new Error('Mail.tm requires an authentication token to fetch message detail');
    }

    const res = await fetch(`${this.baseUrl}/messages/${messageId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Mail.tm message detail failed: HTTP ${res.status}`);
    }

    const data: MailTmMessageDetail = await res.json();

    const rawHtml = Array.isArray(data.html) ? data.html.join('') : data.html || '';

    const attachments: EmailAttachment[] = (data.attachments || []).map((att) => ({
      id: att.id,
      filename: att.filename,
      contentType: att.contentType,
      sizeBytes: att.size,
      downloadUrl: att.downloadUrl.startsWith('http')
        ? att.downloadUrl
        : `${this.baseUrl}${att.downloadUrl}`,
    }));

    return {
      id: data.id,
      mailboxId,
      senderAddress: data.from?.address || 'unknown@sender.com',
      senderName: data.from?.name || data.from?.address || 'Sender',
      subject: data.subject || '(No Subject)',
      receivedAt: data.createdAt || new Date().toISOString(),
      textContent: data.text || data.intro || '',
      htmlContent: rawHtml,
      isRead: Boolean(data.seen),
      attachments,
    };
  }

  /**
   * Delete the account from Mail.tm
   */
  public async deleteMailbox(mailboxId: string, token?: string | null): Promise<boolean> {
    if (!token) return true;

    try {
      const res = await fetch(`${this.baseUrl}/accounts/${mailboxId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.status === 204 || res.ok;
    } catch (e) {
      console.warn('[MailTmAdapter] deleteMailbox failed:', e);
      return false;
    }
  }
}

