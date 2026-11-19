import type { ReactNode } from 'react';
import { CalendarIcon, ListIcon, TodayIcon, UserIcon } from '../components/Icons';
import { routeHref, type Route } from './router';

const NAV: { route: Route; label: string; icon: ReactNode; matches: Route['name'][] }[] = [
  { route: { name: 'today' }, label: 'Hôm nay', icon: <TodayIcon />, matches: ['today'] },
  { route: { name: 'calendar' }, label: 'Lịch', icon: <CalendarIcon />, matches: ['calendar'] },
  {
    route: { name: 'habits' },
    label: 'Thói quen',
    icon: <ListIcon />,
    matches: ['habits', 'habit-new', 'habit-edit'],
  },
  { route: { name: 'me' }, label: 'Tôi', icon: <UserIcon />, matches: ['me'] },
];

export function AppShell({ active, children }: { active: Route['name']; children: ReactNode }) {
  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Điều hướng chính">
        <a className="logo" href={routeHref({ name: 'today' })}>
          olaa<span>habits</span>
        </a>
        <ul>
          {NAV.map((item) => {
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
