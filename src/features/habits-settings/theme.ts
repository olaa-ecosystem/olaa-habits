import type { ThemeChoice } from '../../stores/habitState';

/**
 * Light / dark / follow the device, as `data-theme` on <html> (same as Olaa Language).
 * "Device" only removes a theme this app set itself, so a host page's own choice is kept
 * (for example the viewer's theme when the app runs as an Artifact).
 */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') {
    if (root.dataset.habitsTheme) {
      root.removeAttribute('data-theme');
      delete root.dataset.habitsTheme;
    }
  } else {
    root.setAttribute('data-theme', choice);
    root.dataset.habitsTheme = '1';
  }
}
