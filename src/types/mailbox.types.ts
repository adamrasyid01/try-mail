/**
 * Domain Types: Mailbox & Provider
 */

export type ProviderType = 'guerrillamail' | 'mock' | 'mailtm' | 'onesecmail';

export type MailboxStatus = 'INITIALIZING' | 'ACTIVE' | 'EXPIRED' | 'ERROR';

export interface TemporaryMailbox {
  id: string;
  address: string;
  domain: string;
  providerId: ProviderType;
  token?: string | null;
  createdAt: string; // ISO 8601
  expiresAt?: string | null;
  status: MailboxStatus;
}

export interface MailProviderConfig {
  id: ProviderType;
  name: string;
  description: string;
  isOffline: boolean;
  supportsSSE: boolean;
  defaultDomain: string;
}

export interface MailboxSessionStorage {
  mailbox: TemporaryMailbox;
  inbox: any[]; // IncomingEmail[]
  preferences: {
    soundEnabled: boolean;
    tabBadgeEnabled: boolean;
    autoRefreshIntervalMs: number;
  };
}

