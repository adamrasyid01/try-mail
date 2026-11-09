/**
 * Contract: ITempMailFacade (Facade Pattern Interface)
 * 
 * Provides a simplified, high-level interface for React hooks and components
 * to orchestrate mailbox creation, synchronization, inspection, and disposal.
 */

import { NormalizedEmailDetail, NormalizedEmailSummary } from './provider-adapter.contract';

export interface MailboxSession {
  id: string;
  address: string;
  domain: string;
  providerId: string;
  token?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ITempMailFacade {
  /**
   * Initializes a fresh mailbox session.
   * Orchestrates domain retrieval, account generation, and credential acquisition.
   */
  createNewMailbox(providerId?: string): Promise<MailboxSession>;

  /**
   * Restores an existing mailbox session from persistent browser storage if valid.
   */
  restoreSession(): MailboxSession | null;

  /**
   * Fetches the latest inbox messages, detects new arrivals, and triggers notifications.
   */
  syncInbox(): Promise<NormalizedEmailSummary[]>;

  /**
   * Retrieves and sanitizes the full email content for viewing.
   */
  openEmail(messageId: string): Promise<NormalizedEmailDetail>;

  /**
   * Cleans up the active mailbox session and removes all local cached messages.
   */
  disposeCurrentMailbox(): Promise<void>;

  /**
   * Switches the active provider and provisions a new mailbox on the target backend.
   */
  switchProvider(targetProviderId: string): Promise<MailboxSession>;

  /**
   * Offline / Demo only: injects a realistic synthetic email for testing.
   */
  simulateIncomingEmail(subject?: string, sender?: string, body?: string): Promise<NormalizedEmailDetail>;
}

