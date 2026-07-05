import { useEffect } from 'react';

export default function ProfileOverlayModal({ isOpen, onClose, title, icon, children, footer }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="pf-react-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-dialog modal-dialog-centered od-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pf-modal-title"
      >
        <div className="modal-content od-modal-content">
          <div className="od-modal-header">
            <div className="od-header-title-area">
              {icon && <div className="od-header-icon-wrap">{icon}</div>}
              <h2 className="od-modal-title" id="pf-modal-title">
                {title}
              </h2>
            </div>
            <button type="button" className="od-btn-close" onClick={onClose} aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="modal-body p-4">{children}</div>
          {footer && <div className="od-modal-footer d-flex justify-content-center gap-3">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
