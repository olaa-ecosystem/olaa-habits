import { useState, type FormEvent } from 'react';
import { navigate } from '../../app/router';
import { HabitBadge } from '../../components/HabitBadge';
import { appStore, useAppState } from '../../stores/appStore';
import { addHabit, archiveHabit, updateHabit } from '../../stores/appState';
import type { DayKey, Weekday } from '../../utils/date';
import { MAX_TIMES_PER_WEEK, WEEKDAY_SHORT, type Schedule } from '../scheduling/schedule';
import {
  HABIT_COLORS,
  HABIT_ICONS,
  MAX_NAME_LENGTH,
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
        }
      : EMPTY,
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
      existing ? updateHabit(s, existing.id, draft) : addHabit(s, draft, today),
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

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn">
            {existing ? 'Lưu' : 'Tạo thói quen'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => window.history.back()}>
            Huỷ
          </button>
        </div>
      </form>

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
