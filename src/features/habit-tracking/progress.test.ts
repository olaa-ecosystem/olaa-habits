import { freeze, habit, stateWith } from '../../../tests/fixtures/habits';
import { canEditDay, dayProgress, dayStatus, isOnAgenda, valueOn } from './progress';

const TODAY = '2026-11-24';

describe('progress', () => {
  it('derives Language habits from events, counting each event id once', () => {
    const goal = habit({ id: 'g', source: { kind: 'language.daily_goal' } });
    const lessons = habit({ id: 'l', source: { kind: 'language.lessons' }, target: 2 });
    const s = stateWith([goal, lessons]);
    s.events = {
      a: { type: 'language.daily_goal.completed', date: TODAY },
      b: { type: 'language.lesson.completed', date: TODAY },
      c: { type: 'language.lesson.completed', date: TODAY },
      d: { type: 'language.lesson.completed', date: '2026-11-23' },
    };
    expect(valueOn(s, goal, TODAY)).toBe(1);
    expect(valueOn(s, lessons, TODAY)).toBe(2);
    expect(dayStatus(s, lessons, TODAY, TODAY)).toBe('done');
    expect(dayStatus(s, lessons, '2026-11-23', TODAY)).toBe('partial');
  });

  it('gives each day a status', () => {
    const h = habit();
    const s = freeze(stateWith([h], { h1: ['2026-11-22'] }), '2026-11-21', '2026-11-30');
    expect(dayStatus(s, h, '2026-11-22', TODAY)).toBe('done');
    expect(dayStatus(s, h, '2026-11-21', TODAY)).toBe('frozen');
    expect(dayStatus(s, h, '2026-11-23', TODAY)).toBe('missed');
    expect(dayStatus(s, h, TODAY, TODAY)).toBe('pending');
    expect(dayStatus(s, h, '2026-11-30', TODAY)).toBe('frozen');
    expect(dayStatus(s, h, '2026-10-30', TODAY)).toBe('not-due');
  });

  it('keeps weekly habits on the list until the count is reached', () => {
    const h = habit({ schedule: { kind: 'perWeek', times: 2 } });
    const s = stateWith([h], { h1: ['2026-11-23'] });
    expect(isOnAgenda(s, h, TODAY, 1)).toBe(true);
    const s2 = stateWith([h], { h1: ['2026-11-23', TODAY] });
    expect(isOnAgenda(s2, h, TODAY, 1)).toBe(true); // done today: still shown
    expect(isOnAgenda(s2, h, '2026-11-25', 1)).toBe(false);
  });

  it('measures the day', () => {
    const a = habit({ id: 'a' });
    const b = habit({ id: 'b', archivedAt: 1 });
    const c = habit({ id: 'c' });
    const s = stateWith([a, b, c], { a: [TODAY] });
    expect(dayProgress(s, TODAY)).toEqual({ done: 1, total: 2, ratio: 0.5 });
  });

  it('allows edits for today and the two days before only (REQ-02-003)', () => {
    expect(canEditDay(TODAY, TODAY)).toBe(true);
    expect(canEditDay('2026-11-22', TODAY)).toBe(true);
    expect(canEditDay('2026-11-21', TODAY)).toBe(false);
    expect(canEditDay('2026-11-25', TODAY)).toBe(false);
  });
});
