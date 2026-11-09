/**
 * Presentation Utility: Formatters
 * 
 * Provides pure utility functions for formatting dates, timestamps,
 * file sizes, and string truncations.
 */

/**
 * Format an ISO date string to a localized full date & time.
 * Example: "Monday, 9 Nov 2026, 21:45"
 */
export function formatFullDateTime(isoString?: string | null): string {
  if (!isoString) return '-';

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format an ISO date string to a human-friendly relative time string.
 * Example: "Just now", "5m ago", "2h ago", "Yesterday"
 */
export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '';

  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Format bytes into human-readable unit (e.g. "12.4 KB", "1.5 MB").
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Truncate a string with an ellipsis if it exceeds the maximum length.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

