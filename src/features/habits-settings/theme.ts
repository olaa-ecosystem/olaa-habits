import type { ThemeChoice } from '../../stores/habitState';

/** Light / dark / follow the device, as `data-theme` on <html> (same as Olaa Language). */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
}
