/**
 * Ready-made habits (REQ-02-004). Learning templates come first; Language ones are checked off
 * automatically, the Olaa Note one opens the user's notebook.
 */
import type { HabitInput } from '../../stores/habitActions';
import type { DayKey } from '../../utils/date';

export interface HabitTemplate {
  id: string;
  group: 'learning' | 'health' | 'mind';
  name: [string, string];
  unit?: [string, string];
  make: (startDate: DayKey) => Omit<HabitInput, 'name' | 'unit'>;
}

const base = (startDate: DayKey) => ({
  reminder: null,
  noteLink: null,
  startDate,
  timeOfDay: 'any' as const,
  source: { kind: 'manual' } as const,
  schedule: { kind: 'daily' } as const,
  target: 1,
});

export const TEMPLATES: HabitTemplate[] = [
  {
    id: 'language-goal',
    group: 'learning',
    name: ['Đạt mục tiêu ngày ở Olaa Language', 'Reach my daily goal in Olaa Language'],
    make: (d) => ({
      ...base(d),
      icon: 'language',
      color: 'blue',
      source: { kind: 'language.daily_goal' },
    }),
  },
  {
    id: 'language-lessons',
    group: 'learning',
    name: ['Học bài mới ở Olaa Language', 'New lessons in Olaa Language'],
    unit: ['bài', 'lessons'],
    make: (d) => ({
      ...base(d),
      icon: 'book',
      color: 'teal',
      target: 2,
      source: { kind: 'language.lessons' },
    }),
  },
  {
    id: 'review-notes',
    group: 'learning',
    name: ['Ôn lại ghi chú trong Olaa Note', 'Review my notes in Olaa Note'],
    make: (d) => ({ ...base(d), icon: 'note', color: 'orange', timeOfDay: 'evening' }),
  },
  {
    id: 'read',
    group: 'learning',
    name: ['Đọc sách', 'Read'],
    unit: ['trang', 'pages'],
    make: (d) => ({ ...base(d), icon: 'book', color: 'purple', target: 10, timeOfDay: 'evening' }),
  },
  {
    id: 'focus',
    group: 'learning',
    name: ['Tập trung học không điện thoại', 'Study with the phone away'],
    unit: ['phút', 'minutes'],
    make: (d) => ({ ...base(d), icon: 'phone-off', color: 'red', target: 25 }),
  },
  {
    id: 'water',
    group: 'health',
    name: ['Uống nước', 'Drink water'],
    unit: ['ly', 'glasses'],
    make: (d) => ({ ...base(d), icon: 'water', color: 'blue', target: 8 }),
  },
  {
    id: 'move',
    group: 'health',
    name: ['Vận động', 'Exercise'],
    make: (d) => ({
      ...base(d),
      icon: 'run',
      color: 'green',
      schedule: { kind: 'perWeek', times: 3 },
      timeOfDay: 'afternoon',
    }),
  },
  {
    id: 'sleep',
    group: 'health',
    name: ['Ngủ trước 23:00', 'In bed by 11 pm'],
    make: (d) => ({ ...base(d), icon: 'moon', color: 'purple', timeOfDay: 'evening' }),
  },
  {
    id: 'journal',
    group: 'mind',
    name: ['Viết nhật ký 3 dòng', 'Write a 3-line journal'],
    make: (d) => ({ ...base(d), icon: 'pen', color: 'gold', timeOfDay: 'evening' }),
  },
  {
    id: 'meditate',
    group: 'mind',
    name: ['Thiền', 'Meditate'],
    unit: ['phút', 'minutes'],
    make: (d) => ({ ...base(d), icon: 'leaf', color: 'teal', target: 5, timeOfDay: 'morning' }),
  },
];
