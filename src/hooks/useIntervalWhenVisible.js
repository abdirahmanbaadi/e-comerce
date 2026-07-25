import { useEffect, useRef } from 'react';

/**
 * Runs callback on an interval only while the tab is visible.
 * Pauses when the user switches tabs — reduces server load.
 */
export function useIntervalWhenVisible(callback, delayMs, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !delayMs || delayMs < 1000) return undefined;

    const tick = () => {
      if (document.hidden) return;
      savedCallback.current();
    };

    tick();
    const id = window.setInterval(tick, delayMs);
    const onVisible = () => {
      if (!document.hidden) savedCallback.current();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [delayMs, enabled]);
}
