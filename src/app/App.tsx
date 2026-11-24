import { useEffect } from 'react';
import { ToastHost } from '../components/Toast';
import { ArchivePage } from '../features/habit-management/ArchivePage';
import { HabitFormPage } from '../features/habit-management/HabitFormPage';
import { HabitDetailPage } from '../features/habit-tracking/HabitDetailPage';
import { TodayPage } from '../features/habit-tracking/TodayPage';
import { CalendarPage } from '../features/calendar/CalendarPage';
import { StatsPage } from '../features/statistics/StatsPage';
import { SettingsPage } from '../features/habits-settings/SettingsPage';
import { applyTheme } from '../features/habits-settings/theme';
import { tr, useLocale } from '../i18n/locale';
import { useHabitState } from '../stores/habitStore';
import { parseRoute, useHash } from './router';
import { Shell } from './Shell';

export function App() {
  const locale = useLocale();
  const state = useHabitState();
  const route = parseRoute(useHash());
  useEffect(() => applyTheme(state.settings.theme), [state.settings.theme]);

  let page: JSX.Element;
  let tab: 'today' | 'calendar' | 'stats' | 'settings' | null = null;
  switch (route.name) {
    case 'calendar':
      tab = 'calendar';
      page = <CalendarPage />;
      break;
    case 'stats':
      tab = 'stats';
      page = <StatsPage />;
      break;
    case 'settings':
      tab = 'settings';
      page = <SettingsPage />;
      break;
    case 'archive':
      page = <ArchivePage />;
      break;
    case 'new':
      page = <HabitFormPage habitId={null} />;
      break;
    case 'edit':
      page = <HabitFormPage key={route.id} habitId={route.id} />;
      break;
    case 'habit':
      page = <HabitDetailPage key={route.id} habitId={route.id} />;
      break;
    default:
      tab = 'today';
      page = <TodayPage key={route.day ?? 'today'} day={route.day} />;
  }
  return (
    // Remount on language change so every screen picks up the new text.
    <div key={locale} className="app" lang={locale}>
      <a className="skip-link" href="#main-content">
        {tr('Bỏ qua tới nội dung', 'Skip to content')}
      </a>
      <Shell active={tab}>{page}</Shell>
      <ToastHost />
    </div>
  );
}
