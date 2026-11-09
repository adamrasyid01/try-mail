/**
 * Contract: ITempMailProvider (Adapter Pattern Target Interface)
 * 
 * Every third-party disposable mail provider (Mail.tm, 1secmail, MockMail)
 * MUST implement this interface to be consumed interchangeably by the Facade.
 */

export interface ProviderDomain {
  id: string;
  domain: string;
  isActive: boolean;
}

export interface ProviderCredentials {
  address: string;
  password?: string;
  token?: string;
}

export interface NormalizedEmailSummary {
  id: string;
  senderAddress: string;
  senderName: string;
  subject: string;
  receivedAt: string; // ISO 8601
  isRead: boolean;
}

export interface NormalizedEmailDetail extends NormalizedEmailSummary {
  textContent: string;
  htmlContent: string;
  attachments: {
    id: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
    downloadUrl: string;
  }[];
}

export interface ITempMailProvider {
  /** Unique identifier for the provider (e.g., 'mailtm', 'onesecmail', 'mock') */
  readonly providerId: string;

  /** Human-readable display name */
  readonly displayName: string;

  /** Indicates if this provider operates locally without network access */
  readonly isOffline: boolean;

  /** Fetch available domains supported by this provider */
  getDomains(): Promise<string[]>;

  /** Provision a new mailbox account with a given or generated address */
  createMailbox(customUsername?: string, preferredDomain?: string): Promise<{
    id: string;
    address: string;
    domain: string;
    token?: string;
  }>;

  /** Retrieve current message summaries for an active mailbox */
  getInbox(mailboxId: string, token?: string): Promise<NormalizedEmailSummary[]>;

  /** Fetch the complete message details including body and attachments */
  getMessageDetail(messageId: string, mailboxId: string, token?: string): Promise<NormalizedEmailDetail>;

  /** Terminate and purge the mailbox on the provider backend if supported */
  deleteMailbox(mailboxId: string, token?: string): Promise<boolean>;
}

