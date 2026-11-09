import React from 'react';
import { RefreshCw, Trash2, Loader2, Send } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ActionToolbarProps {
  /** Trigger manual inbox synchronization */
  onRefresh: () => void;
  /** Trigger deletion of active mailbox session */
  onDeleteMailbox: () => void;
  /** Trigger simulation of an incoming email (offline mock mode only) */
  onSimulateEmail?: () => void;
  /** Whether to show the simulate email action (only true in offline mock mode) */
  showSimulate?: boolean;
  /** Whether an inbox sync operation is currently pending */
  isRefreshing?: boolean;
  /** Whether deletion is currently pending */
  isDeleting?: boolean;
  /** Whether email simulation is currently executing */
  isSimulating?: boolean;
  /** Whether all actions should be temporarily disabled */
  disabled?: boolean;
  /** Additional custom classes for layout flexibility */
  className?: string;
}

/**
 * Presentational Dumb Component: ActionToolbar
 * 
 * Provides unified lifecycle and test controls in a single toolbar:
 * - Refresh Inbox (Left)
 * - Simulate Incoming Email (Left - conditional: offline/mock mode only)
 * - Delete Mailbox (Right)
 * 
 * Neubrutalism style: solid bright fills, thick black borders, hard offset shadows.
 */
export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onRefresh,
  onDeleteMailbox,
  onSimulateEmail,
  showSimulate = false,
  isRefreshing = false,
  isDeleting = false,
  isSimulating = false,
  disabled = false,
  className,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="Mailbox lifecycle controls"
      className={twMerge(
        clsx(
          'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]',
          className
        )
      )}
    >
      {/* Left Action Group: Simulate (when available) & Refresh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {showSimulate && onSimulateEmail && (
          <button
            type="button"
            onClick={onSimulateEmail}
            disabled={disabled || isSimulating}
            title="Inject a realistic incoming email to test notifications"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-300 hover:bg-sky-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-black text-xs font-black uppercase tracking-wider border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSimulating ? (
              <Loader2 className="w-3.5 h-3.5 stroke-[2.5] animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>{isSimulating ? 'Simulating...' : 'Simulate Incoming Email'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onRefresh}
          disabled={disabled || isRefreshing}
          title="Check inbox immediately"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-300 hover:bg-yellow-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-black text-xs font-black uppercase tracking-wider border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5 stroke-[2.5]', isRefreshing && 'animate-spin')} />
          <span>{isRefreshing ? 'Checking...' : 'Refresh Inbox'}</span>
        </button>
      </div>

      {/* Right Action Group: Delete Inbox */}
      <button
        type="button"
        onClick={onDeleteMailbox}
        disabled={disabled || isDeleting}
        title="Delete current inbox and wipe local session"
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-300 hover:bg-rose-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-black text-xs font-black uppercase tracking-wider border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? (
          <Loader2 className="w-3.5 h-3.5 stroke-[2.5] animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
        )}
        <span>{isDeleting ? 'Deleting...' : 'Delete Inbox'}</span>
      </button>
    </div>
  );
};
