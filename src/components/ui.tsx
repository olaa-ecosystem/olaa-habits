import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { toDayKey } from '../utils/date';
import { Icon, type IconName } from './Icon';

/* ---------- progress ---------- */

export function Ring({
  value,
  size = 64,
  width = 7,
  warm,
  children,
  label,
}: {
  value: number;
  size?: number;
  width?: number;
  warm?: boolean;
  children?: ReactNode;
  label?: string;
}) {
  const r = (size - width) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className="ring-wrap" role="img" aria-label={label}>
      <svg
        className={`ring${warm ? ' ring--warm' : ''}`}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle className="track" cx={size / 2} cy={size / 2} r={r} strokeWidth={width} />
        <circle
          className="fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={width}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <span className="ring-label">{children}</span>}
    </span>
  );
}

export function Bar({ value, warm, label }: { value: number; warm?: boolean; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      className={`bar${warm ? ' bar--warm' : ''}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------- Olaa app tiles (same look as Olaa Note's) ---------- */

export type OlaaApp = 'lang' | 'note' | 'habit';

export function AppTile({ app, size, open }: { app: OlaaApp; size?: 'sm' | 'lg'; open?: boolean }) {
  const cls = `apptile apptile--${app}${size ? ` ${size}` : ''}`;
  const glyph =
    app === 'lang' ? (
      <span className="gl">Aa</span>
    ) : app === 'habit' ? (
      <Icon name="ring" />
    ) : (
      <Icon name="note" />
    );
  if (open)
    return (
      <span className={`${cls} apptile--open`}>
        {glyph}
        {app === 'lang' ? 'Language' : app === 'note' ? 'Note' : 'Habits'}
      </span>
    );
  return (
    <span className={cls} aria-hidden="true">
      {glyph}
    </span>
  );
}

/* ---------- buttons ---------- */

export function IconButton({
  icon,
  label,
  onClick,
  pressed,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      className="iconbtn"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a className="back" href={to}>
      <Icon name="back" size="sm" />
      {children}
    </a>
  );
}

/* ---------- dialog & toast ---------- */

export function Dialog({
  title,
  children,
  actions,
  onClose,
}: {
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[data-autofocus], button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="dialog-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title" ref={ref}>
        <h2 id="dlg-title">{title}</h2>
        {children}
        <div className="row row--end">{actions}</div>
      </div>
    </div>
  );
}

export interface ToastMessage {
  id: number;
  text: string;
  reward?: boolean;
  action?: { label: string; run: () => void };
}

let toastMessage: ToastMessage | null = null;
let toastSeq = 0;
const toastListeners = new Set<() => void>();
let toastTimer: ReturnType<typeof setTimeout> | undefined;
const setToast = (m: ToastMessage | null) => {
  toastMessage = m;
  toastListeners.forEach((l) => l());
};

/** A short message above the navigation; with an action (Undo) it stays longer. */
export function toast(
  text: string,
  opts: { reward?: boolean; action?: ToastMessage['action'] } = {},
): void {
  toastSeq += 1;
  setToast({ id: toastSeq, text, ...opts });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setToast(null), opts.action ? 5000 : 2600);
}

export function Toasts() {
  const message = useSyncExternalStore(
    (l) => {
      toastListeners.add(l);
      return () => toastListeners.delete(l);
    },
    () => toastMessage,
    () => null,
  );
  return (
    <div role="status" aria-live="polite">
      {message && (
        <div className={`toast${message.reward ? ' toast--reward' : ''}`} key={message.id}>
          <span>{message.text}</span>
          {message.action && (
            <button
              type="button"
              onClick={() => {
                message.action?.run();
                setToast(null);
              }}
            >
              {message.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- states ---------- */

export function Empty({
  icon = 'collections',
  title,
  children,
}: {
  icon?: IconName;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <h3>{title}</h3>
      {children && (
        <div className="small" style={{ marginTop: 6 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Today's day key, refreshed every minute so the app rolls over at midnight. */
export function useToday(): string {
  const [day, setDay] = useState(() => toDayKey(new Date()));
  useEffect(() => {
    const id = setInterval(() => setDay(toDayKey(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);
  return day;
}

export function Confetti() {
  const colors = ['#f3bd90', '#e9a066', '#f3e2b3', '#dcd6ea', '#d8835d', '#82c3a6'];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 9) * 0.08}s`,
            animationDuration: `${1.8 + (i % 5) * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}
