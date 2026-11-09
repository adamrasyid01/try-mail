/**
 * Centralized Application Constants
 * 
 * In accordance with React Development Best Practices, all fixed values,
 * API endpoints, intervals, storage keys, and defaults are centralized here.
 * No magic numbers or hardcoded URLs are permitted in components.
 */

export const STORAGE_KEYS = {
  SESSION_STORAGE_KEY: 'TRYMAIL_SESSION_V1',
  THEME_KEY: 'TRYMAIL_THEME',
  AUDIO_ENABLED_KEY: 'TRYMAIL_AUDIO_ENABLED',
} as const;

export const POLLING_CONFIG = {
  INBOX_INTERVAL_MS: 5000, // 5 seconds interval
  MAX_RETRY_COUNT: 3,
  RETRY_BACKOFF_MS: 1500,
  COPY_TOOLTIP_DURATION_MS: 2000,
} as const;

export const API_ENDPOINTS = {
  GUERRILLA_MAIL_BASE_URL: 'https://api.guerrillamail.com/ajax.php',
  MAIL_TM_BASE_URL: 'https://api.mail.tm',
  ONE_SEC_MAIL_BASE_URL: 'https://www.1secmail.com/api/v1/',
} as const;

export const DEFAULT_CONFIG = {
  PROVIDER_ID: 'guerrillamail' as const,
  DEFAULT_DOMAIN: 'sharklasers.com',
  APP_TITLE: 'TryMail | Disposable Temporary Email',
} as const;

export const NOTIFICATION_TITLES = {
  NEW_MAIL_TITLE_PREFIX: 'New Email',
  EMPTY_INBOX_TITLE: 'TryMail | Disposable Temporary Email',
} as const;

