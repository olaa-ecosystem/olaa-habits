import { parseRoute, routeHref, sectionOf, type Route } from './router';

describe('router', () => {
  it('round-trips every route', () => {
    const routes: Route[] = [
      { name: 'today', day: null },
      { name: 'today', day: '2026-11-22' },
      { name: 'calendar' },
      { name: 'stats' },
      { name: 'habits' },
      { name: 'me' },
      { name: 'new' },
      { name: 'habit', id: 'h_1' },
      { name: 'edit', id: 'h_1' },
    ];
    for (const r of routes) expect(parseRoute(routeHref(r))).toEqual(r);
  });
  it('keeps links from the first version working', () => {
    expect(parseRoute('#/settings')).toEqual({ name: 'me' });
    expect(parseRoute('#/archive')).toEqual({ name: 'habits' });
  });
  it('falls back to today and maps sections', () => {
    expect(parseRoute('#/nope')).toEqual({ name: 'today', day: null });
    expect(sectionOf({ name: 'edit', id: 'x' })).toBe('habits');
  });
});
