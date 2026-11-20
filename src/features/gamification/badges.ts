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
import { tr } from '../../i18n/locale';

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
    get title() {
      return tr('Bước đầu tiên', 'First step');
    },
    get description() {
      return tr('Hoàn thành thói quen lần đầu.', 'Complete a habit for the first time.');
    },
  },
  {
    id: 'streak-7',
    icon: '🔥',
    get title() {
      return tr('Chuỗi 7', 'Streak of 7');
    },
    get description() {
      return tr('Giữ chuỗi 7 lần liên tiếp.', 'Keep a streak 7 times in a row.');
    },
  },
  {
    id: 'streak-30',
    icon: '🌟',
    get title() {
      return tr('Chuỗi 30', 'Streak of 30');
    },
    get description() {
      return tr('Giữ chuỗi 30 lần liên tiếp.', 'Keep a streak 30 times in a row.');
    },
  },
  {
    id: 'streak-100',
    icon: '🏆',
    get title() {
      return tr('Chuỗi 100', 'Streak of 100');
    },
    get description() {
      return tr('Giữ chuỗi 100 lần liên tiếp.', 'Keep a streak 100 times in a row.');
    },
  },
  {
    id: 'freeze-used',
    icon: '❄️',
    get title() {
      return tr('Nghỉ có kế hoạch', 'Planned rest');
    },
    get description() {
      return tr(
        'Dùng đóng băng để giữ chuỗi qua một ngày bận.',
        'Use a freeze to keep a streak through a busy day.',
      );
    },
  },
  {
    id: 'perfect-week',
    icon: '🗓️',
    get title() {
      return tr('Tuần trọn vẹn', 'Perfect week');
    },
    get description() {
      return tr(
        'Hoàn thành đủ mọi thói quen trong một tuần.',
        'Complete every habit for a whole week.',
      );
    },
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
