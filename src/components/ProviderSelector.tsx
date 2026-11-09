import React from 'react';
import { Server, Wifi, WifiOff, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ProviderType } from '../types/mailbox.types';
import { ITempMailProvider } from '../services/adapter/ITempMailProvider';

export interface ProviderSelectorProps {
  /** The currently selected provider ID */
  activeProviderId: ProviderType;
  /** List of registered provider adapters */
  availableProviders: ITempMailProvider[];
  /** Callback fired when user chooses a different provider */
  onSelectProvider: (providerId: ProviderType) => void;
  /** Whether the selector is disabled during asynchronous operations */
  disabled?: boolean;
  /** Additional custom classes for layout flexibility */
  className?: string;
}

/**
 * Presentational Dumb Component: ProviderSelector
 * 
 * Allows users to hot-swap between disposable email providers (Adapter Pattern).
 * Neubrutalism style: solid pastel backgrounds, thick black borders, hard offset shadows.
 */
export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  activeProviderId,
  availableProviders,
  onSelectProvider,
  disabled = false,
  className,
}) => {
  const currentProvider = availableProviders.find((p) => p.providerId === activeProviderId);

  return (
    <div
      className={twMerge(
        clsx(
          'inline-flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] text-xs font-bold text-black',
          className
        )
      )}
    >
      <div className="flex items-center gap-1.5 text-black">
        <Server className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="font-extrabold uppercase tracking-wide text-[10px] hidden sm:inline">Provider:</span>
      </div>

      <div className="relative inline-flex items-center">
        <select
          value={activeProviderId}
          disabled={disabled}
          onChange={(e) => onSelectProvider(e.target.value as ProviderType)}
          aria-label="Select Email Provider Adapter"
          className="appearance-none bg-sky-200 hover:bg-sky-300 text-black font-bold pl-2.5 pr-7 py-1 rounded-md border-2 border-black focus:outline-none focus:ring-2 focus:ring-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[1px_1px_0px_0px_#000]"
        >
          {availableProviders.map((prov) => (
            <option key={prov.providerId} value={prov.providerId}>
              {prov.displayName} {prov.isOffline ? '(Offline)' : '(Online)'}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-black stroke-[2.5] absolute right-2 pointer-events-none" />
      </div>

      {/* Online / Offline Status Indicator */}
      <span
        title={currentProvider?.isOffline ? 'Offline mock provider' : 'Live internet provider'}
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded border-2 border-black text-[10px] font-extrabold uppercase tracking-wide shadow-[1px_1px_0px_0px_#000]',
          currentProvider?.isOffline
            ? 'bg-amber-300 text-black'
            : 'bg-lime-300 text-black'
        )}
      >
        {currentProvider?.isOffline ? (
          <>
            <WifiOff className="w-3 h-3 stroke-[2.5]" /> Offline
          </>
        ) : (
          <>
            <Wifi className="w-3 h-3 stroke-[2.5]" /> Live
          </>
        )}
      </span>
    </div>
  );
};
