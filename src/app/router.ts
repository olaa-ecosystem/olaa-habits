import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'today' }
  | { name: 'calendar' }
  | { name: 'habits' }
  | { name: 'habit-new' }
  | { name: 'habit-edit'; habitId: string }
  | { name: 'me' };

/** Tiny hash router: works on any static host with no server rewrites. */
export function parseRoute(hash: string): Route {
  const [head, arg, action] = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (head) {
    case 'calendar':
      return { name: 'calendar' };
    case 'habits':
      if (arg === 'new') return { name: 'habit-new' };
      if (arg && action === 'edit') return { name: 'habit-edit', habitId: decodeURIComponent(arg) };
      return { name: 'habits' };
    case 'me':
      return { name: 'me' };
    default:
      return { name: 'today' };
  }
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case 'habit-new':
      return '#/habits/new';
    case 'habit-edit':
      return `#/habits/${encodeURIComponent(route.habitId)}/edit`;
    default:
      return `#/${route.name}`;
  }
}

export function navigate(route: Route): void {
  window.location.hash = routeHref(route);
}

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

export function useHash(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '',
  );
}
