import React from 'react';
import { Mail, AlertCircle, RefreshCw, Shuffle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TemporaryMailbox } from '../types/mailbox.types';
import { CopyButton } from './CopyButton';

export interface MailboxHeaderProps {
  /** The currently active temporary mailbox entity */
  mailbox: TemporaryMailbox | null;
  /** Whether the mailbox is currently initializing or regenerating */
  isLoading?: boolean;
  /** Error message string if initialization failed */
  errorMessage?: string | null;
  /** Human-readable name of the active provider */
  providerName?: string;
  /** Optional interactive provider selector element */
  providerSelector?: React.ReactNode;
  /** Callback to generate a new replacement address */
  onChangeAddress?: () => void;
  /** Whether a new address is currently being provisioned */
  isChangingAddress?: boolean;
  /** Additional custom Tailwind CSS classes */
  className?: string;
}

/**
 * Presentational Dumb Component: MailboxHeader
 * 
 * Displays the current temporary email address, provider status,
 * one-click copy button, and adjacent Change Address button.
 * Neubrutalism style: solid bright fills, thick black borders, hard offset shadows.
 */
export const MailboxHeader: React.FC<MailboxHeaderProps> = ({
  mailbox,
  isLoading = false,
  errorMessage = null,
  providerName = 'Mock Mail',
  providerSelector,
  onChangeAddress,
  isChangingAddress = false,
  className,
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'w-full bg-white rounded-xl border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000] transition-all duration-150',
          className
        )
      )}
    >
      {/* Top Metadata Row: Status & Provider */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 pb-4 mb-4 border-b-2 border-black text-xs">

        {providerSelector ? (
          providerSelector
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-200 text-black border-2 border-black rounded-lg font-bold shadow-[2px_2px_0px_0px_#000]">

            <span>{providerName}</span>
          </div>
        )}
      </div>

      {/* Main Address Display, Copy, and Change Address Actions */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-black">
          <div className="p-3 bg-yellow-300 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000]">
            <RefreshCw className="w-6 h-6 stroke-[2.5] animate-spin text-black" />
          </div>
          <span className="text-sm font-black uppercase tracking-wide">Generating address via Facade...</span>
        </div>
      ) : errorMessage ? (
        <div className="p-4 bg-rose-200 border-2 border-black rounded-xl text-black text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
          <AlertCircle className="w-4 h-4 text-black stroke-[2.5] flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : mailbox ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-sky-100 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 bg-yellow-300 text-black rounded-lg flex-shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              <Mail className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-[11px] text-gray-700 uppercase tracking-wider font-black">
                Your Temporary Email Address
              </div>
              <div
                title={mailbox.address}
                className="font-mono text-base sm:text-lg font-black text-black truncate select-all"
              >
                {mailbox.address}
              </div>
            </div>
          </div>

          {/* Action Buttons: Copy Address & Change Address */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center flex-shrink-0">
            <CopyButton
              textToCopy={mailbox.address}
              label="Copy Address"
              copiedLabel="Copied!"
            />

            {onChangeAddress && (
              <button
                type="button"
                onClick={onChangeAddress}
                disabled={isLoading || isChangingAddress}
                title="Generate another email address"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-black bg-white hover:bg-slate-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingAddress ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
                ) : (
                  <Shuffle className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>{isChangingAddress ? 'Changing...' : 'Change Address'}</span>
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
