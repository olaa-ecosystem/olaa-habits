import { addHabit, initialState, toggleCheckin } from '../../stores/appState';
import { applyAutoCheckins, parseEvent, type LanguageEvent } from './autoCheckins';

const today = '2026-11-19';
const goal = {
  name: 'Goal',
  icon: '🗣️',
  color: 'blue',
  schedule: { kind: 'daily' },
  source: { kind: 'language.daily_goal' },
} as const;
const lessons = {
  ...goal,
  name: 'Lessons',
  source: { kind: 'language.new_lessons', count: 2 },
} as const;
const ev = (type: LanguageEvent['type'], date: string): LanguageEvent => ({ type, date });

describe('applyAutoCheckins', () => {
  it('checks daily-goal habits on event days within the habit lifetime', () => {
    const s = addHabit(initialState(), goal, '2026-11-17', 'g');
    const next = applyAutoCheckins(
      s,
      [
        ev('language.daily_goal.completed', '2026-11-16'),
        ev('language.daily_goal.completed', '2026-11-18'),
      ],
      today,
    );
    expect(Object.keys(next.checkins.g ?? {})).toEqual(['2026-11-18']);
    expect(next.checkins.g?.['2026-11-18']).toMatchObject({ status: 'done', source: 'language' });
  });

  it('needs N new lessons on the same day', () => {
    const s = addHabit(initialState(), lessons, '2026-11-17', 'l');
    const next = applyAutoCheckins(
      s,
      [
        ev('language.lesson.completed', '2026-11-18'),
        ev('language.lesson.completed', '2026-11-19'),
        ev('language.lesson.completed', '2026-11-19'),
      ],
      today,
    );
    expect(Object.keys(next.checkins.l ?? {})).toEqual(['2026-11-19']);
  });

  it('returns the same state when nothing changes, and blocks manual toggles', () => {
    const s = applyAutoCheckins(
      addHabit(initialState(), goal, '2026-11-17', 'g'),
      [ev('language.daily_goal.completed', today)],
      today,
    );
    expect(applyAutoCheckins(s, [ev('language.daily_goal.completed', today)], today)).toBe(s);
    expect(toggleCheckin(s, 'g', today, today)).toBe(s);
  });

  it('ignores malformed events', () => {
    expect(parseEvent({ type: 'other', date: today })).toBeNull();
    expect(
      parseEvent({ id: 'u_x', version: 1, type: 'language.lesson.completed', date: today }),
    ).toEqual(ev('language.lesson.completed', today));
    expect(parseEvent({ version: 2, type: 'language.lesson.completed', date: today })).toBeNull();
    expect(parseEvent({ version: '1', type: 'language.lesson.completed', date: today })).toBeNull();
    expect(parseEvent({ type: 'language.lesson.completed', date: 'yesterday' })).toBeNull();
    expect(parseEvent({ type: 'language.lesson.completed', date: today, extra: 1 })).toEqual(
      ev('language.lesson.completed', today),
    );
  });
});
