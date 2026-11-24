import { habit, stateWith } from '../../../tests/fixtures/habits';
import { checkInKey } from '../habit-management/types';
import { dueReminders, suggestReminder } from './reminders';

const TODAY = '2026-11-24';

describe('reminders', () => {
  it('reminds once, after the time, and not when already done (REQ-02-022)', () => {
    const a = habit({ id: 'a', reminder: '08:00' });
    const b = habit({ id: 'b', reminder: '08:00' });
    const c = habit({ id: 'c', reminder: '21:00' });
    const s = stateWith([a, b, c], { b: [TODAY] });
    expect(dueReminders(s, TODAY, 9 * 60, new Set()).map((h) => h.id)).toEqual(['a']);
    expect(dueReminders(s, TODAY, 9 * 60, new Set([`a|${TODAY}`]))).toEqual([]);
  });

  it('suggests a time only after 7 days of data (REQ-02-023)', () => {
    const h = habit();
    const s = stateWith([h]);
    const add = (day: number, hour: number) => {
      const date = `2026-11-${String(day).padStart(2, '0')}`;
      s.checkIns[checkInKey(h.id, date)] = {
        habitId: h.id,
        date,
        value: 1,
        note: '',
        updatedAt: new Date(2026, 10, day, hour, 10).getTime(),
      };
    };
    for (let d = 10; d < 16; d += 1) add(d, 20);
    expect(suggestReminder(s, h)).toBeNull();
    add(16, 21);
    expect(suggestReminder(s, h)).toBe('19:45');
  });
});
