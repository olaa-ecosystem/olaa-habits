import { parseRoute, routeHref } from './router';

describe('router', () => {
  it('round-trips every route', () => {
    for (const route of [
      { name: 'today' },
      { name: 'calendar' },
      { name: 'habits' },
      { name: 'habit-new' },
      { name: 'habit-edit', habitId: 'a b' },
      { name: 'me' },
    ] as const) {
      expect(parseRoute(routeHref(route))).toEqual(route);
    }
  });

  it('falls back to today', () => {
    expect(parseRoute('#/nope')).toEqual({ name: 'today' });
    expect(parseRoute('')).toEqual({ name: 'today' });
  });
});
