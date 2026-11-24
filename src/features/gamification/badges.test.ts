import { freeze, habit, stateWith } from '../../../tests/fixtures/habits';
import { newBadges } from './badges';

describe('badges', () => {
  it('awards first check and a 7-day streak once', () => {
    const h = habit();
    const days = Array.from({ length: 7 }, (_, i) => `2026-11-${String(17 + i).padStart(2, '0')}`);
    const s = stateWith([h], { h1: days });
    const ids = newBadges(s, '2026-11-24', 1).map((b) => b.id);
    expect(ids).toContain('first-check');
    expect(ids).toContain('streak-7');
    expect(ids).not.toContain('streak-30');
    for (const b of newBadges(s, '2026-11-24', 1)) s.badges[b.id] = b;
    expect(newBadges(s, '2026-11-24', 2)).toEqual([]);
  });

  it('awards a perfect week only when every due habit was done or frozen', () => {
    const a = habit({ id: 'a' });
    const b = habit({ id: 'b', schedule: { kind: 'perWeek', times: 2 } });
    const week = [
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
    ];
    const s = freeze(stateWith([a, b], { a: week, b: ['2026-11-16', '2026-11-18'] }), '2026-11-22');
    expect(newBadges(s, '2026-11-24', 1).map((x) => x.id)).toContain('perfect-week');
    const s2 = stateWith([a, b], { a: week, b: ['2026-11-16', '2026-11-18'] });
    expect(newBadges(s2, '2026-11-24', 1).map((x) => x.id)).not.toContain('perfect-week');
  });

  it('awards the first freeze badge when a freeze held a streak', () => {
    const h = habit();
    const s = freeze(stateWith([h], { h1: ['2026-11-21', '2026-11-23'] }), '2026-11-22');
    expect(newBadges(s, '2026-11-24', 1).map((x) => x.id)).toContain('first-freeze');
  });

  it('awards the Language badge for an auto check-off', () => {
    const h = habit({ source: { kind: 'language.daily_goal' } });
    const s = stateWith([h]);
    s.events = { e: { type: 'language.daily_goal.completed', date: '2026-11-24' } };
    expect(newBadges(s, '2026-11-24', 1).map((x) => x.id)).toContain('auto-learner');
  });
});
