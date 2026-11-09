import React from 'react';
import { Inbox, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { IncomingEmail } from '../types/email.types';
import { EmailCard } from './EmailCard';

export interface InboxListProps {
  /** Array of incoming email messages */
  emails: IncomingEmail[];
  /** Whether the inbox is actively fetching or synchronizing */
  isSyncing?: boolean;
  /** Currently selected message ID */
  selectedEmailId?: string | null;
  /** Callback fired when an email is clicked */
  onSelectEmail?: (email: IncomingEmail) => void;
  /** Audio alert state */
  isAudioEnabled?: boolean;
  /** Callback to toggle audio alert on/off */
  onToggleAudio?: () => void;
  /** Additional custom Tailwind CSS classes */
  className?: string;
}

/**
 * Presentational Dumb Component: InboxList
 * 
 * Displays the scrollable list of incoming messages with unread badges,
 * sound toggle controls, and empty state illustrations.
 * Neubrutalism style: solid bright fills, thick black borders, hard offset shadows.
 */
export const InboxList: React.FC<InboxListProps> = ({
  emails,
  isSyncing = false,
  selectedEmailId,
  onSelectEmail,
  isAudioEnabled = true,
  onToggleAudio,
  className,
}) => {
  const unreadCount = emails.filter((m) => !m.isRead).length;

  return (
    <div
      className={twMerge(
        clsx(
          'w-full bg-white rounded-xl border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col',
          className
        )
      )}
    >
      {/* Inbox Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b-2 border-black">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-yellow-300 text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000]">
            <Inbox className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h2 className="text-sm sm:text-base font-black text-black tracking-wide uppercase">
            Inbox Messages
          </h2>
          <span className="px-2.5 py-0.5 bg-sky-200 text-black border-2 border-black text-xs font-black rounded-md shadow-[1px_1px_0px_0px_#000]">
            {emails.length}
          </span>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 bg-yellow-300 text-black border-2 border-black text-xs font-black rounded-md shadow-[1px_1px_0px_0px_#000]">
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* Right Action Icons: Sound Toggle & Sync Indicator */}
        <div className="flex items-center gap-2">
          {isSyncing && (
            <span
              title="Checking for incoming emails via polling..."
              className="inline-flex items-center gap-1.5 text-xs text-black font-mono font-black bg-lime-200 border-2 border-black px-2.5 py-1 rounded-md shadow-[1px_1px_0px_0px_#000]"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5] animate-spin" />
              <span className="hidden sm:inline">Syncing</span>
            </span>
          )}

          {onToggleAudio && (
            <button
              type="button"
              onClick={onToggleAudio}
              title={isAudioEnabled ? 'Audio Chime Enabled (Click to Mute)' : 'Audio Chime Muted (Click to Unmute)'}
              className={clsx(
                'p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-black',
                isAudioEnabled
                  ? 'bg-lime-300 text-black'
                  : 'bg-slate-200 text-slate-500'
              )}
            >
              {isAudioEnabled ? (
                <Volume2 className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <VolumeX className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Message List or Empty State */}
      {emails.length === 0 ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-black">
          <div className="p-4 bg-yellow-100 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] mb-3 text-black">
            <Inbox className="w-10 h-10 stroke-[2]" />
          </div>
          <h3 className="text-sm font-black text-black uppercase tracking-wider mb-1">
            Your temporary inbox is empty
          </h3>
          <p className="text-xs text-gray-700 font-medium max-w-sm mb-2">
            Waiting for incoming messages. Auto-refreshes every 5 seconds. You can also trigger an instant simulation below.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1 select-none">
          {emails.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              isSelected={email.id === selectedEmailId}
              onSelect={onSelectEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
};
