import { useState, type FormEvent } from 'react';
import { navigate } from '../../app/router';
import { HabitBadge } from '../../components/HabitBadge';
import { appStore, useAppState } from '../../stores/appStore';
import { addHabit, archiveHabit, setPaused, updateHabit } from '../../stores/appState';
import type { DayKey, Weekday } from '../../utils/date';
import { MAX_TIMES_PER_WEEK, WEEKDAY_SHORT, type Schedule } from '../scheduling/schedule';
import {
  HABIT_COLORS,
  HABIT_ICONS,
  isPausedNow,
  kindOf,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_UNIT_LENGTH,
  type HabitKind,
  MAX_NEW_LESSONS,
  describeSource,
  validateDraft,
  type HabitColor,
  type HabitDraft,
} from './types';

const COLOR_NAMES: Record<HabitColor, string> = {
  blue: 'Xanh dương',
  orange: 'Cam',
  green: 'Xanh lá',
  red: 'Đỏ',
  gold: 'Vàng',
  purple: 'Tím',
  teal: 'Xanh ngọc',
  pink: 'Hồng',
};

const KIND_LABELS: Record<HabitKind, string> = {
  binary: 'Đánh dấu xong',
  quantity: 'Số lượng',
  duration: 'Thời lượng',
};

const EMPTY: HabitDraft = { name: '', icon: '📚', color: 'blue', schedule: { kind: 'daily' } };

