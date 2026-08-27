import { useEffect, useRef, type ReactNode } from 'react';

interface OverlayProps {
  label: string;
  onClose: () => void;
  children: ReactNode;
}

// The one modal shell in the app, used by Settings and by the daily challenge.
// Esc or a backdrop click closes it; focus moves to the dialog on open. The
// panel body scrolls internally, so a tall modal never scrolls the page behind
// it (the shell in global.css sets `overflow: hidden` on html/body).
export function Overlay({ label, onClose, children }: OverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return <div className="settings-overlay" onClick={onClose}>
    <div
      className="settings-overlay-panel"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      ref={dialogRef}
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" className="settings-overlay-close" onClick={onClose} aria-label={`Close ${label.toLowerCase()}`}>Close</button>
      <div className="settings-overlay-body">{children}</div>
    </div>
  </div>;
}
