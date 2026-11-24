import { habit, stateWith } from '../../tests/fixtures/habits';
import { checkInKey } from '../features/habit-management/types';
import { emptyState } from './habitState';
import {
  createHabit,
  deleteHabit,
  freezeDay,
  sanitizeInput,
  setArchived,
  setNote,
  setValue,
  tap,
  type HabitInput,
} from './habitActions';

const TODAY = '2026-11-24';

const input: HabitInput = {
  name: '  Uống nước  ',
  icon: 'water',
  color: 'blue',
  schedule: { kind: 'weekdays', days: [1, 2, 3, 4, 5, 6, 0] },
  target: 8,
  unit: 'ly',
  timeOfDay: 'any',
  source: { kind: 'manual' },
  reminder: null,
  noteLink: null,
  startDate: TODAY,
  why: '',
};

describe('habit actions', () => {
  it('cleans input', () => {
    const c = sanitizeInput(input);
    expect(c.name).toBe('Uống nước');
    expect(c.schedule).toEqual({ kind: 'daily' });
    expect(sanitizeInput({ ...input, target: 1 }).unit).toBe('');
  });

  it('creates, taps and wraps count habits', () => {
    const { state, id } = createHabit(emptyState(), input, 1);
    let s = state;
    for (let i = 0; i < 8; i += 1) s = tap(s, id, TODAY, TODAY, 2);
    expect(s.checkIns[checkInKey(id, TODAY)]?.value).toBe(8);
    s = tap(s, id, TODAY, TODAY, 3);
    expect(s.checkIns[checkInKey(id, TODAY)]).toBeUndefined();
  });

  it('refuses hand check-offs for Language habits and old days', () => {
    const auto = habit({ source: { kind: 'language.daily_goal' } });
    const s = stateWith([auto]);
    expect(setValue(s, 'h1', TODAY, 1, TODAY, 1)).toBe(s);
    const manual = stateWith([habit()]);
    expect(setValue(manual, 'h1', '2026-11-20', 1, TODAY, 1)).toBe(manual);
  });

  it('keeps a note even when not done, and removes empty records', () => {
    let s = stateWith([habit()]);
    s = setNote(s, 'h1', '2026-11-10', 'busy week', TODAY, 1);
    expect(s.checkIns[checkInKey('h1', '2026-11-10')]).toMatchObject({
      value: 0,
      note: 'busy week',
    });
    s = setNote(s, 'h1', '2026-11-10', '', TODAY, 1);
    expect(s.checkIns[checkInKey('h1', '2026-11-10')]).toBeUndefined();
  });

  it('archives without losing history; delete removes it', () => {
    let s = stateWith([habit()], { h1: ['2026-11-23'] });
    s = setArchived(s, 'h1', true, 5);
    expect(s.habits.h1?.archivedAt).toBe(5);
    expect(Object.keys(s.checkIns)).toHaveLength(1);
    s = deleteHabit(s, 'h1');
    expect(s.habits.h1).toBeUndefined();
    expect(Object.keys(s.checkIns)).toHaveLength(0);
  });

  it('freezes only within the rules', () => {
    const s = stateWith([habit()]);
    expect(freezeDay(s, '2026-11-20', TODAY, 1)).toBe(s);
    expect(freezeDay(s, TODAY, TODAY, 1).freezes[TODAY]).toBeDefined();
  });
});
