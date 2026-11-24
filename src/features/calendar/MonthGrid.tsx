import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, SnowIcon } from '../../components/Icons';
import { getLocale, tr } from '../../i18n/locale';
import { addMonths, monthGrid, monthOf, type DayKey } from '../../utils/date';
import { formatDayLong, formatMonth } from '../../utils/format';
import type { DayStatus } from '../habit-tracking/progress';
import { orderedWeekdays, weekdayShort } from '../scheduling/schedule';

export function statusText(s: DayStatus): string {
  switch (s) {
    case 'done':
      return tr('đã xong', 'done');
    case 'partial':
      return tr('làm một phần', 'partly done');
    case 'frozen':
      return tr('đóng băng', 'frozen');
    case 'missed':
      return tr('bị lỡ', 'missed');
    case 'pending':
      return tr('chưa xong', 'not done yet');
    case 'open':
      return tr('chưa làm', 'not done');
    case 'not-due':
      return tr('không có lịch', 'not scheduled');
    case 'future':
      return tr('sắp tới', 'upcoming');
  }
}

/**
 * Month calendar (REQ-02-025). Status is shown by colour and also by an icon and the accessible
 * label, never by colour alone.
 */
export function MonthGrid({
  month,
  weekStart,
  today,
  statusOf,
  onMonth,
  onDay,
  dayLabel,
}: {
  month: string;
  weekStart: 0 | 1;
  today: DayKey;
  statusOf: (day: DayKey) => DayStatus;
  onMonth: (month: string) => void;
  onDay?: (day: DayKey) => void;
  dayLabel?: (day: DayKey) => string | null;
}) {
  const rows = monthGrid(month, weekStart);
  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);
  return (
    <div className="month">
      <div className="month__head">
        <button
          type="button"
          className="icon-btn"
          aria-label={tr('Tháng trước', 'Previous month')}
          onClick={() => onMonth(prev)}
        >
          <ChevronLeftIcon />
        </button>
        <h3 aria-live="polite">{formatMonth(month)}</h3>
        <button
          type="button"
          className="icon-btn"
          aria-label={tr('Tháng sau', 'Next month')}
          onClick={() => onMonth(next)}
        >
          <ChevronRightIcon />
        </button>
      </div>
      <div className="month__grid" role="grid" aria-label={formatMonth(month)}>
        <div className="month__row" role="row">
          {orderedWeekdays(weekStart).map((d) => (
            <span key={d} className="month__dow" role="columnheader">
              {weekdayShort(d, getLocale())}
            </span>
          ))}
        </div>
        {rows.map((row) => (
          <div className="month__row" role="row" key={row[0]}>
            {row.map((d) => {
              const inMonth = monthOf(d) === month;
              const status = statusOf(d);
              const extra = dayLabel?.(d);
              const label = `${formatDayLong(d)}: ${statusText(status)}${extra ? `, ${extra}` : ''}`;
              const content = (
                <>
                  <span className="cell__num">{Number(d.slice(8))}</span>
                  {status === 'done' && <CheckIcon size={12} />}
                  {status === 'frozen' && <SnowIcon size={12} />}
                </>
              );
              const cls = `cell cell--${status} ${inMonth ? '' : 'is-outside'} ${d === today ? 'is-today' : ''}`;
              return (
                <span role="gridcell" key={d} className="month__cell">
                  {onDay ? (
                    <button
                      type="button"
                      className={cls}
                      aria-label={label}
                      onClick={() => onDay(d)}
                    >
                      {content}
                    </button>
                  ) : (
                    <span className={cls} aria-label={label} role="img">
                      {content}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <ul className="legend" aria-label={tr('Chú thích', 'Legend')}>
        <li>
          <span className="cell cell--done legend__swatch">
            <CheckIcon size={10} />
          </span>
          {tr('Xong', 'Done')}
        </li>
        <li>
          <span className="cell cell--partial legend__swatch" />
          {tr('Một phần', 'Partly')}
        </li>
        <li>
          <span className="cell cell--frozen legend__swatch">
            <SnowIcon size={10} />
          </span>
          {tr('Đóng băng', 'Frozen')}
        </li>
        <li>
          <span className="cell cell--missed legend__swatch" />
          {tr('Bị lỡ', 'Missed')}
        </li>
      </ul>
    </div>
  );
}
