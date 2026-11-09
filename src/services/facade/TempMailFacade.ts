/**
 * Facade Pattern Class: TempMailFacade
 * 
 * Provides a unified, high-level interface that orchestrates:
 * 1. Multi-provider Adapter selection and execution (ITempMailProvider).
 * 2. Asynchronous event broadcasting (MailEventManager).
 * 3. Browser session persistence (sessionStorage).
 * 4. Inbox message synchronization and new-message diffing.
 */

import { ITempMailProvider } from '../adapter/ITempMailProvider';
import { GuerrillaMailAdapter } from '../adapter/GuerrillaMailAdapter';
import { MockMailAdapter } from '../adapter/MockMailAdapter';
import { MailEventManager, mailEventManager } from '../observer/MailEventManager';
import { IncomingEmail } from '../../types/email.types';
import { ProviderType, TemporaryMailbox } from '../../types/mailbox.types';
import { STORAGE_KEYS } from '../../library/constants';
import { sanitizeEmailHtml } from '../../utils/sanitizer';

export class TempMailFacade {
  private providers: Map<ProviderType, ITempMailProvider> = new Map();
  private currentProvider: ITempMailProvider;
  private eventManager: MailEventManager;
  private activeMailbox: TemporaryMailbox | null = null;
  private knownMessageIds: Set<string> = new Set();

  constructor(eventManager: MailEventManager = mailEventManager) {
    this.eventManager = eventManager;

    // Register supported provider adapters (GoF Adapter Pattern)
    const guerrillaAdapter = new GuerrillaMailAdapter();
    const mockAdapter = new MockMailAdapter();

    this.providers.set('guerrillamail', guerrillaAdapter);
    this.providers.set('mock', mockAdapter);

    this.currentProvider = guerrillaAdapter;

    // Attempt to restore any prior active session from browser storage
    this.restoreSession();
  }

  /**
   * Register an additional provider adapter (e.g. Mail.tm, 1secmail)
   */
  public registerProvider(adapter: ITempMailProvider): void {
    this.providers.set(adapter.providerId, adapter);
  }

  /**
   * Retrieve the event manager instance
   */
  public getEventManager(): MailEventManager {
    return this.eventManager;
  }

  /**
   * Retrieve the active mailbox model or null if uninitialized
   */
  public getActiveMailbox(): TemporaryMailbox | null {
    return this.activeMailbox;
  }

  /**
   * Retrieve the currently selected provider adapter
   */
  public getActiveProvider(): ITempMailProvider {
    return this.currentProvider;
  }

  /**
   * Retrieve all registered providers
   */
  public getAvailableProviders(): ITempMailProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Provision a brand new temporary mailbox
   */
  public async createNewMailbox(providerId?: ProviderType): Promise<TemporaryMailbox> {
    if (providerId && this.providers.has(providerId)) {
      this.currentProvider = this.providers.get(providerId)!;
    }

    try {
      const result = await this.currentProvider.createMailbox();

      const mailbox: TemporaryMailbox = {
        id: result.id,
        address: result.address,
        domain: result.domain,
        providerId: this.currentProvider.providerId,
        token: result.token || null,
        createdAt: new Date().toISOString(),
        expiresAt: null,
        status: 'ACTIVE',
      };

      this.activeMailbox = mailbox;
      this.knownMessageIds.clear();
      this.persistSession(mailbox, []);

      // Broadcast event to observers
      this.eventManager.notify('MAILBOX_CREATED', {
        address: mailbox.address,
        providerId: mailbox.providerId,
      });

      return mailbox;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create mailbox';
      this.eventManager.notify('SYNC_ERROR', { error: errorMsg, consecutiveFailures: 1 });
      throw error;
    }
  }

