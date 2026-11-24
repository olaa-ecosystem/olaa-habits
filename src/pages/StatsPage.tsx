/** Stats (modules 02.09–02.11): rates, weekly trend, heatmap, each habit, tips and badges. */
import { routeHref } from '../app/router';
import { Icon } from '../components/Icon';
import { Empty, useToday } from '../components/ui';
import { BADGE_IDS, BADGE_TEXT, type BadgeId } from '../features/gamification/badges';
import { insightsFor } from '../features/insights/insights';
import {
  completionRate,
  dailyRatios,
  overallRate,
  weeklyTotals,
} from '../features/statistics/stats';
import { streakOf, strengthOf } from '../features/streaks/streaks';
import { getLocale, tr } from '../i18n/locale';
import { useHabitState } from '../stores/habitStore';
import { addDays, fromDayKey, startOfWeek, type DayKey } from '../utils/date';
import { formatDayLong, percent } from '../utils/format';
import { HabitTile, streakLabel } from './parts';

const HEAT_WEEKS = 20;
const BADGE_BLOCK: Record<BadgeId, string> = {
  'first-check': 'yellow',
  'streak-7': 'peach',
  'streak-30': 'peach',
  'streak-100': 'ink',
  'first-freeze': 'lilac',
  'perfect-week': 'yellow',
  'auto-learner': 'green',
};

