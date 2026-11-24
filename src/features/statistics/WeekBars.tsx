import { tr } from '../../i18n/locale';
import { fromDayKey, type DayKey } from '../../utils/date';

/** Completions per week as rounded bars, with the numbers in text for screen readers. */
export function WeekBars({ data }: { data: { week: DayKey; done: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.done));
  return (
    <figure className="bars">
      <div className="bars__plot" aria-hidden>
        {data.map((d, i) => (
          <div key={d.week} className={`bars__col ${i === data.length - 1 ? 'is-current' : ''}`}>
            <span className="bars__value">{d.done || ''}</span>
            <span className="bars__bar" style={{ height: `${(d.done / max) * 100}%` }} />
            <span className="bars__label">
              {fromDayKey(d.week).getDate()}/{fromDayKey(d.week).getMonth() + 1}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="visually-hidden">
        {data
          .map((d) =>
            tr(`Tuần từ ${d.week}: ${d.done} lần`, `Week of ${d.week}: ${d.done} completions`),
          )
          .join('. ')}
      </figcaption>
    </figure>
  );
}
