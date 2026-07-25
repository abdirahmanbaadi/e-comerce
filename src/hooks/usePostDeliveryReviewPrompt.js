import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/data';
import { useIntervalWhenVisible } from './useIntervalWhenVisible';

const POLL_INTERVAL_MS = 30 * 1000;

export default function usePostDeliveryReviewPrompt() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isCustomer = Boolean(user?.isLoggedIn && user?.token && (!user.role || user.role === 'user'));

  const openPrompt = useCallback((nextPrompt) => {
    if (!nextPrompt) return;
    setPrompt(nextPrompt);
    setModalOpen(true);
  }, []);

  const fetchLivePrompt = useCallback(async () => {
    if (!isCustomer) {
      setPrompt(null);
      setModalOpen(false);
      return null;
    }

    try {
      const res = await fetch(apiUrl('/api/reviews/prompt'), {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.success && data.prompt) {
        openPrompt(data.prompt);
        return data.prompt;
      }
      setPrompt(null);
      setModalOpen(false);
      return null;
    } catch {
      return null;
    }
  }, [isCustomer, user?.token, openPrompt]);

  useEffect(() => {
    if (!isCustomer) {
      setPrompt(null);
      setModalOpen(false);
    }
  }, [isCustomer]);

  useIntervalWhenVisible(fetchLivePrompt, POLL_INTERVAL_MS, isCustomer);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const updatePrompt = useCallback((next) => {
    setPrompt(next);
    if (next?.isComplete) {
      setModalOpen(false);
    }
  }, []);

  return {
    prompt,
    modalOpen,
    closeModal,
    updatePrompt,
    refreshPrompt: fetchLivePrompt,
  };
}
