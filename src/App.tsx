import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTempMail } from './hooks/useTempMail';
import { useMailObserver } from './hooks/useMailObserver';
import { MailboxHeader } from './components/MailboxHeader';
import { ProviderSelector } from './components/ProviderSelector';
import { ActionToolbar } from './components/ActionToolbar';
import { InboxList } from './components/InboxList';
import { EmailDetailModal } from './components/EmailDetailModal';
import { ToastContainer } from './components/ToastContainer';
import { tempMailFacade } from './services/facade/TempMailFacade';
import { IncomingEmail } from './types/email.types';
import { ProviderType } from './types/mailbox.types';
import { POLLING_CONFIG } from './library/constants';

const App: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    mailbox,
    isLoading: isLoadingMailbox,
    isDeleting,
    errorMessage,
    provider,
    availableProviders,
    generateNewMailbox,
    deleteCurrentMailbox,
    changeProvider,
  } = useTempMail();

  const {
    toasts,
    dismissToast,
    isAudioEnabled,
    toggleAudio,
    setUnreadBadgeCount,
  } = useMailObserver();

  const [selectedEmail, setSelectedEmail] = useState<IncomingEmail | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // TanStack Query: Periodic background polling for incoming messages
  const {
    data: inbox = [],
    isFetching: isSyncing,
    refetch: refetchInbox,
  } = useQuery<IncomingEmail[]>({
    queryKey: ['inbox', mailbox?.id],
    queryFn: async () => {
      if (!mailbox?.id) return [];
      return tempMailFacade.syncInbox();
    },
    enabled: Boolean(mailbox?.id),
    refetchInterval: POLLING_CONFIG.INBOX_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  // Synchronize browser tab title badge with unread message count
  useEffect(() => {
    const unread = inbox.filter((m) => !m.isRead).length;
    setUnreadBadgeCount(unread);
  }, [inbox, setUnreadBadgeCount]);

  // Handle email inspection, mark as read, and sync URL query parameter (?mailId=...)
  const handleSelectEmail = async (email: IncomingEmail) => {
    try {
      const detailed = await tempMailFacade.openEmail(email.id);
      setSelectedEmail(detailed);

      // Deep link query parameter
      const url = new URL(window.location.href);
      url.searchParams.set('mailId', email.id);
      window.history.pushState({}, '', url.toString());

      // Update TanStack Query cache so unread badge and card highlight update instantly
      queryClient.setQueryData<IncomingEmail[]>(['inbox', mailbox?.id], (old) => {
        if (!old) return [];
        return old.map((m) => (m.id === email.id ? { ...m, isRead: true } : m));
      });
    } catch (err) {
      console.error('Failed to open email:', err);
    }
  };

  // Close email detail modal and clear URL query parameter
  const handleCloseModal = () => {
    setSelectedEmail(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('mailId');
    window.history.pushState({}, '', url.toString());
  };

  // Popstate listener to handle browser back / forward navigation for modal state
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const mailId = params.get('mailId');
      if (mailId && mailbox?.id) {
        tempMailFacade
          .openEmail(mailId)
          .then((detail) => setSelectedEmail(detail))
          .catch(() => setSelectedEmail(null));
      } else {
        setSelectedEmail(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mailbox?.id]);

  // Initial deep link restoration if ?mailId=... is present in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mailId = params.get('mailId');
    if (mailId && mailbox?.id && !selectedEmail) {
      tempMailFacade
        .openEmail(mailId)
        .then((detail) => setSelectedEmail(detail))
        .catch(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('mailId');
          window.history.replaceState({}, '', url.toString());
        });
    }
  }, [mailbox?.id, inbox.length, selectedEmail]);

  // Switch Provider Handler (Adapter Pattern)
  const handleProviderChange = async (targetId: ProviderType) => {
    handleCloseModal();
    try {
      await changeProvider(targetId);
    } catch (err) {
      console.error('Failed to switch provider:', err);
    }
  };

  // Lifecycle action: Change Address (provision fresh mailbox)
  const handleChangeAddress = async () => {
    handleCloseModal();
    await generateNewMailbox();
  };

  // Lifecycle action: Delete Mailbox (dispose and regenerate)
  const handleDeleteMailbox = async () => {
    if (window.confirm('Are you sure you want to delete this temporary mailbox? All inbox emails will be discarded.')) {
      handleCloseModal();
      await deleteCurrentMailbox();
    }
  };

  // Handler for simulating an incoming email on demand (Observer pattern test)
  const handleSimulateEmail = async () => {
    if (!mailbox?.id || isSimulating) return;

    try {
      setIsSimulating(true);
      await tempMailFacade.simulateIncomingEmail();
      await refetchInbox();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf7] text-black flex flex-col items-center py-10 px-4 sm:px-6">
      {/* Top Branding Section */}
      <header className="flex flex-col items-center text-center max-w-xl mb-6">

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black mb-1.5 uppercase flex items-center justify-center flex-wrap gap-2">
          TryMail{' '}

        </h1>
        <p className="text-xs sm:text-sm text-gray-800 font-bold max-w-lg">
          Disposable Temporary Email Service with GoF Design Patterns
        </p>

        {/* GoF Pattern Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-200 text-black border-2 border-black rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_#000]">
            Adapter Pattern
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-200 text-black border-2 border-black rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_#000]">
            Facade Pattern
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-lime-200 text-black border-2 border-black rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_#000]">
            Observer Pattern
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl flex flex-col gap-5">
        {/* User Story 1 & 5: Mailbox Header Card with Provider Selector */}
        <MailboxHeader
          mailbox={mailbox}
          isLoading={isLoadingMailbox}
          errorMessage={errorMessage}
          providerName={provider.displayName}
          providerSelector={
            <ProviderSelector
              activeProviderId={provider.providerId}
              availableProviders={availableProviders}
              onSelectProvider={handleProviderChange}
              disabled={isLoadingMailbox || isDeleting}
            />
          }
          onChangeAddress={handleChangeAddress}
          isChangingAddress={isLoadingMailbox}
        />

        {/* User Story 4 & 5: Mailbox Lifecycle & Simulation Action Toolbar */}
        <ActionToolbar
          onRefresh={() => refetchInbox()}
          onDeleteMailbox={handleDeleteMailbox}
          onSimulateEmail={handleSimulateEmail}
          showSimulate={provider.providerId === 'mock'}
          isRefreshing={isSyncing}
          isDeleting={isDeleting}
          isSimulating={isSimulating}
          disabled={!mailbox}
        />

        {/* User Story 2: Inbox Message List */}
        <InboxList
          emails={inbox}
          isSyncing={isSyncing}
          selectedEmailId={selectedEmail?.id}
          onSelectEmail={handleSelectEmail}
          isAudioEnabled={isAudioEnabled}
          onToggleAudio={toggleAudio}
        />
      </main>

      {/* User Story 3: Email Detail Modal */}
      <EmailDetailModal
        email={selectedEmail}
        onClose={handleCloseModal}
      />

      {/* Floating Toast Notification Container (Observer Pattern) */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onToastClick={(toast) => {
          const match = inbox.find(
            (m) => m.id.includes(toast.id.replace('toast_', '')) || m.subject === toast.subject
          );
          if (match) handleSelectEmail(match);
        }}
      />


    </div>
  );
};

export default App;
