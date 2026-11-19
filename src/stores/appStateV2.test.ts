import {
  addHabit,
  habitConsistency,
  habitStreak,
  initialState,
  logValue,
  migrateState,
  outcomeOn,
  setNote,
  setPaused,
  setSkipped,
  toggleCheckin,
  updateHabit,
  type AppState,
} from './appState';
import { applyAutoCheckins } from '../features/habit-tracking/autoCheckins';
import { fromRemoteDoc } from '../services/syncPolicy';

const binary = { name: 'Đọc', icon: '📖', color: 'blue', schedule: { kind: 'daily' } } as const;
const water = { ...binary, name: 'Nước', kind: 'quantity', target: 6, unit: 'ly' } as const;

/** Mark `days` done by editing on each day itself (the 2-day edit window is real). */
function doneOn(s: AppState, id: string, days: string[]): AppState {
  return days.reduce((acc, d) => toggleCheckin(acc, id, d, d), s);
}

describe('migration from version 1', () => {
  const v1 = {
    version: 1,
    onboarded: true,
    name: 'An',
    habits: {
      a: {
        id: 'a',
        name: 'A',
        icon: '📚',
        color: 'blue',
        schedule: { kind: 'daily' },
        createdOn: '2026-11-01',
        archivedOn: null,
      },
    },
    order: ['a'],
    checkins: { a: { '2026-11-02': true } },
    freezes: {},
    badges: {},
  };

  it('turns true check-ins into entries and adds a plan', () => {
    const s = migrateState(v1)!;
    expect(s.version).toBe(2);
    expect(s.checkins.a?.['2026-11-02']).toMatchObject({ status: 'done' });
    expect(s.habits.a?.plan).toEqual([{ from: '2026-11-01', schedule: { kind: 'daily' } }]);
    expect(s.habits.a?.kind).toBe('binary');
  });

  it('migrates account copies too and refuses newer versions', () => {
    const doc = { stateJson: JSON.stringify(v1), updatedAt: 5, schemaVersion: 1 };
    expect(fromRemoteDoc(doc)?.state.version).toBe(2);
    expect(fromRemoteDoc({ ...doc, schemaVersion: 3 })).toBeNull();
    expect(migrateState({ version: 7 })).toBeNull();
  });
});

describe('schedule history (PRD v1.0 §7.3)', () => {
  it('a schedule change does not rewrite past days', () => {
    // Daily habit done Mon–Thu (16–19 Nov). On Fri it becomes "Mondays only".
    let s = addHabit(initialState(), binary, '2026-11-16', 'h');
    s = doneOn(s, 'h', ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19']);
    expect(habitStreak(s, s.habits.h!, '2026-11-20').current).toBe(4);
    s = updateHabit(s, 'h', { ...binary, schedule: { kind: 'weekdays', days: [0] } }, '2026-11-20');
    expect(s.habits.h?.plan).toHaveLength(2);
    // Past days keep counting under the daily plan; the run continues.
    expect(habitStreak(s, s.habits.h!, '2026-11-20').current).toBe(4);
    expect(habitConsistency(s, s.habits.h!, '2026-11-20').opportunities).toBe(4);
  });

  it('two edits on the same day replace that day’s plan entry', () => {
    let s = addHabit(initialState(), binary, '2026-11-10', 'h');
    s = updateHabit(s, 'h', { ...binary, schedule: { kind: 'perWeek', times: 3 } }, '2026-11-20');
    s = updateHabit(s, 'h', { ...binary, schedule: { kind: 'perWeek', times: 2 } }, '2026-11-20');
    expect(s.habits.h?.plan).toEqual([
      { from: '2026-11-10', schedule: { kind: 'daily' } },
      { from: '2026-11-20', schedule: { kind: 'perWeek', times: 2 } },
    ]);
  });
});

describe('check-in states', () => {
  it('measured habits are partial below target and done at target', () => {
    let s = addHabit(initialState(), water, '2026-11-19', 'w');
    s = logValue(s, 'w', '2026-11-19', '2026-11-19', 3);
    expect(outcomeOn(s, s.habits.w!, '2026-11-19')).toBe('partial');
    s = logValue(s, 'w', '2026-11-19', '2026-11-19', 6);
    expect(outcomeOn(s, s.habits.w!, '2026-11-19')).toBe('done');
    expect(s.checkins.w?.['2026-11-19']?.history).toHaveLength(1);
  });

  it('a skipped day keeps the streak and is not an opportunity', () => {
    let s = addHabit(initialState(), binary, '2026-11-16', 'h');
    s = doneOn(s, 'h', ['2026-11-16', '2026-11-18']);
    s = setSkipped(s, 'h', '2026-11-17', '2026-11-17', true);
    expect(outcomeOn(s, s.habits.h!, '2026-11-17')).toBe('skipped');
    expect(habitStreak(s, s.habits.h!, '2026-11-19').current).toBe(2);
    const c = habitConsistency(s, s.habits.h!, '2026-11-19');
    expect([c.completed, c.opportunities]).toEqual([2, 2]);
  });

  it('a missed day breaks the streak and lowers consistency, but keeps history', () => {
    let s = addHabit(initialState(), binary, '2026-11-16', 'h');
    s = doneOn(s, 'h', ['2026-11-16', '2026-11-18']);
    expect(habitStreak(s, s.habits.h!, '2026-11-19')).toMatchObject({ current: 1, best: 1 });
    const c = habitConsistency(s, s.habits.h!, '2026-11-19');
    expect([c.completed, c.opportunities]).toEqual([2, 3]);
    expect(Object.keys(s.checkins.h ?? {})).toHaveLength(2);
  });

  it('notes can be added without completing', () => {
    let s = addHabit(initialState(), binary, '2026-11-19', 'h');
    s = setNote(s, 'h', '2026-11-19', '2026-11-19', '  mệt  ');
    expect(s.checkins.h?.['2026-11-19']?.note).toBe('mệt');
    expect(outcomeOn(s, s.habits.h!, '2026-11-19')).toBe('none');
  });
});

describe('pause', () => {
  it('paused days neither count nor break the streak', () => {
    let s = addHabit(initialState(), binary, '2026-11-16', 'h');
    s = doneOn(s, 'h', ['2026-11-16']);
    s = setPaused(s, 'h', true, '2026-11-17');
    s = setPaused(s, 'h', false, '2026-11-19');
    expect(s.habits.h?.pauses).toEqual([{ from: '2026-11-17', to: '2026-11-18' }]);
    s = doneOn(s, 'h', ['2026-11-19']);
    expect(habitStreak(s, s.habits.h!, '2026-11-19').current).toBe(2);
    const c = habitConsistency(s, s.habits.h!, '2026-11-19');
    expect([c.completed, c.opportunities]).toEqual([2, 2]);
  });
});

describe('automatic habits keep what the user wrote', () => {
  it('a manual skip survives event recomputation', () => {
    let s = addHabit(
      initialState(),
      { ...binary, source: { kind: 'language.daily_goal' } },
      '2026-11-16',
      'g',
    );
    s = {
      ...s,
      checkins: { g: { '2026-11-17': { status: 'skipped', source: 'manual', updatedAt: 1 } } },
    };
    s = applyAutoCheckins(
      s,
      [{ type: 'language.daily_goal.completed', date: '2026-11-18' }],
      '2026-11-19',
    );
    expect(s.checkins.g?.['2026-11-17']?.status).toBe('skipped');
    expect(s.checkins.g?.['2026-11-18']).toMatchObject({ status: 'done', source: 'language' });
  });
});
