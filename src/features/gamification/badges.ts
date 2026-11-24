/**
 * Badges (module 02.10, REQ-02-024). Earned once and kept, even when a streak later breaks.
 * `newBadges` is pure: it returns what should be added, the store records it.
 */
import type { EarnedBadge, HabitState } from '../../stores/habitState';
import { addDays, type DayKey } from '../../utils/date';
import { doneInWeek, frozenInWeek, isDoneOn, isFrozen } from '../habit-tracking/progress';
import { isDueOn, isWeekly, weekOf, weeklyQuota } from '../scheduling/schedule';
import { streakOf } from '../streaks/streaks';

export const BADGE_IDS = [
  'first-check',
  'streak-7',
  'streak-30',
  'streak-100',
  'first-freeze',
  'perfect-week',
  'auto-learner',
] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

export const BADGE_TEXT: Record<BadgeId, { vi: [string, string]; en: [string, string] }> = {
  'first-check': {
    vi: ['Bước đầu tiên', 'Hoàn thành thói quen lần đầu'],
    en: ['First step', 'Completed a habit for the first time'],
  },
  'streak-7': {
    vi: ['Một tuần liền', 'Chuỗi 7 ngày ở một thói quen'],
    en: ['One week strong', 'A 7-day streak on one habit'],
  },
  'streak-30': {
    vi: ['Một tháng liền', 'Chuỗi 30 ngày ở một thói quen'],
    en: ['One month strong', 'A 30-day streak on one habit'],
  },
  'streak-100': {
    vi: ['Trăm ngày', 'Chuỗi 100 ngày ở một thói quen'],
    en: ['Hundred days', 'A 100-day streak on one habit'],
  },
  'first-freeze': {
    vi: ['Nghỉ đúng cách', 'Đóng băng một ngày bận và giữ được chuỗi'],
    en: ['Smart rest', 'Froze a busy day and kept the streak going'],
  },
  'perfect-week': {
    vi: ['Tuần trọn vẹn', 'Hoàn thành mọi thói quen trong một tuần'],
    en: ['Perfect week', 'Completed every habit for a whole week'],
  },
  'auto-learner': {
    vi: ['Học thật', 'Thói quen đầu tiên tự ghi nhận từ Olaa Language'],
    en: ['Real learning', 'First habit checked off by Olaa Language'],
  },
};

function weekIsPerfect(state: HabitState, weekStartDay: DayKey): boolean {
  let any = false;
  for (const h of Object.values(state.habits)) {
    if (h.archivedAt !== null) continue;
    if (isWeekly(h)) {
      const quota = weeklyQuota(h, weekStartDay);
      if (quota === 0) continue;
      any = true;
      const until = addDays(weekStartDay, 6);
      if (doneInWeek(state, h, weekStartDay, until) + frozenInWeek(state, h, weekStartDay) < quota)
        return false;
      continue;
    }
    for (let i = 0; i < 7; i += 1) {
      const d = addDays(weekStartDay, i);
      if (!isDueOn(h, d)) continue;
      any = true;
      if (!isDoneOn(state, h, d) && !isFrozen(state, d)) return false;
    }
  }
  return any;
}

export function newBadges(state: HabitState, today: DayKey, now: number): EarnedBadge[] {
  const have = state.badges;
  const out: EarnedBadge[] = [];
  const add = (id: BadgeId, habitId: string | null) => {
    if (!have[id] && !out.some((b) => b.id === id)) out.push({ id, earnedAt: now, habitId });
  };

  const habits = Object.values(state.habits).filter((h) => h.archivedAt === null);
  if (Object.values(state.checkIns).some((c) => c.value > 0)) add('first-check', null);

  for (const h of habits) {
    const s = streakOf(state, h, today);
    // Weekly habits reach day milestones at 7 days per week of streak.
    const days = s.unit === 'week' ? s.best * 7 : s.best;
    if (days >= 7) add('streak-7', h.id);
    if (days >= 30) add('streak-30', h.id);
    if (days >= 100) add('streak-100', h.id);
    if (s.freezeBridged) add('first-freeze', h.id);
    if (h.source.kind !== 'manual') {
      for (let i = 0; i < 60; i += 1) {
        const d = addDays(today, -i);
        if (d < h.startDate) break;
        if (isDoneOn(state, h, d)) {
          add('auto-learner', h.id);
          add('first-check', h.id);
          break;
        }
      }
    }
  }

  // The last four finished weeks, so a week is not missed when the app was closed.
  if (!have['perfect-week']) {
    const thisWeek = weekOf(today, state.settings.weekStart);
    for (let i = 1; i <= 4; i += 1) {
      if (weekIsPerfect(state, addDays(thisWeek, -7 * i))) {
        add('perfect-week', null);
        break;
      }
    }
  }
  return out;
}