/** Completions per week as rounded bars; the current week is solid. */
export function WeekBars({ data }: { data: { week: DayKey; done: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.done));
  return (
    <figure style={{ margin: 0 }}>
      <div className="bars" aria-hidden="true">
        {data.map((d, i) => (
          <div key={d.week} className="bars__col" data-now={i === data.length - 1}>
            <span>{d.done || ''}</span>
            <i style={{ height: `${Math.max(4, Math.round((d.done / max) * 90))}px` }} />
            <span>
              {i % 2 === data.length % 2 || data.length <= 8
                ? `${fromDayKey(d.week).getDate()}/${fromDayKey(d.week).getMonth() + 1}`
                : ''}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="sr-only">
        {data
          .map((d) =>
            tr(`Tuần từ ${d.week}: ${d.done} lần`, `Week of ${d.week}: ${d.done} completions`),
          )
          .join('. ')}
      </figcaption>
    </figure>
  );
}

export function StatsPage() {
  const state = useHabitState();
  const today = useToday();
  const locale = getLocale();
  const habits = Object.values(state.habits)
    .filter((h) => h.archivedAt === null)
    .sort((a, b) => a.order - b.order);
  const r7 = overallRate(state, today, 7);
  const r30 = overallRate(state, today, 30);
  const ratios = dailyRatios(state, today, HEAT_WEEKS * 7);
  const firstWeek = addDays(startOfWeek(today, state.settings.weekStart), -7 * (HEAT_WEEKS - 1));
  const insights = insightsFor(state, today);

  return (
    <>
      <div className="page__head">
        <div>
          <h1>{tr('Thống kê', 'Stats')}</h1>
          <p>
            {tr(
              'Hôm nay chưa xong thì chưa bị tính là lỡ.',
              'An unfinished today never counts as a miss.',
            )}
          </p>
        </div>
      </div>

      <div className="grid grid--tiles" style={{ marginBottom: 14 }}>
        <div className="block block--peach">
          <p className="eyebrow" style={{ color: 'inherit' }}>
            {tr('7 ngày qua', 'Last 7 days')}
          </p>
          <span className="block__big">{percent(r7.ratio)}</span>
          <div className="block__foot">
            <span className="tag">{tr(`${r7.done}/${r7.due} lần`, `${r7.done} of ${r7.due}`)}</span>
          </div>
        </div>
        <div className="block block--yellow">
          <p className="eyebrow" style={{ color: 'inherit' }}>
            {tr('30 ngày qua', 'Last 30 days')}
          </p>
          <span className="block__big">{percent(r30.ratio)}</span>
          <div className="block__foot">
            <span className="tag">
              {tr(`${r30.done}/${r30.due} lần`, `${r30.done} of ${r30.due}`)}
            </span>
          </div>
        </div>
        <div className="block block--lilac">
          <p className="eyebrow" style={{ color: 'inherit' }}>
            {tr('Huy hiệu', 'Badges')}
          </p>
          <span className="block__big">
            {Object.keys(state.badges).length}/{BADGE_IDS.length}
          </span>
          <div className="block__foot">
            <span className="tag">{tr('giữ mãi khi đã đạt', 'yours to keep')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <section className="card">
            <h2>{tr('Số lần hoàn thành mỗi tuần', 'Completions per week')}</h2>
            <WeekBars data={weeklyTotals(state, today, 12)} />
          </section>
          <section className="card">
            <h2>
              {tr(`${HEAT_WEEKS} tuần gần đây`, `Last ${HEAT_WEEKS} weeks`)}
              <small>
                {fromDayKey(firstWeek).toLocaleDateString(locale === 'en' ? 'en-GB' : 'vi-VN')}
              </small>
            </h2>
            <div
              className="heat"
              role="img"
              aria-label={tr('Mức hoàn thành mỗi ngày', 'Daily completion')}
            >
              {Array.from({ length: HEAT_WEEKS }, (_, w) => (
                <div key={w} className="heat__col">
                  {Array.from({ length: 7 }, (_, d) => {
                    const day = addDays(firstWeek, w * 7 + d);
                    const r = ratios.get(day);
                    const l =
                      day > today || r === undefined
                        ? -1
                        : r === 0
                          ? 0
                          : r < 0.5
                            ? 1
                            : r < 1
                              ? 2
                              : 3;
                    return (
                      <i
                        key={d}
                        data-l={l}
                        title={
                          l < 0
                            ? undefined
                            : `${formatDayLong(day)}: ${Math.round((r ?? 0) * 100)}%`
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
          {insights.length > 0 && (
            <section className="card">
              <h2>
                <Icon name="sparkle" /> {tr('Gợi ý cho bạn', 'Suggestions')}
              </h2>
              <div className="list">
                {insights.map((i) => (
                  <p key={i.id} className="note-item small">
                    {locale === 'en' ? i.en : i.vi}
                  </p>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="stack">
          <section className="card">
            <h2>{tr('Từng thói quen', 'Each habit')}</h2>
            {habits.length === 0 ? (
              <Empty icon="progress" title={tr('Chưa có số liệu', 'No numbers yet')} />
            ) : (
              <div className="list">
                {habits.map((h) => {
                  const s = streakOf(state, h, today);
                  const strength = strengthOf(state, h, today);
                  return (
                    <a key={h.id} className="hrow" href={routeHref({ name: 'habit', id: h.id })}>
                      <HabitTile habit={h} size="sm" />
                      <span>
                        <b>{h.name}</b>
                        <small>
                          {tr('dài nhất', 'best')} {streakLabel(s.best, s.unit)} · 30d{' '}
                          {percent(completionRate(state, h, today, 30).ratio)}
                        </small>
                      </span>
                      <span className="nums">
                        <span style={{ color: 'var(--warm)', fontWeight: 650 }}>
                          {streakLabel(s.current, s.unit)}
                        </span>
                        <span
                          className="meter"
                          title={tr(`Độ bền ${percent(strength)}`, `Strength ${percent(strength)}`)}
                        >
                          <i style={{ width: `${strength * 100}%` }} />
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </section>
          <section className="card">
            <h2>
              <Icon name="achievement" /> {tr('Huy hiệu', 'Badges')}
            </h2>
            <div className="badge-grid">
              {BADGE_IDS.map((id) => {
                const earned = state.badges[id];
                const [title, desc] = BADGE_TEXT[id][locale];
                return (
                  <div
                    key={id}
                    className={`block block--${BADGE_BLOCK[id]}${earned ? '' : ' block--locked'}`}
                  >
                    <span className="medal">
                      <Icon name={earned ? 'achievement' : 'lock'} />
                    </span>
                    <h3 style={{ paddingRight: 0, fontSize: 15.5 }}>{title}</h3>
                    <p>{desc}</p>
                    <div className="block__foot">
                      <span className="tag">
                        {earned
                          ? new Date(earned.earnedAt).toLocaleDateString(
                              locale === 'en' ? 'en-GB' : 'vi-VN',
                            )
                          : tr('Chưa đạt', 'Not yet')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
