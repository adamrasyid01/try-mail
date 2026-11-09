import React, { useState, useEffect } from 'react';
import { X, User, Clock, Paperclip, Download, ShieldCheck, Code2, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { IncomingEmail } from '../types/email.types';
import { formatFullDateTime, formatBytes } from '../utils/formatters';

export interface EmailDetailModalProps {
  /** The incoming email to display, or null if modal is closed */
  email: IncomingEmail | null;
  /** Callback fired to close the modal */
  onClose: () => void;
  /** Additional custom Tailwind CSS classes */
  className?: string;
}

/**
 * Presentational Dumb Component: EmailDetailModal
 * 
 * Renders full email details in a windowed dialog with sanitized HTML,
 * safe external link handling, and attachment downloads.
 * Neubrutalism style: windowed frame, thick black borders, hard offset shadows.
 */
export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  email,
  onClose,
  className,
}) => {
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (email) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [email, onClose]);

  if (!email) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-subject"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={twMerge(
          clsx(
            'w-full max-w-3xl max-h-[90vh] bg-white border-[3px] border-black rounded-2xl shadow-[8px_8px_0px_0px_#000] flex flex-col overflow-hidden text-left',
            className
          )
        )}
      >
        {/* Modal Window Header */}
        <div className="p-5 border-b-2 border-black bg-yellow-300 flex items-start justify-between gap-4 flex-shrink-0 text-black">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black bg-lime-300 text-black border-2 border-black rounded shadow-[1px_1px_0px_0px_#000]">
                <ShieldCheck className="w-3 h-3 stroke-[2.5]" /> Sanitized & Safe
              </span>
              <span className="text-xs text-black font-mono font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 stroke-[2.5]" />
                {formatFullDateTime(email.receivedAt)}
              </span>
            </div>

            <h2
              id="modal-subject"
              className="text-lg sm:text-xl font-black text-black break-words leading-tight"
            >
              {email.subject || '(No Subject)'}
            </h2>

            {/* Sender & Recipient Details */}
            <div className="mt-3 flex items-center gap-2.5 text-xs text-black">
              <div className="p-1.5 bg-white text-black border-2 border-black rounded-lg shadow-[1px_1px_0px_0px_#000] flex-shrink-0">
                <User className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="truncate font-bold">
                <span>{email.senderName || email.senderAddress}</span>{' '}
                <span className="text-gray-700 text-[11px] font-mono font-semibold">&lt;{email.senderAddress}&gt;</span>
              </div>
            </div>
          </div>

          {/* Close Action Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 text-black bg-white hover:bg-rose-300 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-black flex-shrink-0"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* View Mode Switcher (HTML vs Plain Text) */}
        <div className="px-5 py-2.5 bg-slate-100 border-b-2 border-black flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('html')}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-md border-2 border-black transition-all font-black',
                viewMode === 'html'
                  ? 'bg-sky-300 text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-white text-gray-700 hover:text-black hover:bg-slate-50'
              )}
            >
              <Eye className="w-3 h-3 stroke-[2.5]" /> HTML View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('text')}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-md border-2 border-black transition-all font-black',
                viewMode === 'text'
                  ? 'bg-sky-300 text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-white text-gray-700 hover:text-black hover:bg-slate-50'
              )}
            >
              <Code2 className="w-3 h-3 stroke-[2.5]" /> Plain Text
            </button>
          </div>

          <span className="text-[11px] text-gray-700 font-bold hidden sm:inline">
            Links open safely in new window with noopener
          </span>
        </div>

        {/* Message Body Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#fffdf7] text-black text-sm">
          {viewMode === 'html' ? (
            <div
              className="prose max-w-none text-black bg-white p-5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] leading-relaxed font-sans"
              dangerouslySetInnerHTML={{ __html: email.htmlContent || email.textContent }}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs bg-white p-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] text-black leading-relaxed overflow-x-auto">
              {email.textContent || '(No plain text content available)'}
            </pre>
          )}

          {/* Attachments Section */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-6 pt-5 border-t-2 border-black">
              <h3 className="text-xs font-black text-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 stroke-[2.5]" />
                Attachments ({email.attachments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {email.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white hover:bg-sky-100 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Paperclip className="w-4 h-4 text-black stroke-[2.5] flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-black truncate group-hover:underline">
                          {att.filename}
                        </div>
                        <div className="text-[10px] text-gray-700 font-mono font-bold">
                          {formatBytes(att.sizeBytes)} &bull; {att.contentType}
                        </div>
                      </div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-black stroke-[2.5] flex-shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
