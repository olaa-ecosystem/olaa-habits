import { freeze, habit, stateWith } from '../../../tests/fixtures/habits';
import { completionRate, weeklyTotals } from './stats';

const TODAY = '2026-11-24';

describe('stats', () => {
  it('leaves out frozen days and an unfinished today', () => {
    const h = habit();
    const s = freeze(
      stateWith([h], { h1: ['2026-11-18', '2026-11-19', '2026-11-21', '2026-11-23'] }),
      '2026-11-20',
    );
    // Last 7 days: 18..24. Due and counted: 18,19,21,22,23 (20 frozen, 24 pending) → 4/5.
    expect(completionRate(s, h, TODAY, 7)).toEqual({ done: 4, due: 5, ratio: 0.8 });
  });

  it('uses the weekly count for N-times-a-week habits', () => {
    const h = habit({ schedule: { kind: 'perWeek', times: 2 }, startDate: '2026-11-09' });
    const s = stateWith([h], { h1: ['2026-11-10', '2026-11-17', '2026-11-18'] });
    // Weeks of 9th (1/2) and 16th (2/2); this week has nothing yet and is not counted.
    expect(completionRate(s, h, TODAY, 16)).toMatchObject({ done: 3, due: 4 });
  });

  it('totals completions per week', () => {
    const h = habit();
    const s = stateWith([h], { h1: ['2026-11-17', '2026-11-18', TODAY] });
    expect(weeklyTotals(s, TODAY, 2)).toEqual([
      { week: '2026-11-16', done: 2 },
      { week: '2026-11-23', done: 1 },
    ]);
  });
});
