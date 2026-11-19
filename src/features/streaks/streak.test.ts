import { computeStreak } from './streak';
import { canFreeze, canUnfreeze, freezesLeftIn } from './freeze';

const set =
  (...days: string[]) =>
  (d: string) =>
    days.includes(d);
const none = () => false;

// 2026-11-16 is a Monday.
describe('daily streak', () => {
  const base = { schedule: { kind: 'daily' } as const, createdOn: '2026-11-16', frozen: none };

  it('counts consecutive done days and keeps today pending', () => {
    const s = computeStreak({
      ...base,
      today: '2026-11-19',
      done: set('2026-11-16', '2026-11-17', '2026-11-18'),
    });
    expect(s).toEqual({ current: 3, best: 3, unit: 'day' });
  });

  it('breaks on a missed past day but remembers the best', () => {
    const s = computeStreak({
      ...base,
      today: '2026-11-20',
      done: set('2026-11-16', '2026-11-17', '2026-11-19'),
    });
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
  });

  it('a frozen day keeps the streak without adding to it', () => {
    const s = computeStreak({
      ...base,
      today: '2026-11-19',
      done: set('2026-11-16', '2026-11-18'),
      frozen: set('2026-11-17'),
    });
    expect(s.current).toBe(2);
  });
});

describe('weekday streak', () => {
  it('ignores days that are not scheduled', () => {
    const s = computeStreak({
      schedule: { kind: 'weekdays', days: [0, 2] }, // Mon, Wed
      createdOn: '2026-11-16',
      today: '2026-11-24',
      done: set('2026-11-16', '2026-11-18', '2026-11-23'),
      frozen: none,
    });
    expect(s.current).toBe(3);
  });
});

describe('times-per-week streak', () => {
  const schedule = { kind: 'perWeek', times: 2 } as const;

  it('counts weeks that reached the target', () => {
    const s = computeStreak({
      schedule,
      createdOn: '2026-11-02',
      today: '2026-11-19',
      done: set('2026-11-02', '2026-11-05', '2026-11-10', '2026-11-12'),
      frozen: none,
    });
    expect(s).toEqual({ current: 2, best: 2, unit: 'week' });
  });

  it('breaks on a finished week below target; a frozen day lowers the target', () => {
    const missed = computeStreak({
      schedule,
      createdOn: '2026-11-02',
      today: '2026-11-19',
      done: set('2026-11-02', '2026-11-05', '2026-11-10'),
      frozen: none,
    });
    expect(missed.current).toBe(0);
    const saved = computeStreak({
      schedule,
      createdOn: '2026-11-02',
      today: '2026-11-19',
      done: set('2026-11-02', '2026-11-05', '2026-11-10'),
      frozen: set('2026-11-11'),
    });
    expect(saved.current).toBe(2);
  });
});

describe('freeze rules', () => {
  it('allows today or later, up to 2 per month', () => {
    expect(canFreeze({}, '2026-11-18', '2026-11-19').ok).toBe(false);
    expect(canFreeze({}, '2026-11-19', '2026-11-19').ok).toBe(true);
    const two = { '2026-11-20': true, '2026-11-25': true } as const;
    expect(freezesLeftIn(two, '2026-11')).toBe(0);
    expect(canFreeze(two, '2026-11-26', '2026-11-19').ok).toBe(false);
    expect(canFreeze(two, '2026-12-01', '2026-11-19').ok).toBe(true);
  });

  it('can cancel only until the day has passed', () => {
    const f = { '2026-11-18': true, '2026-11-20': true } as const;
    expect(canUnfreeze(f, '2026-11-18', '2026-11-19')).toBe(false);
    expect(canUnfreeze(f, '2026-11-20', '2026-11-19')).toBe(true);
  });
});
