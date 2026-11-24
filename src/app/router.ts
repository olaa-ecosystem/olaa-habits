/** Hash router, as in Olaa Language and Olaa Note: works on any static host with no rewrites. */
import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'today'; day: string | null }
  | { name: 'calendar' }
  | { name: 'stats' }
  | { name: 'habits' }
  | { name: 'me' }
  | { name: 'new' }
  | { name: 'habit'; id: string }
  | { name: 'edit'; id: string };

/** Main sections, for the navigation. */
export type Section = 'today' | 'calendar' | 'habits' | 'stats' | 'me';

export function sectionOf(route: Route): Section {
  switch (route.name) {
    case 'calendar':
      return 'calendar';
    case 'stats':
      return 'stats';
    case 'habits':
    case 'new':
    case 'habit':
    case 'edit':
      return 'habits';
    case 'me':
      return 'me';
    default:
      return 'today';
  }
}

export function parseRoute(hash: string): Route {
  const [head, id, sub] = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (head) {
    case 'calendar':
      return { name: 'calendar' };
    case 'stats':
      return { name: 'stats' };
    case 'habits':
    case 'archive': // links from the first version
      return { name: 'habits' };
    case 'me':
    case 'settings': // links from the first version
      return { name: 'me' };
    case 'new':
      return { name: 'new' };
    case 'day':
      return { name: 'today', day: id && /^\d{4}-\d{2}-\d{2}$/.test(id) ? id : null };
    case 'habit':
      if (!id) break;
      return sub === 'edit'
        ? { name: 'edit', id: decodeURIComponent(id) }
        : { name: 'habit', id: decodeURIComponent(id) };
  }
  return { name: 'today', day: null };
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case 'today':
      return route.day ? `#/day/${route.day}` : '#/';
    case 'calendar':
    case 'stats':
    case 'habits':
    case 'me':
    case 'new':
      return `#/${route.name}`;
    case 'habit':
      return `#/habit/${encodeURIComponent(route.id)}`;
    case 'edit':
      return `#/habit/${encodeURIComponent(route.id)}/edit`;
  }
}

export function navigate(route: Route, replace = false): void {
  const href = routeHref(route);
  if (replace) {
    window.history.replaceState(null, '', href);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = href;
  }
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

export function useRoute(): Route {
  return parseRoute(useHash());
}
