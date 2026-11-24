import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { showToast } from './components/Toast';
import { BADGE_TEXT } from './features/gamification/badges';
import { startReminders } from './features/reminders/reminderService';
import { getLocale, tr } from './i18n/locale';
import { startCloudSync } from './services/cloudSync';
import { habitStore } from './stores/habitStore';
import './styles/global.css';
import './styles/layout.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

habitStore.load();
habitStore.onBadges((badges) => {
  const first = badges[0];
  if (!first) return;
  const [title] = BADGE_TEXT[first.id][getLocale()];
  showToast({ text: tr(`Huy hiệu mới: ${title}`, `New badge: ${title}`), tone: 'reward' });
});
startCloudSync();
startReminders();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
