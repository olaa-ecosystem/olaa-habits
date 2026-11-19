import { addDays, daysBetween, weekStartOf, type DayKey } from '../../utils/date';
import {
  habitStreak,
  isExcused,
  orderedHabits,
  outcomeOn,
  segmentsOf,
  type AppState,
} from '../../stores/appState';
import type { Habit } from '../habit-management/types';
import { isDayBased, isScheduledOn } from '../scheduling/schedule';

/** Badges (module 02.10, REQ-02-024). Once earned they are kept, even if a streak breaks. */
export type BadgeId =
  | 'first-checkin'
  | 'streak-7'
  | 'streak-30'
  | 'streak-100'
  | 'freeze-used'
  | 'perfect-week';

export const BADGES: { id: BadgeId; icon: string; title: string; description: string }[] = [
  {
    id: 'first-checkin',
    icon: '✅',
    title: 'Bước đầu tiên',
    description: 'Hoàn thành thói quen lần đầu.',
  },
  { id: 'streak-7', icon: '🔥', title: 'Chuỗi 7', description: 'Giữ chuỗi 7 lần liên tiếp.' },
  { id: 'streak-30', icon: '🌟', title: 'Chuỗi 30', description: 'Giữ chuỗi 30 lần liên tiếp.' },
  { id: 'streak-100', icon: '🏆', title: 'Chuỗi 100', description: 'Giữ chuỗi 100 lần liên tiếp.' },
  {
    id: 'freeze-used',
    icon: '❄️',
    title: 'Nghỉ có kế hoạch',
    description: 'Dùng đóng băng để giữ chuỗi qua một ngày bận.',
  },
  {
    id: 'perfect-week',
    icon: '🗓️',
    title: 'Tuần trọn vẹn',
    description: 'Hoàn thành đủ mọi thói quen trong một tuần.',
  },
];

const PERFECT_WEEK_LOOKBACK = 12;

export function detectBadges(state: AppState, today: DayKey): BadgeId[] {
  const habits = orderedHabits(state);
  const found: BadgeId[] = [];

  if (
    habits.some((h) =>
      Object.keys(state.checkins[h.id] ?? {}).some((d) => outcomeOn(state, h, d) === 'done'),
    )
  ) {
    found.push('first-checkin');
  }

  const best = Math.max(0, ...habits.map((h) => habitStreak(state, h, today).best));
  if (best >= 7) found.push('streak-7');
  if (best >= 30) found.push('streak-30');
  if (best >= 100) found.push('streak-100');

  if (Object.keys(state.freezes).some((d) => d < today)) found.push('freeze-used');

  const thisWeek = weekStartOf(today);
  for (let i = 1; i <= PERFECT_WEEK_LOOKBACK; i++) {
    if (isPerfectWeek(state, addDays(thisWeek, -7 * i), habits, today)) {
      found.push('perfect-week');
      break;
    }
  }
  return found;
}

/** Every habit active that whole week met its plan; skipped, frozen and paused days are fine. */
function isPerfectWeek(state: AppState, week: DayKey, habits: Habit[], today: DayKey): boolean {
  const end = addDays(week, 6);
  const active = habits.filter(
    (h) => h.createdOn <= week && (h.archivedOn === null || h.archivedOn > end),
  );
  if (active.length === 0) return false;
  const days = daysBetween(week, end);
  return active.every((h) => {
    const ok = (d: DayKey) => {
      const o = outcomeOn(state, h, d);
      return o === 'done' || o === 'skipped' || isExcused(state, h, d);
    };
    const seg = segmentsOf(h, today).find((s) => s.from <= week && s.to >= week);
    const schedule = seg?.schedule ?? h.schedule;
    if (isDayBased(schedule)) return days.every((d) => !isScheduledOn(schedule, d) || ok(d));
    const times = schedule.kind === 'perWeek' ? schedule.times : 1;
    const excused = days.filter(
      (d) => isExcused(state, h, d) || outcomeOn(state, h, d) === 'skipped',
    ).length;
    return (
      days.filter((d) => outcomeOn(state, h, d) === 'done').length >= Math.max(0, times - excused)
    );
  });
}
