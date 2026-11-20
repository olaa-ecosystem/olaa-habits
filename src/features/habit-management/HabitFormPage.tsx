import { useState, type FormEvent } from 'react';
import { navigate } from '../../app/router';
import { HabitBadge } from '../../components/HabitBadge';
import { appStore, useAppState } from '../../stores/appStore';
import { addHabit, archiveHabit, setPaused, updateHabit } from '../../stores/appState';
import type { DayKey, Weekday } from '../../utils/date';
import { MAX_TIMES_PER_WEEK, weekdayShort, type Schedule } from '../scheduling/schedule';
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
import { tr } from '../../i18n/locale';

const colorName = (c: HabitColor): string =>
  ({
    blue: tr('Xanh dương', 'Blue'),
    orange: tr('Cam', 'Orange'),
    green: tr('Xanh lá', 'Green'),
    red: tr('Đỏ', 'Red'),
    gold: tr('Vàng', 'Yellow'),
    purple: tr('Tím', 'Purple'),
    teal: tr('Xanh ngọc', 'Teal'),
    pink: tr('Hồng', 'Pink'),
  })[c];

const KINDS: HabitKind[] = ['binary', 'quantity', 'duration'];
const kindLabel = (k: HabitKind): string =>
  ({
    binary: tr('Đánh dấu xong', 'Done / not done'),
    quantity: tr('Số lượng', 'Amount'),
    duration: tr('Thời lượng', 'Time'),
  })[k];

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
          <p>{tr('Không tìm thấy thói quen này.', 'This habit was not found.')}</p>
          <button type="button" className="btn" onClick={() => navigate({ name: 'habits' })}>
            {tr('Về danh sách', 'Back to habits')}
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
        ? tr('Chọn ít nhất một ngày trong tuần.', 'Pick at least one day of the week.')
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
        <h1>{existing ? tr('Sửa thói quen', 'Edit habit') : tr('Thói quen mới', 'New habit')}</h1>
        <HabitBadge habit={draft} size={52} />
      </header>

      <form className="card stack habit-form" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>{tr('Tên thói quen', 'Habit name')}</span>
          <input
            value={draft.name}
            maxLength={MAX_NAME_LENGTH}
            placeholder={tr('Ví dụ: Học từ vựng 10 phút', 'e.g. Learn vocabulary for 10 minutes')}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            autoFocus={!existing}
          />
        </label>

        <label className="field">
          <span>{tr('Mô tả (không bắt buộc)', 'Description (optional)')}</span>
          <input
            value={draft.description ?? ''}
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder={tr(
              'Vì sao thói quen này quan trọng với bạn',
              'Why this habit matters to you',
            )}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </label>

        {!draft.source && (
          <fieldset>
            <legend>{tr('Cách đo', 'How to measure')}</legend>
            {existing ? (
              <p className="muted small">
                {kindLabel(kindOf(existing))}.{' '}
                {tr(
                  'Không đổi được sau khi tạo, để giữ nguyên lịch sử.',
                  'This can’t change after creation, so your history stays intact.',
                )}
              </p>
            ) : (
              <div className="segmented" role="group">
                {KINDS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={kindOf(draft) === k ? 'is-selected' : ''}
                    aria-pressed={kindOf(draft) === k}
                    onClick={() => setDraft({ ...draft, kind: k })}
                  >
                    {kindLabel(k)}
                  </button>
                ))}
              </div>
            )}
            {kindOf(draft) !== 'binary' && (
              <div className="row-options__line">
                <label className="field field--inline">
                  <span>{tr('Mục tiêu mỗi lần', 'Target each time')}</span>
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
                    <span>{tr('Đơn vị', 'Unit')}</span>
                    <input
                      value={draft.unit ?? ''}
                      maxLength={MAX_UNIT_LENGTH}
                      placeholder={tr('ly, trang, từ', 'glasses, pages, words')}
                      onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                    />
                  </label>
                ) : (
                  <span className="muted">{tr('phút', 'min')}</span>
                )}
              </div>
            )}
          </fieldset>
        )}

        <fieldset>
          <legend>{tr('Biểu tượng', 'Icon')}</legend>
          <div className="picker">
            {HABIT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`picker__item ${draft.icon === icon ? 'is-selected' : ''}`}
                aria-pressed={draft.icon === icon}
                aria-label={tr(`Biểu tượng ${icon}`, `Icon ${icon}`)}
                onClick={() => setDraft({ ...draft, icon })}
              >
                {icon}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>{tr('Màu', 'Colour')}</legend>
          <div className="picker">
            {HABIT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`picker__item picker__swatch habit-color--${color} ${draft.color === color ? 'is-selected' : ''}`}
                aria-pressed={draft.color === color}
                aria-label={colorName(color)}
                onClick={() => setDraft({ ...draft, color })}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>{tr('Lặp lại', 'Repeat')}</legend>
          <div className="segmented" role="group">
            {(
              [
                ['daily', tr('Mỗi ngày', 'Every day')],
                ['weekdays', tr('Chọn ngày', 'Pick days')],
                ['perWeek', tr('Số lần mỗi tuần', 'Times a week')],
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
              {weekdayShort().map((label, i) => (
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
                aria-label={tr('Bớt một lần', 'One fewer')}
                onClick={() => changeTimes(times - 1)}
                disabled={times <= 1}
              >
                −
              </button>
              <span aria-live="polite">
                <strong>{times}</strong> {tr('lần mỗi tuần', 'times a week')}
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label={tr('Thêm một lần', 'One more')}
                onClick={() => changeTimes(times + 1)}
                disabled={times >= MAX_TIMES_PER_WEEK}
              >
                +
              </button>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend>{tr('Cách ghi nhận', 'How it’s recorded')}</legend>
          {existing ? (
            <p className="muted small">
              {draft.source ? describeSource(draft.source) : tr('Tự đánh dấu', 'You check it off')}.{' '}
              {tr(
                'Không đổi được sau khi tạo, để giữ nguyên lịch sử.',
                'This can’t change after creation, so your history stays intact.',
              )}
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
                  {tr('Tự đánh dấu', 'I check it off')}
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
                  {tr('Tự động từ Olaa Language', 'Automatic from Olaa Language')}
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
                    {tr('Đạt mục tiêu ngày', 'Reach the daily goal')}
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
                    {tr('Hoàn thành', 'Finish')}
                    <select
                      className="number-input"
                      value={lessonCount}
                      aria-label={tr('Số bài mới mỗi ngày', 'New lessons per day')}
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
                    {tr('bài mới trong ngày', 'new lessons in a day')}
                  </label>
                  <p className="muted small">
                    {tr(
                      'Cần đăng nhập cùng một tài khoản Olaa ở cả hai app.',
                      'Sign in with the same Olaa account in both apps.',
                    )}
                  </p>
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
            {existing ? tr('Lưu', 'Save') : tr('Tạo thói quen', 'Create habit')}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate({ name: existing ? 'habits' : 'today' })}
          >
            {tr('Huỷ', 'Cancel')}
          </button>
        </div>
      </form>

      {existing && (
        <p className="muted small">
          {tr(
            'Đổi lịch lặp hoặc mục tiêu chỉ áp dụng từ hôm nay; những ngày trước vẫn được tính theo kế hoạch cũ.',
            'Changes to the schedule or target apply from today; earlier days keep the old plan.',
          )}
        </p>
      )}

      {existing && !existing.archivedOn && (
        <div className="card stack">
          <p className="muted small">
            {tr(
              'Tạm dừng khi đi xa, ốm hoặc cần nghỉ. Ngày tạm dừng không tính vào tỷ lệ nhất quán và không làm đứt chuỗi.',
              'Pause when travelling, ill or taking a break. Paused days don’t count against consistency and don’t break the streak.',
            )}
          </p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              appStore.update((s) => setPaused(s, existing.id, !isPausedNow(existing), today))
            }
          >
            {isPausedNow(existing)
              ? tr('Tiếp tục thói quen', 'Resume habit')
              : tr('Tạm dừng thói quen', 'Pause habit')}
          </button>
        </div>
      )}

      {existing && (
        <div className="card stack">
          <p className="muted small">
            {tr(
              'Lưu trữ để ẩn thói quen. Lịch sử và chuỗi vẫn được giữ, có thể khôi phục.',
              'Archive to hide the habit. History and streaks are kept, and you can restore it.',
            )}
          </p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              appStore.update((s) => archiveHabit(s, existing.id, today));
              navigate({ name: 'habits' });
            }}
          >
            {tr('Lưu trữ thói quen', 'Archive habit')}
          </button>
        </div>
      )}
    </div>
  );
}
