import type { HabitDraft } from './types';
import { tr } from '../../i18n/locale';

/** Starter habits offered during onboarding. Learning comes first (PRD 02, section 4). */
export const HABIT_TEMPLATES: (HabitDraft & { id: string })[] = [
  {
    id: 'language',
    get name() {
      return tr('Đạt mục tiêu ngày ở Olaa Language', 'Reach the daily goal in Olaa Language');
    },
    icon: '🗣️',
    color: 'blue',
    schedule: { kind: 'daily' },
    source: { kind: 'language.daily_goal' },
  },
  {
    id: 'review',
    get name() {
      return tr('Ôn bài trên lớp', 'Review class notes');
    },
    icon: '📚',
    color: 'purple',
    schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4] },
  },
  {
    id: 'reading',
    get name() {
      return tr('Đọc sách', 'Read');
    },
    icon: '📖',
    color: 'orange',
    schedule: { kind: 'daily' },
    kind: 'quantity',
    target: 10,
    get unit() {
      return tr('trang', 'pages');
    },
  },
  {
    id: 'exercise',
    get name() {
      return tr('Tập thể dục', 'Exercise');
    },
    icon: '🏃',
    color: 'green',
    schedule: { kind: 'perWeek', times: 3 },
  },
  {
    id: 'water',
    get name() {
      return tr('Uống nước', 'Drink water');
    },
    icon: '💧',
    color: 'teal',
    schedule: { kind: 'daily' },
    kind: 'quantity',
    target: 6,
    get unit() {
      return tr('ly', 'glasses');
    },
  },
  {
    id: 'sleep',
    get name() {
      return tr('Ngủ trước 23 giờ', 'Sleep before 11 pm');
    },
    icon: '😴',
    color: 'pink',
    schedule: { kind: 'daily' },
  },
];
