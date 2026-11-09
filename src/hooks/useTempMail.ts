/**
 * Custom Hook: useTempMail
 * 
 * Acts as the reactive bridge between the TempMailFacade and React components.
 * Manages active mailbox lifecycle, initialization, provider selection, and storage sync.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tempMailFacade } from '../services/facade/TempMailFacade';
import { TemporaryMailbox, ProviderType } from '../types/mailbox.types';
import { ITempMailProvider } from '../services/adapter/ITempMailProvider';

export function useTempMail() {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<ITempMailProvider>(() =>
    tempMailFacade.getActiveProvider()
  );

  // Initialize or restore active mailbox
  const {
    data: mailbox,
    isLoading: isLoadingMailbox,
    isError,
    error,
    refetch: refetchMailbox,
  } = useQuery<TemporaryMailbox | null, Error>({
    queryKey: ['activeMailbox'],
    queryFn: async () => {
      // 1. Try restoring existing session
      const restored = tempMailFacade.getActiveMailbox() || tempMailFacade.restoreSession();
      if (restored) {
        setProvider(tempMailFacade.getActiveProvider());
        return restored;
      }

      // 2. Provision new mailbox on default provider
      const created = await tempMailFacade.createNewMailbox();
      setProvider(tempMailFacade.getActiveProvider());
      return created;
    },
    staleTime: Infinity, // Mailbox session doesn't auto-stale unless user changes it
  });

  // Mutation: Generate new mailbox
  const createMutation = useMutation({
    mutationFn: async (targetProvider?: ProviderType) => {
      const mb = await tempMailFacade.createNewMailbox(targetProvider);
      return mb;
    },
    onSuccess: (newMailbox) => {
      setProvider(tempMailFacade.getActiveProvider());
      queryClient.setQueryData(['activeMailbox'], newMailbox);
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });

  // Mutation: Delete current mailbox
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await tempMailFacade.disposeCurrentMailbox();
    },
    onSuccess: () => {
      queryClient.setQueryData(['activeMailbox'], null);
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      // Automatically provision a fresh mailbox after deletion
      createMutation.mutate();
    },
  });

  // Mutation: Switch provider
  const switchProviderMutation = useMutation({
    mutationFn: async (targetProviderId: ProviderType) => {
      const mb = await tempMailFacade.switchProvider(targetProviderId);
      return mb;
    },
    onSuccess: (newMailbox) => {
      setProvider(tempMailFacade.getActiveProvider());
      queryClient.setQueryData(['activeMailbox'], newMailbox);
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });

  const generateNewMailbox = useCallback(
    async (providerId?: ProviderType) => {
      return createMutation.mutateAsync(providerId);
    },
    [createMutation]
  );

  const deleteCurrentMailbox = useCallback(async () => {
    return deleteMutation.mutateAsync();
  }, [deleteMutation]);

  const changeProvider = useCallback(
    async (targetProviderId: ProviderType) => {
      return switchProviderMutation.mutateAsync(targetProviderId);
    },
    [switchProviderMutation]
  );

  return {
    mailbox: mailbox || null,
    isLoading: isLoadingMailbox || createMutation.isPending || switchProviderMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isError,
    errorMessage: error?.message || null,
    provider,
    availableProviders: tempMailFacade.getAvailableProviders(),
    generateNewMailbox,
    deleteCurrentMailbox,
    changeProvider,
    refetchMailbox,
  };
}
