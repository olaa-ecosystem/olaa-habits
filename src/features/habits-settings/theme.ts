import type { ThemeChoice } from '../../stores/habitState';

/** Light / dark / follow the device (data-theme on <html>, as in Olaa Note's tokens). */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
}
