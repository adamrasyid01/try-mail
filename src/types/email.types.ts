/**
 * Domain Types: Incoming Email & Attachments
 */

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
}

export interface IncomingEmail {
  id: string;
  mailboxId: string;
  senderAddress: string;
  senderName: string;
  subject: string;
  receivedAt: string; // ISO 8601
  textContent: string;
  htmlContent: string;
  isRead: boolean;
  attachments: EmailAttachment[];
}

export type EmailFilter = 'all' | 'unread' | 'read';

