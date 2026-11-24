/**
 * Icons, the same set as Olaa Language. The 20 Olaa function icons come from olaa-platform `packages/design-system/icons`
 * (copied into src/assets/icons; solid, `currentColor`). Buttons that set does not cover yet
 * (UI buttons PRD §9.2: close, back, check, cross, plus, chevrons, sound, theme, download…)
 * use the small stroke icons below until the owner's versions arrive.
 */
import type { ReactNode } from 'react';
import type { HabitIcon } from '../features/habit-management/types';

const olaa = import.meta.glob<string>('../assets/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export type OlaaIconName =
  | 'achievement'
  | 'bookmark'
  | 'calendar'
  | 'collections'
  | 'delete'
  | 'edit'
  | 'goals'
  | 'habits'
  | 'language'
  | 'lessons'
  | 'listening'
  | 'more'
  | 'note'
  | 'notifications'
  | 'profile'
  | 'progress'
  | 'search'
  | 'settings'
  | 'speaking'
  | 'vocabulary';

const stroke = (children: ReactNode, width = 2) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const LINE_SUN = stroke(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
  </>,
);

const LINE = {
  close: stroke(<path d="M6 6l12 12M18 6L6 18" />, 2.2),
  back: stroke(<path d="M15 5l-7 7 7 7" />, 2.2),
  next: stroke(<path d="M9 5l7 7-7 7" />, 2.2),
  arrow: stroke(<path d="M7 17L17 7M9 7h8v8" />, 2.2),
  check: stroke(<path d="M5 12.5l4.5 4.5L19 7.5" />, 2.6),
  cross: stroke(<path d="M7 7l10 10M17 7L7 17" />, 2.6),
  plus: stroke(<path d="M12 5v14M5 12h14" />, 2.4),
  sound: stroke(
    <>
      <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" />
      <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
    </>,
  ),
  slow: stroke(
    <>
      <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" />
      <path d="M16 12h4" />
    </>,
  ),
  sun: LINE_SUN,
  moon: stroke(<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />),
  auto: stroke(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17" />
      <path d="M12 3.5a8.5 8.5 0 010 17z" fill="currentColor" />
    </>,
  ),
  download: stroke(<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />),
  flame: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.6 2.4c.5 3-1.3 4.6-2.8 6.2C8.4 10.1 7 11.6 7 14.2A5 5 0 0012 19.5a5 5 0 005-5.2c0-2-1-3.5-2-4.6.1 1.4-.4 2.6-1.5 3.1.6-3.7-.3-7.7-.9-10.4z" />
    </svg>
  ),
  lock: stroke(
    <>
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>,
  ),
  play: stroke(<path d="M8 5.5v13l10-6.5z" />),
  logout: stroke(<path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4M10 16l-4-4 4-4M6 12h10" />),
  text: stroke(<path d="M5 6h14M5 12h14M5 18h9" />),
  ring: stroke(
    <>
      <circle cx="12" cy="12" r="7.2" strokeOpacity=".4" />
      <path d="M12 4.8a7.2 7.2 0 11-6.85 4.97" />
    </>,
    2.4,
  ),
  minus: stroke(<path d="M5 12h14" />, 2.4),
  snow: stroke(
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5" />,
    1.9,
  ),
  archive: stroke(
    <>
      <rect x="3" y="4" width="18" height="5" rx="1.5" />
      <path d="M5 9v10a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 19V9M10 13h4" />
    </>,
  ),
  external: stroke(
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />,
  ),
  up: stroke(<path d="M6 15l6-6 6 6" />, 2.2),
  down: stroke(<path d="M6 9l6 6 6-6" />, 2.2),
  upload: stroke(<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14" />),
  sparkle: stroke(
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
    1.8,
  ),
} as const;

export type LineIconName = keyof typeof LINE;
export type IconName = OlaaIconName | LineIconName;

/** Habit icons. Ids are stored in user data, so they never change; drawn in the Olaa style. */
const HABIT: Record<HabitIcon, ReactNode> = {
  book: null,
  language: null,
  note: null,
  pen: stroke(
    <path d="M4 20l1.2-4.6L15.8 4.8a2 2 0 012.8 0l.6.6a2 2 0 010 2.8L8.6 18.8zM13.5 7l3.5 3.5" />,
  ),
  water: stroke(
    <path d="M12 3.5c3 3.8 6 7.4 6 10.7a6 6 0 01-12 0c0-3.3 3-6.9 6-10.7zM9.5 15a2.5 2.5 0 002.5 2.5" />,
  ),
  run: stroke(
    <>
      <circle cx="14.5" cy="4.5" r="1.8" />
      <path d="M7 21l3-5 3 2v4M6 11l3-3.5h4.5L16 11l3 1M10.5 7.5L9 14l4 3" />
    </>,
  ),
  dumbbell: stroke(<path d="M3 10v4M6 7.5v9M18 7.5v9M21 10v4M6 12h12" />, 2.4),
  leaf: stroke(<path d="M5 19c0-9 5.5-14 15-14 0 9.5-5 15-13 15M5 19l7-7" />),
  moon: stroke(<path d="M19.5 14.5A8 8 0 119.5 4.5a6.5 6.5 0 0010 10z" />),
  sun: LINE_SUN,
  heart: stroke(
    <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 5.6-7.5 10-7.5 10z" />,
  ),
  music: stroke(
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>,
  ),
  code: stroke(<path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" />),
  'coffee-off': stroke(
    <path d="M5 9h11v5a5 5 0 01-5 5h-1a5 5 0 01-5-5zM16 10h1.5a2.5 2.5 0 010 5H16M3 3l18 18" />,
  ),
  'phone-off': stroke(
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M11 18.5h2M3 3l18 18" />
    </>,
  ),
  star: stroke(
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z" />,
  ),
};
/** Habit icons that use the Olaa function icon of the same meaning. */
const HABIT_OLAA: Partial<Record<HabitIcon, OlaaIconName>> = {
  book: 'lessons',
  language: 'language',
  note: 'note',
};

export function HabitGlyph({ icon }: { icon: HabitIcon }) {
  const olaaName = HABIT_OLAA[icon];
  if (olaaName) return <Icon name={olaaName} />;
  return (
    <span className="icon" aria-hidden="true">
      {HABIT[icon] ?? HABIT.star}
    </span>
  );
}

export function Icon({
  name,
  size,
  className,
}: {
  name: IconName;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const cls = `icon${size ? ` icon--${size}` : ''}${className ? ` ${className}` : ''}`;
  if (name in LINE)
    return (
      <span className={cls} aria-hidden="true">
        {LINE[name as LineIconName]}
      </span>
    );
  const svg = olaa[`../assets/icons/${name}.svg`] ?? '';
  // Our own bundled SVG files (design system), never user or content text.
  return <span className={cls} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}
