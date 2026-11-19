import type { Habit } from '../features/habit-management/types';

/** The habit's icon on its colour, used in every list. */
export function HabitBadge({
  habit,
  size = 44,
}: {
  habit: Pick<Habit, 'icon' | 'color'>;
  size?: number;
}) {
  return (
    <span
      className={`habit-badge habit-color--${habit.color}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
      aria-hidden
    >
      {habit.icon}
    </span>
  );
}
