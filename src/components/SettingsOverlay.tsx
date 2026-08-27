import { Overlay } from './Overlay';
import { Settings } from './Settings';

export function SettingsOverlay({ onClose }: { onClose: () => void }) {
  return <Overlay label="Settings" onClose={onClose}><Settings /></Overlay>;
}
