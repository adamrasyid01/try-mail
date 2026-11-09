import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { POLLING_CONFIG } from '../library/constants';

export interface CopyButtonProps {
  /** The text string to copy to the system clipboard */
  textToCopy: string;
  /** Label to display next to the copy icon (optional) */
  label?: string;
  /** Label to display when text is successfully copied */
  copiedLabel?: string;
  /** Additional custom Tailwind CSS classes */
  className?: string;
  /** Callback fired after successful copy */
  onCopySuccess?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Presentational Dumb Component: CopyButton
 * 
 * Provides one-click clipboard copying with visual confirmation.
 * Neubrutalism style: solid bright background, thick black border, hard offset shadow.
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label = 'Copy',
  copiedLabel = 'Copied!',
  className,
  onCopySuccess,
  disabled = false,
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = useCallback(async () => {
    if (!textToCopy || disabled || isCopied) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for non-HTTPS or legacy browser environments
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setIsCopied(true);
      onCopySuccess?.();

      setTimeout(() => {
        setIsCopied(false);
      }, POLLING_CONFIG.COPY_TOOLTIP_DURATION_MS);
    } catch (err) {
      console.error('[CopyButton] Failed to copy text to clipboard:', err);
    }
  }, [textToCopy, disabled, isCopied, onCopySuccess]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled || !textToCopy}
      aria-label={isCopied ? copiedLabel : `${label} address to clipboard`}
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-black border-2 border-black rounded-lg transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed',
          isCopied
            ? 'bg-lime-300 shadow-[2px_2px_0px_0px_#000]'
            : 'bg-yellow-300 hover:bg-yellow-400 shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
          className
        )
      )}
    >
      {isCopied ? (
        <>
          <Check className="w-3.5 h-3.5 text-black stroke-[2.5]" />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-black stroke-[2.5]" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
