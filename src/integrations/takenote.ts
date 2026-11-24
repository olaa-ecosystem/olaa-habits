/**
 * Olaa Note integration. Olaa Note has no import API yet and apps must not write each other's
 * data, so Habits hands text over through the clipboard and opens the linked notebook.
 * The planned automatic link (Olaa Note events → Habits) is described in
 * docs/api/OLAA_INTEGRATIONS.md.
 */
import type { CheckIn, Habit } from '../features/habit-management/types';
import { fromDayKey } from '../utils/date';

function dateLabel(key: string, locale: 'vi' | 'en'): string {
  const d = fromDayKey(key);
  return locale === 'en'
    ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

/** Plain text of a habit's journal, newest first, ready to paste into a page. */
export function journalText(habit: Habit, entries: CheckIn[], locale: 'vi' | 'en'): string {
  const title =
    locale === 'en' ? `Habit journal: ${habit.name}` : `Nhật ký thói quen: ${habit.name}`;
  const lines = [title, ''];
  for (const c of [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))) {
    if (!c.note.trim()) continue;
    const amount = habit.target > 1 ? ` (${c.value}/${habit.target} ${habit.unit})` : '';
    lines.push(`${dateLabel(c.date, locale)}${amount}`, c.note.trim(), '');
  }
  return lines.join('\n').trimEnd() + '\n';
}
