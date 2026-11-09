/**
 * Custom Hook: useMailObserver
 * 
 * Subscribes the React application to the Observer pattern Subject (MailEventManager).
 * Manages the lifecycle of:
 * - AudioAlertListener (Web Audio chime)
 * - TabTitleBadgeListener (Document title unread counter)
 * - ToastNotificationListener (Floating toast popups)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { tempMailFacade } from '../services/facade/TempMailFacade';
import { AudioAlertListener } from '../services/observer/listeners/AudioAlertListener';
import { TabTitleBadgeListener } from '../services/observer/listeners/TabTitleBadgeListener';
import { ToastNotificationListener, ToastItem } from '../services/observer/listeners/ToastNotificationListener';

export function useMailObserver() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

  // Maintain singleton listener instances per hook lifecycle
  const audioListenerRef = useRef<AudioAlertListener | null>(null);
  const tabTitleListenerRef = useRef<TabTitleBadgeListener | null>(null);
  const toastListenerRef = useRef<ToastNotificationListener | null>(null);

  if (!audioListenerRef.current) {
    audioListenerRef.current = new AudioAlertListener();
  }
  if (!tabTitleListenerRef.current) {
    tabTitleListenerRef.current = new TabTitleBadgeListener();
  }
  if (!toastListenerRef.current) {
    toastListenerRef.current = new ToastNotificationListener();
  }

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleAudio = useCallback(() => {
    if (audioListenerRef.current) {
      const next = !audioListenerRef.current.getIsEnabled();
      audioListenerRef.current.setEnabled(next);
      setIsAudioEnabled(next);
    }
  }, []);

  const setUnreadBadgeCount = useCallback((count: number) => {
    tabTitleListenerRef.current?.setUnreadCount(count);
  }, []);

  useEffect(() => {
    const eventManager = tempMailFacade.getEventManager();
    const audioListener = audioListenerRef.current!;
    const tabTitleListener = tabTitleListenerRef.current!;
    const toastListener = toastListenerRef.current!;

    setIsAudioEnabled(audioListener.getIsEnabled());

    // 1. Subscribe Audio Listener
    const unsubAudio = eventManager.subscribe('EMAIL_RECEIVED', audioListener);

    // 2. Subscribe Tab Title Listener
    const unsubTitle1 = eventManager.subscribe('EMAIL_RECEIVED', tabTitleListener);
    const unsubTitle2 = eventManager.subscribe('MAILBOX_CREATED', tabTitleListener);
    const unsubTitle3 = eventManager.subscribe('MAILBOX_DELETED', tabTitleListener);

    // 3. Subscribe Toast Listener & listen for toast emissions
    const unsubToastEvent = eventManager.subscribe('EMAIL_RECEIVED', toastListener);
    const unsubToastCallback = toastListener.subscribe((newToast) => {
      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep up to 5 concurrent toasts

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        dismissToast(newToast.id);
      }, 6000);
    });

    return () => {
      unsubAudio();
      unsubTitle1();
      unsubTitle2();
      unsubTitle3();
      unsubToastEvent();
      unsubToastCallback();
      tabTitleListener.resetTitle();
    };
  }, [dismissToast]);

  return {
    toasts,
    dismissToast,
    isAudioEnabled,
    toggleAudio,
    setUnreadBadgeCount,
  };
}

