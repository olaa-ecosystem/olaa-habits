/**
 * App frame shared with Olaa Language and Olaa Note: drifting pastel field, film grain, glass
 * top bar with the app switcher (Language → Note → Habits), and the floating glass navigation
 * (bottom on phones, side rail on wide screens).
 */
import { useEffect, type ReactNode } from 'react';
import { Field } from '../components/Field';
import { Icon, type IconName } from '../components/Icon';
import { AppTile, Toasts, useToday } from '../components/ui';
import { dayProgress } from '../features/habit-tracking/progress';
import { applyTheme } from '../features/habits-settings/theme';
import { fullDayStreak } from '../features/streaks/streaks';
import { tr, useLocale } from '../i18n/locale';
import { LANGUAGE_URL, TAKENOTE_URL } from '../integrations/olaaApps';
import { updateSettings } from '../stores/habitActions';
import { habitStore, useHabitState } from '../stores/habitStore';
import type { ThemeChoice } from '../stores/habitState';
import { fromDayKey } from '../utils/date';
import { CalendarPage } from '../pages/CalendarPage';
import { HabitFormPage } from '../pages/HabitFormPage';
import { HabitPage } from '../pages/HabitPage';
import { HabitsPage } from '../pages/HabitsPage';
import { MePage } from '../pages/MePage';
import { StatsPage } from '../pages/StatsPage';
import { TodayPage } from '../pages/TodayPage';
import { sectionOf, useRoute, type Route, type Section } from './router';

const NAV: { section: Section; href: string; icon: IconName; label: [string, string] }[] = [
  { section: 'today', href: '#today', icon: 'habits', label: ['Hôm nay', 'Today'] },
  { section: 'calendar', href: '#calendar', icon: 'calendar', label: ['Lịch', 'Calendar'] },
  { section: 'habits', href: '#habits', icon: 'collections', label: ['Thói quen', 'Habits'] },
  { section: 'stats', href: '#stats', icon: 'progress', label: ['Thống kê', 'Stats'] },
  { section: 'me', href: '#me', icon: 'profile', label: ['Hồ sơ', 'Me'] },
];

function nextTheme(theme: ThemeChoice): ThemeChoice {
  return theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
}

function Nav({ route }: { route: Route }) {
  const current = sectionOf(route);
  return (
    <nav className="nav" aria-label={tr('Điều hướng chính', 'Main navigation')}>
      {NAV.map((n) => (
        <a key={n.section} href={n.href} aria-current={current === n.section ? 'page' : undefined}>
          <Icon name={n.icon} />
          <span>{tr(...n.label)}</span>
        </a>
      ))}
    </nav>
  );
}

function TopBar() {
  const state = useHabitState();
  const today = useToday();
  const locale = useLocale();
  const theme = state.settings.theme;
  const p = dayProgress(state, today);
  const streak = fullDayStreak(state, today);
  const date = fromDayKey(today).toLocaleDateString(locale === 'en' ? 'en-GB' : 'vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const themeLabel = {
    system: tr('Theo thiết bị', 'Device'),
    light: tr('Sáng', 'Light'),
    dark: tr('Tối', 'Dark'),
  }[theme];
  return (
    <header className="topbar">
      <a href="#today" className="wordmark" style={{ color: 'inherit', textDecoration: 'none' }}>
        olaa <span>habits</span>
      </a>
      <div className="topbar__when">
        <b>{date}</b>
        <small>
          {tr(`${p.done}/${p.total} thói quen hôm nay`, `${p.done}/${p.total} habits today`)}
        </small>
      </div>
      <div className="topbar__spacer" />
      <span className="streak-pill" title={tr('Ngày trọn vẹn liên tiếp', 'Full days in a row')}>
        <Icon name="flame" />
        {streak}
        <span className="sr-only">{tr('ngày trọn vẹn liên tiếp', 'full days in a row')}</span>
      </span>
      <button
        type="button"
        className="iconbtn topbar__theme"
        onClick={() => habitStore.update((s) => updateSettings(s, { theme: nextTheme(theme) }))}
        aria-label={tr(
          `Giao diện: ${themeLabel}. Bấm để đổi`,
          `Theme: ${themeLabel}. Tap to change`,
        )}
        title={themeLabel}
      >
        <Icon name={theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'auto'} />
      </button>
      {/* App switcher, fixed order Language → Note → Habits (UI buttons PRD 7.3). */}
      <nav className="switcher" aria-label={tr('Ứng dụng Olaa', 'Olaa apps')}>
        <a
          className="apptile apptile--lang"
          href={LANGUAGE_URL}
          aria-label={tr('Mở Olaa Language', 'Open Olaa Language')}
          title="Olaa Language"
        >
          <span className="gl">Aa</span>
        </a>
        <a
          className="apptile apptile--note"
          href={TAKENOTE_URL}
          aria-label={tr('Mở Olaa Note', 'Open Olaa Note')}
          title="Olaa Note"
        >
          <Icon name="note" />
        </a>
        <span aria-current="page">
          <AppTile app="habit" open />
        </span>
      </nav>
    </header>
  );
}

function page(route: Route): ReactNode {
  switch (route.name) {
    case 'calendar':
      return <CalendarPage />;
    case 'stats':
      return <StatsPage />;
    case 'habits':
      return <HabitsPage />;
    case 'me':
      return <MePage />;
    case 'new':
      return <HabitFormPage habitId={null} />;
    case 'edit':
      return <HabitFormPage habitId={route.id} />;
    case 'habit':
      return <HabitPage habitId={route.id} />;
    case 'today':
      return <TodayPage day={route.day} />;
  }
}

export function App() {
  const route = useRoute();
  const locale = useLocale();
  const theme = useHabitState().settings.theme;
  useEffect(() => applyTheme(theme), [theme]);
  return (
    // Remount on language change so every screen picks up the new text.
    <div key={locale} className="frame">
      <Field />
      <div className="app">
        <a className="sr-only" href="#main">
          {tr('Bỏ qua tới nội dung', 'Skip to content')}
        </a>
        <TopBar />
        <div className="shell">
          <Nav route={route} />
          <main className="layout" id="main">
            <div className="page" key={JSON.stringify(route)}>
              {page(route)}
            </div>
          </main>
        </div>
      </div>
      <div className="grain" aria-hidden="true" />
      <Toasts />
    </div>
  );
}
