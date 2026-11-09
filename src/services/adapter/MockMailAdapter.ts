/**
 * Concrete Adapter: MockMailAdapter
 * 
 * Implements ITempMailProvider for offline simulation, unit testing, and
 * resilient demonstration without dependence on external third-party APIs.
 */

import { ITempMailProvider, ProviderMailboxResult } from './ITempMailProvider';
import { IncomingEmail, EmailAttachment } from '../../types/email.types';
import { ProviderType } from '../../types/mailbox.types';

export class MockMailAdapter implements ITempMailProvider {
  public readonly providerId: ProviderType = 'mock';
  public readonly displayName: string = 'Mock Mail (Offline Simulation)';
  public readonly isOffline: boolean = true;

  private readonly availableDomains: string[] = ['trymail.dev', 'mockinbox.org', 'testbox.io'];
  private mailboxes: Map<string, ProviderMailboxResult> = new Map();
  private messagesByMailbox: Map<string, IncomingEmail[]> = new Map();

  public async getDomains(): Promise<string[]> {
    return [...this.availableDomains];
  }

  public async createMailbox(
    customUsername?: string,
    preferredDomain?: string
  ): Promise<ProviderMailboxResult> {
    const domain = preferredDomain && this.availableDomains.includes(preferredDomain)
      ? preferredDomain
      : this.availableDomains[0];

    const username = customUsername?.trim()
      ? customUsername.toLowerCase().replace(/[^a-z0-9]/g, '')
      : `user_${Math.random().toString(36).substring(2, 8)}`;

    const id = `mock_mb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const address = `${username}@${domain}`;

    const mailbox: ProviderMailboxResult = {
      id,
      address,
      domain,
      token: `mock_jwt_token_${id}`,
    };

    this.mailboxes.set(id, mailbox);
    this.messagesByMailbox.set(id, []);

    // Starts with an empty inbox for clean initial and post-deletion state
    return mailbox;
  }

  /**
   * Restore state from sessionStorage when restoring an existing session
   */
  public restoreMailboxState(
    mailbox: { id: string; address: string; domain: string; token?: string | null },
    messages: IncomingEmail[] = []
  ): void {
    this.mailboxes.set(mailbox.id, {
      id: mailbox.id,
      address: mailbox.address,
      domain: mailbox.domain,
      token: mailbox.token,
    });
    this.messagesByMailbox.set(mailbox.id, [...messages]);
  }

  public async getInbox(mailboxId: string): Promise<IncomingEmail[]> {
    const messages = this.messagesByMailbox.get(mailboxId) || [];
    return [...messages].sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  }

  public async getMessageDetail(messageId: string, mailboxId: string): Promise<IncomingEmail> {
    const messages = this.messagesByMailbox.get(mailboxId) || [];
    const message = messages.find((m) => m.id === messageId);

    if (!message) {
      throw new Error(`Message ${messageId} not found in mailbox ${mailboxId}`);
    }

    // Mark as read when detail is fetched
    message.isRead = true;
    return { ...message };
  }

  public async deleteMailbox(mailboxId: string): Promise<boolean> {
    this.messagesByMailbox.delete(mailboxId);
    return this.mailboxes.delete(mailboxId);
  }

  /**
   * Helper method for offline simulation: Inject a realistic synthetic email into the mailbox.
   */
  public simulateIncomingEmail(
    mailboxId: string,
    options?: {
      senderName?: string;
      senderAddress?: string;
      subject?: string;
      textContent?: string;
      htmlContent?: string;
      attachments?: EmailAttachment[];
    }
  ): IncomingEmail {
    let messages = this.messagesByMailbox.get(mailboxId);
    if (!messages) {
      messages = [];
      this.messagesByMailbox.set(mailboxId, messages);
    }

    if (!this.mailboxes.has(mailboxId)) {
      this.mailboxes.set(mailboxId, {
        id: mailboxId,
        address: 'user@trymail.dev',
        domain: 'trymail.dev',
        token: `mock_jwt_token_${mailboxId}`,
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const id = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newEmail: IncomingEmail = {
      id,
      mailboxId,
      senderAddress: options?.senderAddress || 'security@github.com',
      senderName: options?.senderName || 'GitHub Verification',
      subject: options?.subject || `Your temporary verification code is ${verificationCode}`,
      receivedAt: new Date().toISOString(),
      textContent:
        options?.textContent ||
        `Hello,\n\nPlease use the following verification code to complete your registration:\n\n${verificationCode}\n\nIf you did not request this, please ignore this email.`,
      htmlContent:
        options?.htmlContent ||
        `<div style="font-family: sans-serif; padding: 16px; color: #1e293b;">
          <h2 style="color: #0284c7; margin-bottom: 8px;">GitHub Account Security</h2>
          <p>Please enter the following verification code to confirm your email address:</p>
          <div style="background-color: #f1f5f9; padding: 14px 24px; font-size: 24px; font-weight: bold; letter-spacing: 4px; display: inline-block; border-radius: 8px; margin: 16px 0; color: #0f172a;">
            ${verificationCode}
          </div>
          <p style="font-size: 13px; color: #64748b;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
          <p style="margin-top: 20px;"><a href="https://github.com" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline;">Visit GitHub Support</a></p>
        </div>`,
      isRead: false,
      attachments: options?.attachments || [],
    };

    messages.unshift(newEmail);
    return newEmail;
  }
}
