/** Hash router: works on any static host with no rewrites. */
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

/** Habit ids may hold "_"; plain hashes allow only letters, digits and "-". */
function encodeId(id: string): string {
  return id.replace(/_/g, '--');
}
function decodeId(id: string): string {
  return id.replace(/--/g, '_');
}

/**
 * Hashes are plain names (`#calendar`, `#habit-<id>`, `#day-2026-11-22`) so a link keeps
 * working wherever the app is shown, including an Artifact page, which only passes plain
 * `#name` hashes. The first version's `#/path` links still open the right screen.
 */
export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  if (raw.startsWith('/')) return parseLegacy(raw);
  const day = /^day-(\d{4}-\d{2}-\d{2})$/.exec(raw);
  if (day) return { name: 'today', day: day[1] ?? null };
  const habit = /^(habit|edit)-([A-Za-z0-9-]+)$/.exec(raw);
  if (habit) return { name: habit[1] === 'edit' ? 'edit' : 'habit', id: decodeId(habit[2] ?? '') };
  switch (raw) {
    case 'calendar':
    case 'stats':
    case 'habits':
    case 'me':
    case 'new':
      return { name: raw };
  }
  return { name: 'today', day: null };
}

function parseLegacy(path: string): Route {
  const [head, id, sub] = path.split('/').filter(Boolean);
  switch (head) {
    case 'calendar':
      return { name: 'calendar' };
    case 'stats':
      return { name: 'stats' };
    case 'habits':
    case 'archive':
      return { name: 'habits' };
    case 'me':
    case 'settings':
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
      return route.day ? `#day-${route.day}` : '#today';
    case 'calendar':
    case 'stats':
    case 'habits':
    case 'me':
    case 'new':
      return `#${route.name}`;
    case 'habit':
      return `#habit-${encodeId(route.id)}`;
    case 'edit':
      return `#edit-${encodeId(route.id)}`;
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