/** Create or edit a habit (REQ-02-001, REQ-02-002). */
export function HabitFormPage({ today, habitId }: { today: DayKey; habitId?: string }) {
  const state = useAppState();
  const existing = habitId ? state.habits[habitId] : undefined;
  const [draft, setDraft] = useState<HabitDraft>(() =>
    existing
      ? {
          name: existing.name,
          icon: existing.icon,
          color: existing.color,
          schedule: existing.schedule,
          source: existing.source ?? null,
          kind: kindOf(existing),
          target: existing.target,
          unit: existing.unit,
          description: existing.description,
        }
      : EMPTY,
  );
  const [targetText, setTargetText] = useState(draft.target ? String(draft.target) : '');
  const [lessonCount, setLessonCount] = useState(
    draft.source?.kind === 'language.new_lessons' ? draft.source.count : 1,
  );
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<Weekday[]>(
    draft.schedule.kind === 'weekdays' ? draft.schedule.days : [0, 1, 2, 3, 4],
  );
  const [times, setTimes] = useState(draft.schedule.kind === 'perWeek' ? draft.schedule.times : 3);

  if (habitId && !existing) {
    return (
      <div className="page">
        <div className="card empty">
          <p>Không tìm thấy thói quen này.</p>
          <button type="button" className="btn" onClick={() => navigate({ name: 'habits' })}>
            Về danh sách
          </button>
        </div>
      </div>
    );
  }

  const setSchedule = (kind: Schedule['kind']) =>
    setDraft({
      ...draft,
      schedule:
        kind === 'daily' ? { kind } : kind === 'weekdays' ? { kind, days } : { kind, times },
    });

  const toggleDay = (d: Weekday) => {
    const next = days.includes(d)
      ? days.filter((x) => x !== d)
      : [...days, d].sort((a, b) => a - b);
    setDays(next);
    setDraft({ ...draft, schedule: { kind: 'weekdays', days: next } });
  };

  const changeTimes = (value: number) => {
    const next = Math.min(MAX_TIMES_PER_WEEK, Math.max(1, value));
    setTimes(next);
    setDraft({ ...draft, schedule: { kind: 'perWeek', times: next } });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const problem =
      validateDraft(draft) ??
      (draft.schedule.kind === 'weekdays' && draft.schedule.days.length === 0
        ? 'Chọn ít nhất một ngày trong tuần.'
        : null);
    if (problem) {
      setError(problem);
      return;
    }
    appStore.update((s) =>
      existing ? updateHabit(s, existing.id, draft, today) : addHabit(s, draft, today),
    );
    navigate({ name: existing ? 'habits' : 'today' });
  };

  return (
    <div className="page">
      <header className="page__head">
        <h1>{existing ? 'Sửa thói quen' : 'Thói quen mới'}</h1>
        <HabitBadge habit={draft} size={52} />
      </header>

      <form className="card stack habit-form" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Tên thói quen</span>
          <input
            value={draft.name}
            maxLength={MAX_NAME_LENGTH}
            placeholder="Ví dụ: Học từ vựng 10 phút"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            autoFocus={!existing}
          />
        </label>

        <label className="field">
          <span>Mô tả (không bắt buộc)</span>
          <input
            value={draft.description ?? ''}
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder="Vì sao thói quen này quan trọng với bạn"
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </label>

        {!draft.source && (
          <fieldset>
            <legend>Cách đo</legend>
            {existing ? (
              <p className="muted small">
                {KIND_LABELS[kindOf(existing)]}. Không đổi được sau khi tạo, để giữ nguyên lịch sử.
              </p>
            ) : (
              <div className="segmented" role="group">
                {(Object.keys(KIND_LABELS) as HabitKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={kindOf(draft) === k ? 'is-selected' : ''}
                    aria-pressed={kindOf(draft) === k}
                    onClick={() => setDraft({ ...draft, kind: k })}
                  >
                    {KIND_LABELS[k]}
                  </button>
                ))}
              </div>
            )}
            {kindOf(draft) !== 'binary' && (
              <div className="row-options__line">
                <label className="field field--inline">
                  <span>Mục tiêu mỗi lần</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={targetText}
                    onChange={(e) => {
                      setTargetText(e.target.value);
                      setDraft({ ...draft, target: Number(e.target.value) || undefined });
                    }}
                  />
                </label>
                {kindOf(draft) === 'quantity' ? (
                  <label className="field field--inline">
                    <span>Đơn vị</span>
                    <input
                      value={draft.unit ?? ''}
                      maxLength={MAX_UNIT_LENGTH}
                      placeholder="ly, trang, từ"
                      onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                    />
                  </label>
                ) : (
                  <span className="muted">phút</span>
                )}
              </div>
            )}
          </fieldset>
        )}

        <fieldset>
          <legend>Biểu tượng</legend>
          <div className="picker">
            {HABIT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`picker__item ${draft.icon === icon ? 'is-selected' : ''}`}
                aria-pressed={draft.icon === icon}
                aria-label={`Biểu tượng ${icon}`}
                onClick={() => setDraft({ ...draft, icon })}
              >
                {icon}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Màu</legend>
          <div className="picker">
            {HABIT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`picker__item picker__swatch habit-color--${color} ${draft.color === color ? 'is-selected' : ''}`}
                aria-pressed={draft.color === color}
                aria-label={COLOR_NAMES[color]}
                onClick={() => setDraft({ ...draft, color })}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Lặp lại</legend>
          <div className="segmented" role="group">
            {(
              [
                ['daily', 'Mỗi ngày'],
                ['weekdays', 'Chọn ngày'],
                ['perWeek', 'Số lần mỗi tuần'],
              ] as const
            ).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                className={draft.schedule.kind === kind ? 'is-selected' : ''}
                aria-pressed={draft.schedule.kind === kind}
                onClick={() => setSchedule(kind)}
              >
                {label}
              </button>
            ))}
          </div>
          {draft.schedule.kind === 'weekdays' && (
            <div className="chip-row">
              {WEEKDAY_SHORT.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={`chip ${days.includes(i as Weekday) ? 'is-selected' : ''}`}
                  aria-pressed={days.includes(i as Weekday)}
                  onClick={() => toggleDay(i as Weekday)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {draft.schedule.kind === 'perWeek' && (
            <div className="stepper">
              <button
                type="button"
                className="icon-btn"
                aria-label="Bớt một lần"
                onClick={() => changeTimes(times - 1)}
                disabled={times <= 1}
              >
                −
              </button>
              <span aria-live="polite">
                <strong>{times}</strong> lần mỗi tuần
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label="Thêm một lần"
                onClick={() => changeTimes(times + 1)}
                disabled={times >= MAX_TIMES_PER_WEEK}
              >
                +
              </button>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend>Cách ghi nhận</legend>
          {existing ? (
            <p className="muted small">
              {draft.source ? describeSource(draft.source) : 'Tự đánh dấu'}. Không đổi được sau khi
              tạo, để giữ nguyên lịch sử.
            </p>
          ) : (
            <>
              <div className="segmented segmented--two" role="group">
                <button
                  type="button"
                  className={!draft.source ? 'is-selected' : ''}
                  aria-pressed={!draft.source}
                  onClick={() => setDraft({ ...draft, source: null })}
                >
                  Tự đánh dấu
                </button>
                <button
                  type="button"
                  className={draft.source ? 'is-selected' : ''}
                  aria-pressed={Boolean(draft.source)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      kind: 'binary',
                      source: draft.source ?? { kind: 'language.daily_goal' },
                    })
                  }
                >
                  Tự động từ Olaa Language
                </button>
              </div>
              {draft.source && (
                <div className="stack">
                  <label className="radio">
                    <input
                      type="radio"
                      name="source"
                      checked={draft.source.kind === 'language.daily_goal'}
                      onChange={() =>
                        setDraft({ ...draft, source: { kind: 'language.daily_goal' } })
                      }
                    />
                    Đạt mục tiêu ngày
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      name="source"
                      checked={draft.source.kind === 'language.new_lessons'}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          source: { kind: 'language.new_lessons', count: lessonCount },
                        })
                      }
                    />
                    Hoàn thành
                    <select
                      className="number-input"
                      value={lessonCount}
                      aria-label="Số bài mới mỗi ngày"
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setLessonCount(n);
                        setDraft({ ...draft, source: { kind: 'language.new_lessons', count: n } });
                      }}
                    >
                      {Array.from({ length: MAX_NEW_LESSONS }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    bài mới trong ngày
                  </label>
                  <p className="muted small">Cần đăng nhập cùng một tài khoản Olaa ở cả hai app.</p>
                </div>
              )}
            </>
          )}
        </fieldset>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn">
            {existing ? 'Lưu' : 'Tạo thói quen'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate({ name: existing ? 'habits' : 'today' })}
          >
            Huỷ
          </button>
        </div>
      </form>

      {existing && (
        <p className="muted small">
          Đổi lịch lặp hoặc mục tiêu chỉ áp dụng từ hôm nay; những ngày trước vẫn được tính theo kế
          hoạch cũ.
        </p>
      )}

      {existing && !existing.archivedOn && (
        <div className="card stack">
          <p className="muted small">
            Tạm dừng khi đi xa, ốm hoặc cần nghỉ. Ngày tạm dừng không tính vào tỷ lệ nhất quán và
            không làm đứt chuỗi.
          </p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              appStore.update((s) => setPaused(s, existing.id, !isPausedNow(existing), today))
            }
          >
            {isPausedNow(existing) ? 'Tiếp tục thói quen' : 'Tạm dừng thói quen'}
          </button>
        </div>
      )}

      {existing && (
        <div className="card stack">
          <p className="muted small">
            Lưu trữ để ẩn thói quen. Lịch sử và chuỗi vẫn được giữ, có thể khôi phục.
          </p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              appStore.update((s) => archiveHabit(s, existing.id, today));
              navigate({ name: 'habits' });
            }}
          >
            Lưu trữ thói quen
          </button>
        </div>
      )}
    </div>
  );
}
