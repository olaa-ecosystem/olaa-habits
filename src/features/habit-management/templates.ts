import type { HabitDraft } from './types';

/** Starter habits offered during onboarding. Learning comes first (PRD 02, section 4). */
export const HABIT_TEMPLATES: (HabitDraft & { id: string })[] = [
  {
    id: 'language',
    name: 'Đạt mục tiêu ngày ở Olaa Language',
    icon: '🗣️',
    color: 'blue',
    schedule: { kind: 'daily' },
    source: { kind: 'language.daily_goal' },
  },
  {
    id: 'review',
    name: 'Ôn bài trên lớp',
    icon: '📚',
    color: 'purple',
    schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4] },
  },
  {
    id: 'reading',
    name: 'Đọc sách',
    icon: '📖',
    color: 'orange',
    schedule: { kind: 'daily' },
    kind: 'quantity',
    target: 10,
    unit: 'trang',
  },
  {
    id: 'exercise',
    name: 'Tập thể dục',
    icon: '🏃',
    color: 'green',
    schedule: { kind: 'perWeek', times: 3 },
  },
  {
    id: 'water',
    name: 'Uống nước',
    icon: '💧',
    color: 'teal',
    schedule: { kind: 'daily' },
    kind: 'quantity',
    target: 6,
    unit: 'ly',
  },
  { id: 'sleep', name: 'Ngủ trước 23 giờ', icon: '😴', color: 'pink', schedule: { kind: 'daily' } },
];
