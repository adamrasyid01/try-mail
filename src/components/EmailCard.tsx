import React from 'react';
import { Clock, Paperclip } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { IncomingEmail } from '../types/email.types';

export interface EmailCardProps {
  /** The incoming email domain entity */
  email: IncomingEmail;
  /** Whether this card is currently selected / active */
  isSelected?: boolean;
  /** Callback fired when user clicks to inspect the email */
  onSelect?: (email: IncomingEmail) => void;
  /** Additional custom Tailwind CSS classes */
  className?: string;
}

/**
 * Presentational Dumb Component: EmailCard
 * 
 * Displays a single email message summary row in the inbox list.
 * Neubrutalism style: thick black border, hard offset shadow, high-contrast unread indicators.
 */
export const EmailCard: React.FC<EmailCardProps> = ({
  email,
  isSelected = false,
  onSelect,
  className,
}) => {
  const formattedTime = new Date(email.receivedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(email)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(email);
        }
      }}
      className={twMerge(
        clsx(
          'group relative w-full p-4 rounded-xl border-2 border-black transition-all duration-150 cursor-pointer text-left select-none focus:outline-none focus:ring-2 focus:ring-black',
          isSelected
            ? 'bg-sky-200 shadow-[3px_3px_0px_0px_#000] -translate-y-0.5'
            : !email.isRead
            ? 'bg-yellow-100 hover:bg-yellow-200 shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
            : 'bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
          className
        )
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Unread Indicator + Sender info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="pt-0.5 flex-shrink-0">
            {!email.isRead ? (
              <span
                title="Unread message"
                className="inline-block px-1.5 py-0.5 bg-yellow-300 text-black border border-black rounded text-[9px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_#000]"
              >
                New
              </span>
            ) : (
              <span
                title="Read message"
                className="inline-block px-1.5 py-0.5 bg-slate-200 text-slate-700 border border-black rounded text-[9px] font-bold uppercase tracking-wider"
              >
                Read
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'text-sm truncate text-black',
                  email.isRead ? 'font-bold' : 'font-black'
                )}
              >
                {email.senderName || email.senderAddress}
              </span>
              <span className="text-xs text-gray-600 truncate hidden sm:inline font-mono">
                &lt;{email.senderAddress}&gt;
              </span>
            </div>

            <div
              className={clsx(
                'text-xs truncate mt-0.5 text-black',
                email.isRead ? 'font-medium' : 'font-extrabold'
              )}
            >
              {email.subject || '(No Subject)'}
            </div>

            {/* Brief preview snippet */}
            <p className="text-[11px] text-gray-600 truncate mt-1 line-clamp-1 font-medium">
              {email.textContent.slice(0, 95) || 'Click to view full message body...'}
            </p>
          </div>
        </div>

        {/* Right: Timestamp & Attachments indicator */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="inline-flex items-center gap-1 text-[11px] text-black font-mono font-bold">
            <Clock className="w-3 h-3 stroke-[2.5]" />
            {formattedTime}
          </span>

          {email.attachments && email.attachments.length > 0 && (
            <span
              title={`${email.attachments.length} attachment(s)`}
              className="inline-flex items-center gap-1 text-[10px] text-black bg-rose-200 border border-black px-1.5 py-0.5 rounded font-black shadow-[1px_1px_0px_0px_#000]"
            >
              <Paperclip className="w-2.5 h-2.5 stroke-[2.5]" />
              {email.attachments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
