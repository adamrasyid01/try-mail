import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockMailAdapter } from '../../src/services/adapter/MockMailAdapter';
import { GuerrillaMailAdapter } from '../../src/services/adapter/GuerrillaMailAdapter';
import { MailEventManager } from '../../src/services/observer/MailEventManager';
import { TempMailFacade } from '../../src/services/facade/TempMailFacade';
import { IMailListener, MailEventPayloadMap } from '../../src/types/observer.types';

describe('GoF Pattern Unit Tests: TryMail Core Services', () => {
  // -------------------------------------------------------------
  // 1. Adapter Pattern: MockMailAdapter
  // -------------------------------------------------------------
  describe('Adapter Pattern: MockMailAdapter', () => {
    let adapter: MockMailAdapter;

    beforeEach(() => {
      adapter = new MockMailAdapter();
    });

    it('should return default domain list', async () => {
      const domains = await adapter.getDomains();
      expect(domains).toContain('trymail.dev');
    });

    it('should provision a new mailbox with unique id and address', async () => {
      const result = await adapter.createMailbox('testuser');
      expect(result.address).toBe('testuser@trymail.dev');
      expect(result.id).toBeDefined();
      expect(result.domain).toBe('trymail.dev');
    });

    it('should simulate and retrieve incoming emails', async () => {
      const mb = await adapter.createMailbox('inboxuser');
      const simulated = adapter.simulateIncomingEmail(mb.id, {
        subject: 'Welcome to TryMail',
      });

      const inbox = await adapter.getInbox(mb.id);
      expect(inbox.length).toBeGreaterThanOrEqual(1);
      expect(inbox.some((e) => e.id === simulated.id)).toBe(true);

      const detail = await adapter.getMessageDetail(simulated.id, mb.id);
      expect(detail.subject).toBe('Welcome to TryMail');
      expect(detail.htmlContent).toBeDefined();
    });

    it('should delete a mailbox and purge messages', async () => {
      const mb = await adapter.createMailbox('purgeuser');
      const deleted = await adapter.deleteMailbox(mb.id);
      expect(deleted).toBe(true);

      const inbox = await adapter.getInbox(mb.id);
      expect(inbox.length).toBe(0);
    });
  });

  // -------------------------------------------------------------
  // 1b. Adapter Pattern: GuerrillaMailAdapter (Live Online Provider)
  // -------------------------------------------------------------
  describe('Adapter Pattern: GuerrillaMailAdapter', () => {
    let adapter: GuerrillaMailAdapter;
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      adapter = new GuerrillaMailAdapter();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('should return supported Guerrilla Mail domains', async () => {
      const domains = await adapter.getDomains();
      expect(domains).toContain('guerrillamailblock.com');
      expect(domains).toContain('sharklasers.com');
    });

    it('should provision a new mailbox session via ajax.php', async () => {
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('f=get_email_address')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                email_addr: 'user123@sharklasers.com',
                email_timestamp: 1700000000,
                alias: 'alias123',
                sid_token: 'sid_token_abc123',
              }),
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await adapter.createMailbox();
      expect(result.address).toBe('user123@sharklasers.com');
      expect(result.id).toBe('sid_token_abc123');
      expect(result.token).toBe('sid_token_abc123');
      expect(result.domain).toBe('sharklasers.com');
    });

    it('should retrieve and format inbox messages', async () => {
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('f=get_email_list')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                list: [
                  {
                    mail_id: 42,
                    mail_from: 'sender@example.com',
                    mail_subject: 'Verification Code',
                    mail_excerpt: 'Your code is 123456',
                    mail_timestamp: 1700000000,
                    mail_read: 0,
                    mail_date: '10:00:00',
                    mail_body: '<p>Your code is 123456</p>',
                  },
                ],
                count: '1',
                email: 'user123@sharklasers.com',
                sid_token: 'sid_token_abc123',
              }),
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const inbox = await adapter.getInbox('sid_token_abc123');
      expect(inbox.length).toBe(1);
      expect(inbox[0].id).toBe('42');
      expect(inbox[0].senderAddress).toBe('sender@example.com');
      expect(inbox[0].subject).toBe('Verification Code');
      expect(inbox[0].textContent).toBe('Your code is 123456');
    });

    it('should retrieve full email detail', async () => {
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('f=fetch_email')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                mail_id: 42,
                mail_from: 'sender@example.com',
                mail_subject: 'Verification Code',
                mail_excerpt: 'Your code is 123456',
                mail_timestamp: 1700000000,
                mail_read: 1,
                mail_date: '10:00:00',
                mail_body: '<div><h3>Your code is 123456</h3></div>',
                sid_token: 'sid_token_abc123',
              }),
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const detail = await adapter.getMessageDetail('42', 'sid_token_abc123');
      expect(detail.id).toBe('42');
      expect(detail.htmlContent).toContain('Your code is 123456');
      expect(detail.isRead).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 2. Observer Pattern: MailEventManager
  // -------------------------------------------------------------
  describe('Observer Pattern: MailEventManager', () => {
    let eventManager: MailEventManager;

    beforeEach(() => {
      eventManager = new MailEventManager();
    });

    it('should register subscriber and notify when event fires', () => {
      const listener: IMailListener<'EMAIL_RECEIVED'> = {
        name: 'TestEmailListener',
        update: vi.fn(),
      };

      eventManager.subscribe('EMAIL_RECEIVED', listener);
      expect(eventManager.getListenerCount('EMAIL_RECEIVED')).toBe(1);

      const payload: MailEventPayloadMap['EMAIL_RECEIVED'] = {
        newEmails: [],
        totalCount: 0,
      };

      eventManager.notify('EMAIL_RECEIVED', payload);
      expect(listener.update).toHaveBeenCalledWith('EMAIL_RECEIVED', payload);
    });

    it('should unsubscribe a listener cleanly', () => {
      const listener: IMailListener<'MAILBOX_CREATED'> = {
        name: 'TestLifecycleListener',
        update: vi.fn(),
      };

      const unsubscribe = eventManager.subscribe('MAILBOX_CREATED', listener);
      expect(eventManager.getListenerCount('MAILBOX_CREATED')).toBe(1);

      unsubscribe();
      expect(eventManager.getListenerCount('MAILBOX_CREATED')).toBe(0);

      eventManager.notify('MAILBOX_CREATED', {
        address: 'demo@trymail.dev',
        providerId: 'mock',
      });
      expect(listener.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------
  // 3. Facade Pattern: TempMailFacade
  // -------------------------------------------------------------
  describe('Facade Pattern: TempMailFacade', () => {
    let facade: TempMailFacade;
    let eventManager: MailEventManager;

    beforeEach(() => {
      // Mock sessionStorage in jsdom
      const storageMock: Record<string, string> = {};
      vi.stubGlobal('sessionStorage', {
        getItem: (key: string) => storageMock[key] || null,
        setItem: (key: string, val: string) => {
          storageMock[key] = val;
        },
        removeItem: (key: string) => {
          delete storageMock[key];
        },
        clear: () => {
          Object.keys(storageMock).forEach((k) => delete storageMock[k]);
        },
      });

      eventManager = new MailEventManager();
      facade = new TempMailFacade(eventManager);
    });

    it('should coordinate mailbox creation through selected provider', async () => {
      const mailbox = await facade.createNewMailbox('mock');
      expect(mailbox.address).toContain('@trymail.dev');
      expect(facade.getActiveMailbox()?.address).toBe(mailbox.address);
      expect(facade.getActiveProvider().providerId).toBe('mock');
    });

    it('should sync inbox and trigger notifications when new messages arrive', async () => {
      const mailbox = await facade.createNewMailbox('mock');
      const listenerUpdate = vi.fn();

      facade.getEventManager().subscribe('EMAIL_RECEIVED', {
        name: 'MockObserver',
        update: listenerUpdate,
      });

      // Inject email
      await facade.simulateIncomingEmail({ subject: 'Testing Facade Sync' });

      const inbox = await facade.syncInbox();
      expect(inbox.length).toBeGreaterThan(0);
      expect(listenerUpdate).toHaveBeenCalled();
    });

    it('should open and sanitize email and mark isRead as true', async () => {
      await facade.createNewMailbox('mock');
      const simulated = await facade.simulateIncomingEmail({
        subject: 'Sanitize Test',
        htmlContent: '<p>Hello <script>alert("xss")</script>World</p>',
      });

      const opened = await facade.openEmail(simulated.id);
      expect(opened.isRead).toBe(true);
      expect(opened.htmlContent).not.toContain('<script>');
    });

    it('should dispose mailbox and wipe session on delete', async () => {
      await facade.createNewMailbox('mock');
      expect(facade.getActiveMailbox()).not.toBeNull();

      await facade.disposeCurrentMailbox();
      expect(facade.getActiveMailbox()).toBeNull();
    });
  });
});

