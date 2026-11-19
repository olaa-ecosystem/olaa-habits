import { HABIT_TEMPLATES } from '../features/habit-management/templates';
import {
  addHabit,
  archiveHabit,
  awardBadges,
  completeOnboarding,
  initialState,
  restoreHabit,
  setFreeze,
  toggleCheckin,
  activeHabits,
} from './appState';

const today = '2026-11-19';
const draft = {
  name: '  Học tiếng Anh  ',
  icon: '🗣️',
  color: 'blue',
  schedule: { kind: 'daily' },
} as const;

describe('habits', () => {
  it('adds, trims and orders habits; rejects empty names', () => {
    let s = addHabit(initialState(), draft, today, 'a');
    s = addHabit(s, { ...draft, name: '   ' }, today, 'b');
    expect(s.order).toEqual(['a']);
    expect(s.habits.a?.name).toBe('Học tiếng Anh');
  });

  it('archives without losing history and restores', () => {
    let s = addHabit(initialState(), draft, '2026-11-17', 'a');
    s = toggleCheckin(s, 'a', today, today);
    s = archiveHabit(s, 'a', today);
    expect(activeHabits(s)).toHaveLength(0);
    expect(s.checkins.a?.[today]).toBe(true);
    s = restoreHabit(s, 'a');
    expect(activeHabits(s)).toHaveLength(1);
  });

  it('onboarding creates the chosen templates', () => {
    const s = completeOnboarding(
      initialState(),
      { name: 'Mai', drafts: HABIT_TEMPLATES.slice(0, 2) },
      today,
    );
    expect(s.onboarded).toBe(true);
    expect(activeHabits(s).map((h) => h.name)).toEqual([
      'Học ngoại ngữ 15 phút',
      'Ôn bài trên lớp',
    ]);
  });
});

describe('check-ins', () => {
  it('toggles today and the last 2 days only', () => {
    let s = addHabit(initialState(), draft, '2026-11-10', 'a');
    s = toggleCheckin(s, 'a', today, today);
    s = toggleCheckin(s, 'a', '2026-11-17', today);
    expect(Object.keys(s.checkins.a ?? {}).sort()).toEqual(['2026-11-17', today]);
    expect(toggleCheckin(s, 'a', '2026-11-16', today)).toBe(s);
    expect(toggleCheckin(s, 'a', '2026-11-20', today)).toBe(s);
    s = toggleCheckin(s, 'a', today, today);
    expect(s.checkins.a?.[today]).toBeUndefined();
  });
});

describe('freezes and badges', () => {
  it('respects freeze rules', () => {
    let s = setFreeze(initialState(), '2026-11-20', true, today);
    expect(s.freezes['2026-11-20']).toBe(true);
    expect(setFreeze(s, '2026-11-18', true, today)).toBe(s);
    s = setFreeze(s, '2026-11-20', false, today);
    expect(s.freezes).toEqual({});
  });

  it('awards badges once and keeps them', () => {
    let s = addHabit(initialState(), draft, '2026-11-09', 'a'); // a Monday
    for (let d = 9; d <= 16; d++) {
      const day = `2026-11-${String(d).padStart(2, '0')}`;
      s = { ...s, checkins: { a: { ...(s.checkins.a ?? {}), [day]: true } } };
    }
    s = awardBadges(s, '2026-11-17');
    expect(s.badges['first-checkin']).toBe('2026-11-17');
    expect(s.badges['streak-7']).toBe('2026-11-17');
    expect(s.badges['perfect-week']).toBe('2026-11-17');
    const later = awardBadges({ ...s, checkins: {} }, '2026-11-30');
    expect(later.badges['streak-7']).toBe('2026-11-17');
  });
});
