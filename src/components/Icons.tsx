/** Interface and habit icons: one stroke style, drawn to match Olaa Note's icon set. */
import type { ReactNode } from 'react';
import type { HabitIcon } from '../features/habit-management/types';

function Svg({ children, size = 22 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const PlusIcon = () => (
  <Svg>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const BackIcon = () => (
  <Svg>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const ChevronLeftIcon = BackIcon;
export const ChevronRightIcon = () => (
  <Svg>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);
export const CheckIcon = ({ size = 22 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const TodayIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12.2l2.5 2.5 4.6-4.9" />
  </Svg>
);
export const CalendarIcon = () => (
  <Svg>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);
export const ChartIcon = () => (
  <Svg>
    <path d="M5 20V11M12 20V5M19 20v-6" />
  </Svg>
);
export const SettingsIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" />
  </Svg>
);
export const FlameIcon = ({ size = 18 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.2 3.6-8.3.4 2 1.6 3.1 2.6 3.6C12 6.6 13.6 4 15.8 3c-.5 3 1 4.8 2 6.4.8 1.3 1.2 2.8 1.2 4.4 0 4.3-3 7.2-7 7.2z" />
  </Svg>
);
export const SnowIcon = ({ size = 18 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5" />
  </Svg>
);
export const BellIcon = ({ size = 18 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15zM10 20.5a2 2 0 004 0" />
  </Svg>
);
export const ArchiveIcon = () => (
  <Svg>
    <rect x="3" y="4" width="18" height="5" rx="1.5" />
    <path d="M5 9v10a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 19V9M10 13h4" />
  </Svg>
);
export const TrashIcon = () => (
  <Svg>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Svg>
);
export const EditIcon = () => (
  <Svg>
    <path d="M4 20l1.2-4.6L15.8 4.8a2 2 0 012.8 0l.6.6a2 2 0 010 2.8L8.6 18.8z" />
    <path d="M13.5 7l3.5 3.5" />
  </Svg>
);
export const UpIcon = () => (
  <Svg>
    <path d="M6 15l6-6 6 6" />
  </Svg>
);
export const DownIcon = () => (
  <Svg>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);
export const ExternalIcon = ({ size = 18 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />
  </Svg>
);
export const BoltIcon = ({ size = 16 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />
  </Svg>
);
export const MinusIcon = () => (
  <Svg>
    <path d="M5 12h14" />
  </Svg>
);

const HABIT_PATHS: Record<HabitIcon, ReactNode> = {
  book: (
    <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5zM4 20.5A2.5 2.5 0 006.5 23H20M9 7h7" />
  ),
  language: (
    <>
      <path d="M4 5h9M8.5 3v2M6 5c.6 3.2 2.6 5.8 5.5 7.3M11 5c-.6 3.6-3 6.6-6.5 8" />
      <path d="M12.5 21l4-9 4 9M14 18h5" />
    </>
  ),
  note: (
    <>
      <rect x="4" y="3" width="13" height="18" rx="2.5" />
      <path d="M8 8h5M8 12h5M20 6v12" />
    </>
  ),
  pen: (
    <path d="M4 20l1.2-4.6L15.8 4.8a2 2 0 012.8 0l.6.6a2 2 0 010 2.8L8.6 18.8zM13.5 7l3.5 3.5" />
  ),
  water: (
    <path d="M12 3.5c3 3.8 6 7.4 6 10.7a6 6 0 01-12 0c0-3.3 3-6.9 6-10.7zM9.5 15a2.5 2.5 0 002.5 2.5" />
  ),
  run: (
    <>
      <circle cx="14.5" cy="4.5" r="1.8" />
      <path d="M7 21l3-5 3 2v4M6 11l3-3.5h4.5L16 11l3 1M10.5 7.5L9 14l4 3" />
    </>
  ),
  dumbbell: <path d="M3 10v4M6 7.5v9M18 7.5v9M21 10v4M6 12h12" />,
  leaf: <path d="M5 19c0-9 5.5-14 15-14 0 9.5-5 15-13 15M5 19l7-7" />,
  moon: <path d="M19.5 14.5A8 8 0 119.5 4.5a6.5 6.5 0 0010 10z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 5.6-7.5 10-7.5 10z" />
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  code: <path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" />,
  'coffee-off': (
    <path d="M5 9h11v5a5 5 0 01-5 5h-1a5 5 0 01-5-5zM16 10h1.5a2.5 2.5 0 010 5H16M3 3l18 18" />
  ),
  'phone-off': (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M11 18.5h2M3 3l18 18" />
    </>
  ),
  star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z" />,
};

export function HabitGlyph({ icon, size = 22 }: { icon: HabitIcon; size?: number }) {
  return <Svg size={size}>{HABIT_PATHS[icon]}</Svg>;
}
