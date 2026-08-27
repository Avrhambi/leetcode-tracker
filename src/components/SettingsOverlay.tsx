import { useEffect, useRef } from 'react';
import { Settings } from './Settings';

interface SettingsOverlayProps {
  onClose: () => void;
}

// Full-screen overlay wrapping the existing Settings body. Esc or backdrop click
// closes it; focus moves to the dialog on open.
export function SettingsOverlay({ onClose }: SettingsOverlayProps) {
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
      aria-label="Settings"
      tabIndex={-1}
      ref={dialogRef}
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" className="settings-overlay-close" onClick={onClose} aria-label="Close settings">Close</button>
      <Settings />
    </div>
  </div>;
}
