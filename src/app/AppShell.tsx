import type { ReactNode } from 'react';
import { CalendarIcon, ListIcon, TodayIcon, UserIcon } from '../components/Icons';
import { routeHref, type Route } from './router';
import { tr } from '../i18n/locale';

const nav = (): { route: Route; label: string; icon: ReactNode; matches: Route['name'][] }[] => [
  {
    route: { name: 'today' },
    label: tr('Hôm nay', 'Today'),
    icon: <TodayIcon />,
    matches: ['today'],
  },
  {
    route: { name: 'calendar' },
    label: tr('Lịch', 'Calendar'),
    icon: <CalendarIcon />,
    matches: ['calendar'],
  },
  {
    route: { name: 'habits' },
    label: tr('Thói quen', 'Habits'),
    icon: <ListIcon />,
    matches: ['habits', 'habit-new', 'habit-edit'],
  },
  { route: { name: 'me' }, label: tr('Tôi', 'Me'), icon: <UserIcon />, matches: ['me'] },
];

export function AppShell({ active, children }: { active: Route['name']; children: ReactNode }) {
  return (
    <div className="shell">
      <nav className="sidebar" aria-label={tr('Điều hướng chính', 'Main')}>
        <a className="logo" href={routeHref({ name: 'today' })}>
          olaa<span>habits</span>
        </a>
        <ul>
          {nav().map((item) => {
            const isActive = item.matches.includes(active);
            return (
              <li key={item.label}>
                <a
                  href={routeHref(item.route)}
                  className={`nav-link ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <main className="shell__page">{children}</main>
    </div>
  );
}
