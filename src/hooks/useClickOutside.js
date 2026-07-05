import { useEffect } from 'react';

export function useClickOutside(ref, onClose, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose, enabled]);
}
