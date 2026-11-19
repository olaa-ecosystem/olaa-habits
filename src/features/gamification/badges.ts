import { addDays, daysBetween, weekStartOf, type DayKey } from '../../utils/date';
import type { Habit } from '../habit-management/types';
import { isDayBased, isScheduledOn } from '../scheduling/schedule';
import { computeStreak } from '../streaks/streak';

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

export interface BadgeInput {
  habits: Habit[];
  checkins: Record<string, Record<DayKey, true>>;
  freezes: Record<DayKey, true>;
  today: DayKey;
}

const PERFECT_WEEK_LOOKBACK = 12;

export function detectBadges({ habits, checkins, freezes, today }: BadgeInput): BadgeId[] {
  const found: BadgeId[] = [];
  const done = (habitId: string) => (day: DayKey) => Boolean(checkins[habitId]?.[day]);
  const frozen = (day: DayKey) => Boolean(freezes[day]);

  if (habits.some((h) => Object.keys(checkins[h.id] ?? {}).length > 0)) found.push('first-checkin');

  const best = Math.max(
    0,
    ...habits.map(
      (h) =>
        computeStreak({
          schedule: h.schedule,
          createdOn: h.createdOn,
          today: h.archivedOn ?? today,
          done: done(h.id),
          frozen,
        }).best,
    ),
  );
  if (best >= 7) found.push('streak-7');
  if (best >= 30) found.push('streak-30');
  if (best >= 100) found.push('streak-100');

  if (Object.keys(freezes).some((d) => d < today)) found.push('freeze-used');

  const thisWeek = weekStartOf(today);
  for (let i = 1; i <= PERFECT_WEEK_LOOKBACK; i++) {
    if (isPerfectWeek(addDays(thisWeek, -7 * i), habits, done, frozen)) {
      found.push('perfect-week');
      break;
    }
  }
  return found;
}

function isPerfectWeek(
  week: DayKey,
  habits: Habit[],
  done: (habitId: string) => (day: DayKey) => boolean,
  frozen: (day: DayKey) => boolean,
): boolean {
  const end = addDays(week, 6);
  const active = habits.filter(
    (h) => h.createdOn <= week && (h.archivedOn === null || h.archivedOn > end),
  );
  if (active.length === 0) return false;
  const days = daysBetween(week, end);
  return active.every((h) => {
    const isDone = done(h.id);
    if (isDayBased(h.schedule)) {
      return days.every((d) => !isScheduledOn(h.schedule, d) || isDone(d) || frozen(d));
    }
    const times = h.schedule.kind === 'perWeek' ? h.schedule.times : 1;
    return days.filter(isDone).length >= Math.max(0, times - days.filter(frozen).length);
  });
}
