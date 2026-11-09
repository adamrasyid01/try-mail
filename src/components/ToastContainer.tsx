import React from 'react';
import { Mail, X, Bell } from 'lucide-react';
import { ToastItem } from '../services/observer/listeners/ToastNotificationListener';

export interface ToastContainerProps {
  /** Array of active toast notification items */
  toasts: ToastItem[];
  /** Callback fired when a toast is dismissed */
  onDismiss: (id: string) => void;
  /** Optional callback when user clicks a toast to view the email */
  onToastClick?: (toast: ToastItem) => void;
}

/**
 * Presentational Dumb Component: ToastContainer
 * 
 * Renders floating notification toasts triggered by the Observer Pattern.
 * Neubrutalism style: solid bright fills, thick black borders, hard offset shadows.
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onToastClick,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full p-4 bg-yellow-200 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000] flex items-start justify-between gap-3 transform transition-all duration-200 animate-slide-up text-black"
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => onToastClick?.(toast)}
            className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer text-left"
          >
            <div className="p-2 bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] flex-shrink-0 mt-0.5">
              <Bell className="w-4 h-4 stroke-[2.5]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-black truncate">
                  {toast.senderName || toast.senderAddress}
                </span>
                <span className="text-[10px] text-gray-800 font-mono font-bold">Just now</span>
              </div>
              <p className="text-xs font-bold text-black truncate mt-0.5">
                {toast.subject || '(No Subject)'}
              </p>
              <p className="text-[11px] text-gray-800 font-medium flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3 text-black stroke-[2.5]" /> New email received! Click to open.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(toast.id);
            }}
            aria-label="Dismiss notification"
            className="p-1 bg-white hover:bg-rose-300 text-black border-2 border-black rounded-md shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all focus:outline-none"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      ))}
    </div>
  );
};
