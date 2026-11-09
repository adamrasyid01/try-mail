/**
 * Adapter Pattern Target Interface: ITempMailProvider
 * 
 * In accordance with the Gang of Four (GoF) Adapter Pattern, this interface
 * defines the common contract that all disposable email provider adapters
 * (Mail.tm, 1secmail, MockMail) must implement to be consumed interchangeably.
 */

import { IncomingEmail } from '../../types/email.types';
import { ProviderType } from '../../types/mailbox.types';

export interface ProviderMailboxResult {
  id: string;
  address: string;
  domain: string;
  token?: string | null;
}

export interface ITempMailProvider {
  /** Unique provider identifier */
  readonly providerId: ProviderType;

  /** Human-readable display name */
  readonly displayName: string;

  /** Whether this provider operates without external internet calls */
  readonly isOffline: boolean;

  /** Retrieve the list of active email domains supported by this provider */
  getDomains(): Promise<string[]>;

  /** Provision a new mailbox account */
  createMailbox(customUsername?: string, preferredDomain?: string): Promise<ProviderMailboxResult>;

  /** Fetch current inbox message summaries */
  getInbox(mailboxId: string, token?: string | null): Promise<IncomingEmail[]>;

  /** Fetch the complete message body and attachments */
  getMessageDetail(messageId: string, mailboxId: string, token?: string | null): Promise<IncomingEmail>;

  /** Purge / terminate the mailbox on the provider if supported */
  deleteMailbox(mailboxId: string, token?: string | null): Promise<boolean>;
}

