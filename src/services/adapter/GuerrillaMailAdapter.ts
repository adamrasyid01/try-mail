/**
 * Adapter Pattern Concrete Adapter: GuerrillaMailAdapter
 * 
 * Adapts the Guerrilla Mail public REST API (ajax.php)
 * to the unified ITempMailProvider target interface.
 * 
 * Key Advantages:
 * - Direct browser CORS support (Access-Control-Allow-Origin: *)
 * - Rock-solid stability (active & maintained since 2006)
 * - No rate limit locks or SSL certificate mismatch errors
 * - Instant live reception of external emails (Gmail, Yahoo, GitHub, etc.)
 * - Automatic welcome email for immediate verification
 */

import { ITempMailProvider, ProviderMailboxResult } from './ITempMailProvider';
import { IncomingEmail } from '../../types/email.types';
import { ProviderType } from '../../types/mailbox.types';
import { API_ENDPOINTS } from '../../library/constants';

interface GuerrillaInitResponse {
  email_addr: string;
  email_timestamp: number;
  alias: string;
  sid_token: string;
  auth?: { success: boolean };
}

interface GuerrillaUserResponse {
  email_addr: string;
  email_timestamp: number;
  alias: string;
  sid_token: string;
  site_id?: number;
}

interface GuerrillaMessageItem {
  mail_id: number;
  mail_from: string;
  mail_subject: string;
  mail_excerpt: string;
  mail_timestamp: number;
  mail_read: number;
  mail_date: string;
  mail_body?: string;
  att?: number;
}

interface GuerrillaListResponse {
  list: GuerrillaMessageItem[];
  count: string;
  email: string;
  alias: string;
  sid_token: string;
}

interface GuerrillaDetailResponse extends GuerrillaMessageItem {
  mail_body: string;
  sid_token: string;
  auth?: { success: boolean };
}

export class GuerrillaMailAdapter implements ITempMailProvider {
  public readonly providerId: ProviderType = 'guerrillamail';
  public readonly displayName: string = 'Guerrilla Mail (Live)';
  public readonly isOffline: boolean = false;

  private readonly baseUrl: string = API_ENDPOINTS.GUERRILLA_MAIL_BASE_URL;
  private readonly domains: string[] = [
    'guerrillamailblock.com',
    'sharklasers.com',
    'guerrillamail.com',
    'guerrillamail.net',
    'guerrillamail.org',
    'pokemail.net',
    'spam4.me',
  ];

  /**
   * Return supported domains for Guerrilla Mail
   */
  public async getDomains(): Promise<string[]> {
    return [...this.domains];
  }