  /**
   * Restore an existing mailbox session from sessionStorage
   */
  public restoreSession(): TemporaryMailbox | null {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }

    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEYS.SESSION_STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (parsed?.mailbox?.address && parsed?.mailbox?.id) {
        this.activeMailbox = parsed.mailbox;

        // Switch to the provider that owns this session if registered
        if (this.providers.has(parsed.mailbox.providerId)) {
          this.currentProvider = this.providers.get(parsed.mailbox.providerId)!;
        }

        // Restore known message IDs
        if (Array.isArray(parsed.inbox)) {
          parsed.inbox.forEach((msg: IncomingEmail) => {
            if (msg.id) this.knownMessageIds.add(msg.id);
          });
        }

        // Synchronize in-memory state for mock provider
        if (this.currentProvider.providerId === 'mock' && this.activeMailbox) {
          const mockAdapter = this.currentProvider as MockMailAdapter;
          mockAdapter.restoreMailboxState(this.activeMailbox, parsed.inbox || []);
        }

        return this.activeMailbox;
      }
    } catch (e) {
      console.warn('[TempMailFacade] Could not restore session from storage:', e);
    }

    return null;
  }

  /**
   * Synchronize the inbox: queries the provider, computes diffs, and notifies observers.
   */
  public async syncInbox(): Promise<IncomingEmail[]> {
    if (!this.activeMailbox) {
      return [];
    }

    try {
      const messages = await this.currentProvider.getInbox(
        this.activeMailbox.id,
        this.activeMailbox.token
      );

      // Detect new incoming messages for Observer notification
      const newEmails: IncomingEmail[] = [];
      messages.forEach((msg) => {
        if (!this.knownMessageIds.has(msg.id)) {
          newEmails.push(msg);
          this.knownMessageIds.add(msg.id);
        }
      });

      // If new emails arrived, notify all observers (AudioAlert, TabBadge, Toast)
      if (newEmails.length > 0) {
        this.eventManager.notify('EMAIL_RECEIVED', {
          newEmails,
          totalCount: messages.length,
        });
      }

      this.persistSession(this.activeMailbox, messages);
      return messages;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Inbox sync failed';
      this.eventManager.notify('SYNC_ERROR', { error: errorMsg, consecutiveFailures: 1 });
      throw error;
    }
  }

  /**
   * Open an email, fetch its details, and sanitize HTML content
   */
  public async openEmail(messageId: string): Promise<IncomingEmail> {
    if (!this.activeMailbox) {
      throw new Error('No active mailbox found');
    }

    const email = await this.currentProvider.getMessageDetail(
      messageId,
      this.activeMailbox.id,
      this.activeMailbox.token
    );

    // Sanitize HTML body using DOMPurify
    if (email.htmlContent && email.htmlContent.trim().length > 0) {
      email.htmlContent = sanitizeEmailHtml(email.htmlContent);
    } else if (email.textContent) {
      email.htmlContent = sanitizeEmailHtml(email.textContent.replace(/\n/g, '<br />'));
    }

    email.isRead = true;

    // Update read status in sessionStorage cache
    this.updateMessageInStorage(email);

    return email;
  }

  /**
   * Helper to update a cached message's read state in storage
   */
  private updateMessageInStorage(updated: IncomingEmail): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEYS.SESSION_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.inbox)) {
        const index = parsed.inbox.findIndex((m: IncomingEmail) => m.id === updated.id);
        if (index !== -1) {
          parsed.inbox[index] = { ...parsed.inbox[index], isRead: true };
          window.sessionStorage.setItem(STORAGE_KEYS.SESSION_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn('[TempMailFacade] Failed to update message in storage:', e);
    }
  }

  /**
   * Dispose and delete the current temporary mailbox
   */
  public async disposeCurrentMailbox(): Promise<void> {
    if (!this.activeMailbox) return;

    const oldAddress = this.activeMailbox.address;
    const mailboxId = this.activeMailbox.id;
    const token = this.activeMailbox.token;

    try {
      await this.currentProvider.deleteMailbox(mailboxId, token);
    } catch (e) {
      console.warn('[TempMailFacade] Provider delete failed (clearing locally):', e);
    } finally {
      this.activeMailbox = null;
      this.knownMessageIds.clear();

      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(STORAGE_KEYS.SESSION_STORAGE_KEY);
      }

      this.eventManager.notify('MAILBOX_DELETED', { address: oldAddress });
    }
  }

  /**
   * Switch the active email provider and generate a new mailbox on the target backend
   */
  public async switchProvider(targetProviderId: ProviderType): Promise<TemporaryMailbox> {
    const target = this.providers.get(targetProviderId);
    if (!target) {
      throw new Error(`Provider '${targetProviderId}' is not registered`);
    }

    this.currentProvider = target;
    return this.createNewMailbox(targetProviderId);
  }

  /**
   * Helper for live demo & testing: Inject a simulated email into the mock provider
   */
  public async simulateIncomingEmail(options?: {
    subject?: string;
    senderName?: string;
    senderAddress?: string;
    htmlContent?: string;
  }): Promise<IncomingEmail> {
    if (this.currentProvider.providerId !== 'mock') {
      throw new Error('Email simulation is only available when using the Mock Mail provider');
    }

    if (!this.activeMailbox) {
      throw new Error('Cannot simulate email without an active mailbox');
    }

    const mockAdapter = this.currentProvider as MockMailAdapter;
    const email = mockAdapter.simulateIncomingEmail(this.activeMailbox.id, options);
    
    // Trigger sync immediately to notify observers and update storage
    await this.syncInbox();
    return email;
  }

  private persistSession(mailbox: TemporaryMailbox, inbox: IncomingEmail[]): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
      const data = {
        mailbox,
        inbox: inbox.slice(0, 50), // Store up to 50 recent messages
        lastUpdated: new Date().toISOString(),
      };
      window.sessionStorage.setItem(STORAGE_KEYS.SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[TempMailFacade] Failed to persist session:', e);
    }
  }
}

// Global facade instance
export const tempMailFacade = new TempMailFacade();

