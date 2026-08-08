import { useCallback, useEffect, useRef, useState } from 'react';

const DISMISS_PX = 100;
const EXPAND_PX = 48;
const COLLAPSE_PX = 56;
/** Max sheet height when expanded — not full screen. */
export const SHEET_EXPANDED_MAX = '85dvh';
export const SHEET_COLLAPSED_MAX = '68dvh';

/**
 * Drag handle for bottom sheets:
 * - drag down past threshold → close
 * - drag up a bit → expand (capped, not full screen)
 * - drag down while expanded → collapse
 */
export function useSheetDrag({ open, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startExpanded = useRef(false);
  const liveY = useRef(0);

  useEffect(() => {
    if (!open) {
      setExpanded(false);
      setDragY(0);
      setDragging(false);
      liveY.current = 0;
    }
  }, [open]);

  const onHandlePointerDown = useCallback((event) => {
    if (event.button != null && event.button !== 0) return;
    startY.current = event.clientY;
    startExpanded.current = expanded;
    liveY.current = 0;
    setDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  }, [expanded]);

  const onHandlePointerMove = useCallback((event) => {
    if (!dragging) return;
    const dy = event.clientY - startY.current;
    liveY.current = dy;
    // Allow slight upward pull for expand feedback; downward for dismiss.
    const clamped = Math.max(-72, Math.min(dy, 220));
    setDragY(clamped);
  }, [dragging]);

  const finish = useCallback(() => {
    if (!dragging) return;
    const dy = liveY.current;
    setDragging(false);
    setDragY(0);
    liveY.current = 0;

    if (dy >= DISMISS_PX) {
      onClose?.();
      return;
    }
    if (!startExpanded.current && dy <= -EXPAND_PX) {
      setExpanded(true);
      return;
    }
    if (startExpanded.current && dy >= COLLAPSE_PX) {
      setExpanded(false);
    }
  }, [dragging, onClose]);

  const onHandlePointerUp = useCallback(
    (event) => {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      finish();
    },
    [finish]
  );

  const sheetStyle = {
    maxHeight: expanded ? SHEET_EXPANDED_MAX : SHEET_COLLAPSED_MAX,
    transform: `translateY(${Math.max(0, dragY)}px)`,
    transition: dragging ? 'none' : 'transform 0.28s ease-out, max-height 0.28s ease-out',
  };

  const handleProps = {
    onPointerDown: onHandlePointerDown,
    onPointerMove: onHandlePointerMove,
    onPointerUp: onHandlePointerUp,
    onPointerCancel: onHandlePointerUp,
    style: { touchAction: 'none', cursor: 'grab' },
  };

  return { expanded, dragging, sheetStyle, handleProps };
}
