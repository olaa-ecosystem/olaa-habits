import { parseRoute, routeHref, type Route } from './router';

describe('router', () => {
  it('round-trips every route', () => {
    const routes: Route[] = [
      { name: 'today', day: null },
      { name: 'today', day: '2026-11-22' },
      { name: 'calendar' },
      { name: 'stats' },
      { name: 'settings' },
      { name: 'archive' },
      { name: 'new' },
      { name: 'habit', id: 'h_1' },
      { name: 'edit', id: 'h_1' },
    ];
    for (const r of routes) expect(parseRoute(routeHref(r))).toEqual(r);
  });
  it('falls back to today', () => {
    expect(parseRoute('#/nope')).toEqual({ name: 'today', day: null });
    expect(parseRoute('#/day/garbage')).toEqual({ name: 'today', day: null });
  });
});