  /**
   * Provision a mailbox session via Guerrilla Mail
   */
  public async createMailbox(
    customUsername?: string,
    _preferredDomain?: string
  ): Promise<ProviderMailboxResult> {
    try {
      // 1. Initialize a new session
      const res = await fetch(`${this.baseUrl}?f=get_email_address`);
      if (!res.ok) {
        throw new Error(`Failed to initialize Guerrilla Mail: HTTP ${res.status}`);
      }

      const initData: GuerrillaInitResponse = await res.json();
      let address = initData.email_addr;
      const sidToken = initData.sid_token;

      // 2. If a custom username was specified, configure user alias
      if (customUsername && customUsername.trim().length > 0) {
        const setRes = await fetch(
          `${this.baseUrl}?f=set_email_user&email_user=${encodeURIComponent(
            customUsername.trim()
          )}&lang=en&sid_token=${encodeURIComponent(sidToken)}`
        );
        if (setRes.ok) {
          const setUserData: GuerrillaUserResponse = await setRes.json();
          if (setUserData.email_addr) {
            address = setUserData.email_addr;
          }
        }
      }

      const domain = address.includes('@') ? address.split('@')[1] : this.domains[0];

      return {
        id: sidToken,
        address,
        domain,
        token: sidToken,
      };
    } catch (error) {
      console.error('[GuerrillaMailAdapter] createMailbox error:', error);
      throw new Error(
        `Failed to create Guerrilla Mail session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Fetch inbox messages for the active session token
   */
  public async getInbox(mailboxId: string, token?: string | null): Promise<IncomingEmail[]> {
    const sidToken = token || mailboxId;
    if (!sidToken) {
      return [];
    }

    try {
      const res = await fetch(
        `${this.baseUrl}?f=get_email_list&offset=0&sid_token=${encodeURIComponent(sidToken)}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch inbox: HTTP ${res.status}`);
      }

      const data: GuerrillaListResponse = await res.json();
      const list = Array.isArray(data.list) ? data.list : [];

      return list.map((item) => {
        const receivedAt =
          item.mail_timestamp > 0
            ? new Date(item.mail_timestamp * 1000).toISOString()
            : new Date().toISOString();

        const senderAddress = item.mail_from || 'unknown@sender.com';
        const senderName = senderAddress.includes('@')
          ? senderAddress.split('@')[0]
          : senderAddress;

        return {
          id: String(item.mail_id),
          mailboxId: sidToken,
          senderAddress,
          senderName,
          subject: item.mail_subject || '(No Subject)',
          receivedAt,
          textContent: item.mail_excerpt || '',
          htmlContent: item.mail_body || item.mail_excerpt || '',
          isRead: Boolean(item.mail_read),
          attachments: [],
        };
      });
    } catch (error) {
      console.error('[GuerrillaMailAdapter] getInbox error:', error);
      throw new Error(
        `Failed to retrieve inbox messages: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Retrieve full email details including HTML body
   */
  public async getMessageDetail(
    messageId: string,
    mailboxId: string,
    token?: string | null
  ): Promise<IncomingEmail> {
    const sidToken = token || mailboxId;

    try {
      const res = await fetch(
        `${this.baseUrl}?f=fetch_email&email_id=${encodeURIComponent(
          messageId
        )}&sid_token=${encodeURIComponent(sidToken)}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch email detail: HTTP ${res.status}`);
      }

      const data: GuerrillaDetailResponse = await res.json();

      const receivedAt =
        data.mail_timestamp > 0
          ? new Date(data.mail_timestamp * 1000).toISOString()
          : new Date().toISOString();

      const senderAddress = data.mail_from || 'unknown@sender.com';
      const senderName = senderAddress.includes('@')
        ? senderAddress.split('@')[0]
        : senderAddress;

      return {
        id: String(data.mail_id),
        mailboxId: sidToken,
        senderAddress,
        senderName,
        subject: data.mail_subject || '(No Subject)',
        receivedAt,
        textContent: data.mail_excerpt || '',
        htmlContent: data.mail_body || data.mail_excerpt || '',
        isRead: true,
        attachments: [],
      };
    } catch (error) {
      console.error('[GuerrillaMailAdapter] getMessageDetail error:', error);
      throw new Error(
        `Failed to fetch email #${messageId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a mailbox or purge its emails
   */
  public async deleteMailbox(mailboxId: string, token?: string | null): Promise<boolean> {
    const sidToken = token || mailboxId;
    if (!sidToken) return true;

    try {
      const listRes = await fetch(
        `${this.baseUrl}?f=get_email_list&offset=0&sid_token=${encodeURIComponent(sidToken)}`
      );
      if (listRes.ok) {
        const data: GuerrillaListResponse = await listRes.json();
        if (Array.isArray(data.list) && data.list.length > 0) {
          const idsQuery = data.list.map((m) => `email_ids[]=${encodeURIComponent(m.mail_id)}`).join('&');
          await fetch(`${this.baseUrl}?f=del_email&${idsQuery}&sid_token=${encodeURIComponent(sidToken)}`);
        }
      }
      return true;
    } catch (error) {
      console.warn('[GuerrillaMailAdapter] deleteMailbox warning:', error);
      return true;
    }
  }
}

