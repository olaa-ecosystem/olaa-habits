/**
 * Plain suggestions from the user's own data (module 02.11, light version): strongest and
 * weakest weekday, and habits that keep slipping. Pure; text in both interface languages.
 */
import type { HabitState } from '../../stores/habitState';
import { addDays, type DayKey } from '../../utils/date';
import { isDoneOn, isFrozen } from '../habit-tracking/progress';
import { isDueOn, isWeekly } from '../scheduling/schedule';
import { weekdayPattern } from '../statistics/stats';

export interface Insight {
  id: string;
  vi: string;
  en: string;
  habitId?: string;
}

const DAY_VI = ['Chủ nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'];
const DAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function insightsFor(state: HabitState, today: DayKey): Insight[] {
  const out: Insight[] = [];
  const counts = weekdayPattern(state, today);
  const total = counts.reduce((a, b) => a + b, 0);
  if (total >= 14) {
    const best = counts.indexOf(Math.max(...counts));
    const worst = counts.indexOf(Math.min(...counts));
    if (best !== worst) {
      out.push({
        id: 'weekday',
        vi: `Bạn làm tốt nhất vào ${DAY_VI[best]} và hay bỏ lỡ vào ${DAY_VI[worst]}. Thử đặt nhắc nhở sớm hơn vào ${DAY_VI[worst]}.`,
        en: `You do best on ${DAY_EN[best]} and slip most on ${DAY_EN[worst]}. Try an earlier reminder on ${DAY_EN[worst]}.`,
      });
    }
  }
  for (const h of Object.values(state.habits)) {
    if (h.archivedAt !== null || isWeekly(h) || h.source.kind !== 'manual') continue;
    let due = 0;
    let missed = 0;
    for (let i = 1; due < 5 && i <= 21; i += 1) {
      const d = addDays(today, -i);
      if (d < h.startDate) break;
      if (!isDueOn(h, d) || isFrozen(state, d)) continue;
      due += 1;
      if (!isDoneOn(state, h, d)) missed += 1;
    }
    if (due >= 4 && missed >= 3) {
      out.push({
        id: `slipping-${h.id}`,
        habitId: h.id,
        vi:
          h.target > 1
            ? `"${h.name}" bị lỡ ${missed}/${due} lần gần đây. Hạ mục tiêu xuống mức dễ hơn để giữ nhịp.`
            : `"${h.name}" bị lỡ ${missed}/${due} lần gần đây. Thử bớt số ngày trong tuần hoặc gắn nó sau một việc bạn luôn làm.`,
        en:
          h.target > 1
            ? `"${h.name}" was missed ${missed} of the last ${due} times. Lower the target to keep the rhythm.`
            : `"${h.name}" was missed ${missed} of the last ${due} times. Try fewer days a week, or tie it to something you always do.`,
      });
    }
  }
  return out;
}
