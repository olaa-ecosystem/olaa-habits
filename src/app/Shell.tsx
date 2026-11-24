import type { ReactNode } from 'react';
import { CalendarIcon, ChartIcon, SettingsIcon, TodayIcon } from '../components/Icons';
import { tr } from '../i18n/locale';
import { LANGUAGE_URL, TAKENOTE_URL } from '../integrations/olaaApps';
import { routeHref, type Route } from './router';

type Tab = 'today' | 'calendar' | 'stats' | 'settings';

const TABS: { id: Tab; icon: () => JSX.Element; label: () => string }[] = [
  { id: 'today', icon: TodayIcon, label: () => tr('Hôm nay', 'Today') },
  { id: 'calendar', icon: CalendarIcon, label: () => tr('Lịch', 'Calendar') },
  { id: 'stats', icon: ChartIcon, label: () => tr('Thống kê', 'Stats') },
  { id: 'settings', icon: SettingsIcon, label: () => tr('Cài đặt', 'Settings') },
];

function tabRoute(tab: Tab): Route {
  return tab === 'today' ? { name: 'today', day: null } : { name: tab };
}

/** Page frame: Olaa header with app switcher, top tabs on wide screens, bottom bar on phones. */
export function Shell({ active, children }: { active: Tab | null; children: ReactNode }) {
  return (
    <div className="shell">
      <header className="shell__head">
        <a className="logo" href="#/" aria-label="Olaa Habits">
          olaa<span>habits</span>
        </a>
        <nav className="tabs" aria-label={tr('Mục chính', 'Main')}>
          {TABS.map((t) => (
            <a
              key={t.id}
              className={`tab ${active === t.id ? 'is-active' : ''}`}
              href={routeHref(tabRoute(t.id))}
              aria-current={active === t.id ? 'page' : undefined}
            >
              <t.icon />
              <span>{t.label()}</span>
            </a>
          ))}
        </nav>
        <nav className="app-switch" aria-label={tr('Ứng dụng Olaa', 'Olaa apps')}>
          <a href={LANGUAGE_URL} target="_blank" rel="noopener">
            Language
          </a>
          <span className="app-switch__here" aria-current="true">
            Habits
          </span>
          <a href={TAKENOTE_URL} target="_blank" rel="noopener">
            Note
          </a>
        </nav>
      </header>
      <main id="main-content" className="shell__main">
        {children}
      </main>
      <nav className="bottom-bar" aria-label={tr('Mục chính', 'Main')}>
        {TABS.map((t) => (
          <a
            key={t.id}
            className={`bottom-bar__item ${active === t.id ? 'is-active' : ''}`}
            href={routeHref(tabRoute(t.id))}
            aria-current={active === t.id ? 'page' : undefined}
          >
            <t.icon />
            <span>{t.label()}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
