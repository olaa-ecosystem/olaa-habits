import type { ReactNode } from 'react';

/** Circular progress (0–1), used for days in the week strip and count habits. */
export function ProgressRing({
  ratio,
  size = 40,
  stroke = 4,
  frozen = false,
  children,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  frozen?: boolean;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <span
      className={`ring ${clamped >= 1 ? 'is-full' : ''} ${frozen ? 'is-frozen' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} aria-hidden>
        <circle
          className="ring__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring__label">{children}</span>
    </span>
  );
}
