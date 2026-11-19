import { addHabit, initialState, toggleCheckin } from '../../stores/appState';
import { dayStatus } from './calendarDay';

const today = '2026-11-19';
const daily = { name: 'A', icon: '📚', color: 'blue', schedule: { kind: 'daily' } } as const;

describe('dayStatus', () => {
  it('marks done, partial, missed, pending and frozen days', () => {
    let s = addHabit(initialState(), daily, '2026-11-16', 'a');
    s = addHabit(s, { ...daily, name: 'B' }, '2026-11-16', 'b');
    s = toggleCheckin(s, 'a', '2026-11-17', today);
    s = toggleCheckin(s, 'b', '2026-11-17', today);
    s = toggleCheckin(s, 'a', '2026-11-18', today);
    s = { ...s, freezes: { '2026-11-16': true, '2026-11-21': true } };
    const habits = Object.values(s.habits);
    expect(dayStatus(s, habits, '2026-11-17', today)).toBe('done');
    expect(dayStatus(s, habits, '2026-11-18', today)).toBe('partial');
    expect(dayStatus(s, habits, '2026-11-16', today)).toBe('frozen');
    expect(dayStatus(s, habits, today, today)).toBe('pending');
    expect(dayStatus(s, habits, '2026-11-21', today)).toBe('frozen');
    expect(dayStatus(s, habits, '2026-11-15', today)).toBe('none');
  });
});
