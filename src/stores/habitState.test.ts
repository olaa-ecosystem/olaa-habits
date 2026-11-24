import { habit, stateWith } from '../../tests/fixtures/habits';
import { fullDayStreak } from '../features/streaks/streaks';
import { setMood } from './habitActions';
import { parseState } from './habitState';

describe('saved data from the first version', () => {
  it('loads unchanged and gains the new fields', () => {
    const { why: _why, ...oldHabit } = habit();
    void _why;
    const saved = {
      version: 1,
      habits: { h1: oldHabit },
      checkIns: {
        'h1|2026-11-23': { habitId: 'h1', date: '2026-11-23', value: 1, note: 'ok', updatedAt: 1 },
      },
      freezes: {},
      badges: {},
      events: {},
      settings: { weekStart: 1, freezesPerMonth: 2, theme: 'dark', remindersOn: false },
    };
    const s = parseState(JSON.parse(JSON.stringify(saved)))!;
    expect(s.habits.h1).toMatchObject({ name: 'Read', why: '' });
    expect(s.checkIns['h1|2026-11-23']?.note).toBe('ok');
    expect(s.moods).toEqual({});
    expect(s.settings.theme).toBe('dark');
  });

  it('drops unknown moods', () => {
    const s = parseState({
      ...stateWith([habit()]),
      moods: { '2026-11-20': 'great', '2026-11-21': 'nope' },
    })!;
    expect(s.moods).toEqual({ '2026-11-20': 'great' });
  });
});

describe('moods and full days', () => {
  it('sets, clears and refuses future moods', () => {
    let s = stateWith([habit()]);
    s = setMood(s, '2026-11-24', 'good', '2026-11-24');
    expect(s.moods['2026-11-24']).toBe('good');
    expect(setMood(s, '2026-11-25', 'good', '2026-11-24')).toBe(s);
    s = setMood(s, '2026-11-24', null, '2026-11-24');
    expect(s.moods).toEqual({});
  });

  it('counts full days in a row; an unfinished today does not break it', () => {
    const s = stateWith([habit({ startDate: '2026-11-20' })], {
      h1: ['2026-11-21', '2026-11-22', '2026-11-23'],
    });
    expect(fullDayStreak(s, '2026-11-24')).toBe(3);
    s.freezes['2026-11-22'] = { createdAt: 0 };
    delete s.checkIns['h1|2026-11-22'];
    expect(fullDayStreak(s, '2026-11-24')).toBe(2);
  });
});
