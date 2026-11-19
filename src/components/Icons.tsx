import type { ReactNode } from 'react';

function Svg({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const TodayIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.8 2.8L16.5 9.5" />
  </Svg>
);
export const CalendarIcon = () => (
  <Svg>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);
export const ListIcon = () => (
  <Svg>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" />
    <circle cx="4.5" cy="12" r="1" />
    <circle cx="4.5" cy="18" r="1" />
  </Svg>
);
export const UserIcon = () => (
  <Svg>
    <circle cx="12" cy="8.5" r="4" />
    <path d="M4.5 20c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
  </Svg>
);
export const CheckIcon = ({ size = 24 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const PlusIcon = () => (
  <Svg>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const ChevronLeftIcon = () => (
  <Svg>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const ChevronRightIcon = () => (
  <Svg>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);
export const FlameIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M12.6 2.2c.4 3-1.4 4.6-2.9 6.2C8.2 10 7 11.6 7 14a5 5 0 0010 0c0-1.6-.6-2.9-1.4-4 .1 1.3-.4 2.4-1.4 2.9.3-3.7-1-7.6-1.6-10.7z"
    />
  </svg>
);
export const SnowIcon = ({ size = 18 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5" />
  </Svg>
);
