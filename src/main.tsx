/**
 * Entry point: the interface (shared Olaa glass style) plus the data services — local store,
 * account sync, Language events and reminders.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { toast } from './components/ui';
import { BADGE_TEXT } from './features/gamification/badges';
import { startReminders } from './features/reminders/reminderService';
import { applyTheme } from './features/habits-settings/theme';
import { getLocale, tr } from './i18n/locale';
import { startCloudSync } from './services/cloudSync';
import { habitStore } from './stores/habitStore';
import './styles/fonts.css';
import './styles/app.css';

habitStore.load();
applyTheme(habitStore.getState().settings.theme);
habitStore.onBadges((badges) => {
  const first = badges[0];
  if (!first) return;
  const [title] = BADGE_TEXT[first.id][getLocale()];
  toast(tr(`Huy hiệu mới: ${title}`, `New badge: ${title}`), { reward: true });
});
startCloudSync();
startReminders();

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
