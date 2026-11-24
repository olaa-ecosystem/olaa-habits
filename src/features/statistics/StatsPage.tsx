import { routeHref } from '../../app/router';
import { FlameIcon, HabitGlyph } from '../../components/Icons';
import { getLocale, tr } from '../../i18n/locale';
import { useHabitState } from '../../stores/habitStore';
import { addDays, fromDayKey, startOfWeek, today as todayKey } from '../../utils/date';
import { formatDayLong, percent } from '../../utils/format';
import { BADGE_IDS, BADGE_TEXT } from '../gamification/badges';
import { streakLabel } from '../habit-tracking/HabitRow';
import { insightsFor } from '../insights/insights';
import { streakOf, strengthOf } from '../streaks/streaks';
import { completionRate, dailyRatios, overallRate, weeklyTotals } from './stats';
import { WeekBars } from './WeekBars';

const HEAT_WEEKS = 20;

/** Overview: rates, weekly trend, heatmap, per-habit table, badges (modules 02.09–02.11). */
export function StatsPage() {
  const state = useHabitState();
  const today = todayKey();
  const locale = getLocale();
  const habits = Object.values(state.habits)
    .filter((h) => h.archivedAt === null)
    .sort((a, b) => a.order - b.order);
  const r7 = overallRate(state, today, 7);
  const r30 = overallRate(state, today, 30);
  const totalDone = Object.values(state.checkIns).filter((c) => {
    const h = state.habits[c.habitId];
    return h && c.value >= h.target;
  }).length;
  const insights = insightsFor(state, today);

  // Heatmap: columns are weeks, rows weekdays.
  const ratios = dailyRatios(state, today, HEAT_WEEKS * 7);
  const firstWeek = addDays(startOfWeek(today, state.settings.weekStart), -7 * (HEAT_WEEKS - 1));

  return (
    <div className="page">
      <header className="page__head">
        <h1>{tr('Thống kê', 'Stats')}</h1>
      </header>

      <section className="stat-tiles">
        <div className="card stat-tile">
          <span className="stat">{percent(r7.ratio)}</span>
          <span className="muted small">{tr('7 ngày qua', 'Last 7 days')}</span>
        </div>
        <div className="card stat-tile">
          <span className="stat">{percent(r30.ratio)}</span>
          <span className="muted small">{tr('30 ngày qua', 'Last 30 days')}</span>
        </div>
        <div className="card stat-tile">
          <span className="stat stat--xp">{totalDone}</span>
          <span className="muted small">{tr('Lần tự đánh dấu xong', 'Manual completions')}</span>
        </div>
        <div className="card stat-tile">
          <span className="stat">
            {Object.keys(state.badges).length}/{BADGE_IDS.length}
          </span>
          <span className="muted small">{tr('Huy hiệu', 'Badges')}</span>
        </div>
      </section>

      {insights.length > 0 && (
        <section className="card stack">
          <h2 className="card-title">{tr('Gợi ý cho bạn', 'Suggestions')}</h2>
          <ul className="insight-list">
            {insights.map((i) => (
              <li key={i.id}>{locale === 'en' ? i.en : i.vi}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card stack">
        <h2 className="card-title">{tr('Số lần hoàn thành mỗi tuần', 'Completions per week')}</h2>
        <WeekBars data={weeklyTotals(state, today, 12)} />
      </section>

      <section className="card stack">
        <h2 className="card-title">
          {tr(`${HEAT_WEEKS} tuần gần đây`, `Last ${HEAT_WEEKS} weeks`)}
        </h2>
        <div
          className="heatmap"
          role="img"
          aria-label={tr('Bản đồ nhiệt mức hoàn thành mỗi ngày', 'Heatmap of daily completion')}
        >
          {Array.from({ length: HEAT_WEEKS }, (_, w) => (
            <div className="heatmap__col" key={w}>
              {Array.from({ length: 7 }, (_, d) => {
                const day = addDays(firstWeek, w * 7 + d);
                const r = ratios.get(day);
                const level =
                  day > today || r === undefined ? -1 : r === 0 ? 0 : r < 0.5 ? 1 : r < 1 ? 2 : 3;
                return (
                  <span
                    key={d}
                    className={`heatmap__cell lvl-${level}`}
                    title={
                      level < 0
                        ? undefined
                        : `${formatDayLong(day)}: ${Math.round((r ?? 0) * 100)}%`
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
        <p className="muted small">
          {tr('Từ', 'From')}{' '}
          {fromDayKey(firstWeek).toLocaleDateString(locale === 'en' ? 'en-GB' : 'vi-VN')}
        </p>
      </section>

      <section className="card stack">
        <h2 className="card-title">{tr('Từng thói quen', 'Each habit')}</h2>
        {habits.length === 0 ? (
          <p className="muted">{tr('Chưa có thói quen nào.', 'No habits yet.')}</p>
        ) : (
          <div className="table-wrap">
            <table className="habit-table">
              <thead>
                <tr>
                  <th scope="col">{tr('Thói quen', 'Habit')}</th>
                  <th scope="col">{tr('Chuỗi', 'Streak')}</th>
                  <th scope="col">{tr('Dài nhất', 'Best')}</th>
                  <th scope="col">{tr('Độ bền', 'Strength')}</th>
                  <th scope="col">30d</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => {
                  const s = streakOf(state, h, today);
                  return (
                    <tr key={h.id}>
                      <th scope="row">
                        <a
                          href={routeHref({ name: 'habit', id: h.id })}
                          className={`table-habit hb-color--${h.color}`}
                        >
                          <HabitGlyph icon={h.icon} size={18} /> {h.name}
                        </a>
                      </th>
                      <td>
                        <span className="stat stat--streak">
                          <FlameIcon size={14} /> {streakLabel(s.current, s.unit)}
                        </span>
                      </td>
                      <td>{streakLabel(s.best, s.unit)}</td>
                      <td>
                        <span className="meter" aria-label={percent(strengthOf(state, h, today))}>
                          <span style={{ width: `${strengthOf(state, h, today) * 100}%` }} />
                        </span>
                      </td>
                      <td>{percent(completionRate(state, h, today, 30).ratio)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card stack">
        <h2 className="card-title">{tr('Huy hiệu', 'Badges')}</h2>
        <ul className="badges">
          {BADGE_IDS.map((id) => {
            const earned = state.badges[id];
            const [title, desc] = BADGE_TEXT[id][locale];
            return (
              <li key={id} className={`badge ${earned ? 'is-earned' : ''}`}>
                <span className="badge__medal" aria-hidden>
                  ★
                </span>
                <span className="badge__text">
                  <strong>{title}</strong>
                  <span className="muted small">{desc}</span>
                  <span className="small">
                    {earned
                      ? tr(
                          `Đạt ngày ${new Date(earned.earnedAt).toLocaleDateString('vi-VN')}`,
                          `Earned ${new Date(earned.earnedAt).toLocaleDateString('en-GB')}`,
                        )
                      : tr('Chưa đạt', 'Not yet')}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
