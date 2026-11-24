import { freeze, habit, stateWith } from '../../../tests/fixtures/habits';
import { streakOf, strengthOf } from './streaks';

const TODAY = '2026-11-24'; // Tuesday

describe('daily streaks', () => {
  it('counts consecutive done days and keeps the streak while today is pending', () => {
    const h = habit();
    const s = stateWith([h], { h1: ['2026-11-21', '2026-11-22', '2026-11-23'] });
    expect(streakOf(s, h, TODAY)).toMatchObject({ current: 3, best: 3, unit: 'day' });
  });

  it('breaks on a missed day and remembers the best run', () => {
    const h = habit();
    const s = stateWith([h], {
      h1: [
        '2026-11-10',
        '2026-11-11',
        '2026-11-12',
        '2026-11-13',
        '2026-11-22',
        '2026-11-23',
        '2026-11-24',
      ],
    });
    const r = streakOf(s, h, TODAY);
    expect(r.current).toBe(3);
    expect(r.best).toBe(4);
  });

  it('holds over a frozen day without counting it (REQ-02-021)', () => {
    const h = habit();
    const s = freeze(stateWith([h], { h1: ['2026-11-21', '2026-11-23'] }), '2026-11-22');
    const r = streakOf(s, h, TODAY);
    expect(r.current).toBe(2);
    expect(r.freezeBridged).toBe(true);
  });

  it('skips days that are not scheduled', () => {
    // Mon/Wed/Fri habit.
    const h = habit({ schedule: { kind: 'weekdays', days: [1, 3, 5] } });
    const s = stateWith([h], { h1: ['2026-11-16', '2026-11-18', '2026-11-20', '2026-11-23'] });
    expect(streakOf(s, h, TODAY).current).toBe(4);
  });

  it('does not count days before the start date as missed', () => {
    const h = habit({ startDate: '2026-11-23' });
    const s = stateWith([h], { h1: ['2026-11-23'] });
    expect(streakOf(s, h, TODAY).current).toBe(1);
  });

  it('needs the full target on count habits', () => {
    const h = habit({ target: 8, unit: 'ly' });
    const s = stateWith([h], { h1: ['2026-11-22', '2026-11-23'] }, { 'h1|2026-11-23': 5 });
    expect(streakOf(s, h, TODAY).current).toBe(0);
  });
});

describe('weekly streaks (N times a week)', () => {
  const h = habit({ schedule: { kind: 'perWeek', times: 2 }, startDate: '2026-11-02' });

  it('counts weeks that reached the count; the current week is pending', () => {
    const s = stateWith([h], {
      h1: ['2026-11-03', '2026-11-05', '2026-11-10', '2026-11-12', '2026-11-17', '2026-11-19'],
    });
    expect(streakOf(s, h, TODAY)).toMatchObject({ current: 3, unit: 'week' });
  });

  it('breaks on a week that fell short', () => {
    const s = stateWith([h], {
      h1: ['2026-11-03', '2026-11-05', '2026-11-10', '2026-11-17', '2026-11-19'],
    });
    expect(streakOf(s, h, TODAY).current).toBe(1);
  });

  it('lets a frozen day fill a short week', () => {
    const s = freeze(
      stateWith([h], {
        h1: ['2026-11-03', '2026-11-05', '2026-11-10', '2026-11-17', '2026-11-19'],
      }),
      '2026-11-13',
    );
    expect(streakOf(s, h, TODAY).current).toBe(2);
  });
});

describe('strength', () => {
  it('grows with completions and drops a little after one miss', () => {
    const h = habit({ startDate: '2026-10-01' });
    const days: string[] = [];
    for (let d = 1; d <= 31; d += 1) days.push(`2026-10-${String(d).padStart(2, '0')}`);
    const allOctober = stateWith([h], { h1: days });
    const strong = strengthOf(allOctober, h, '2026-10-31');
    expect(strong).toBeGreaterThan(0.7);
    const oneMiss = strengthOf(allOctober, h, '2026-11-02');
    expect(oneMiss).toBeLessThan(strong);
    expect(oneMiss).toBeGreaterThan(0.6);
  });
});
