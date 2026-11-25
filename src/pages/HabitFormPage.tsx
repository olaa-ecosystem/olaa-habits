/** Create or edit a habit (modules 02.01 and 02.02). */
import { useState } from 'react';
import { navigate, routeHref } from '../app/router';
import { HabitGlyph, Icon } from '../components/Icon';
import { BackLink, Empty } from '../components/ui';
import { TEMPLATES } from '../features/habit-management/templates';
import {
  HABIT_COLORS,
  HABIT_ICONS,
  type Habit,
  type HabitSource,
  type Schedule,
  type TimeOfDay,
} from '../features/habit-management/types';
import { suggestReminder } from '../features/reminders/reminders';
import { orderedWeekdays, weekdayShort } from '../features/scheduling/schedule';
import { getLocale, tr } from '../i18n/locale';
import { normalizeNoteLink, TAKENOTE_URL } from '../integrations/olaaApps';
import { createHabit, NAME_MAX, updateHabit, type HabitInput } from '../stores/habitActions';
import { habitStore, useHabitState } from '../stores/habitStore';
import { today as todayKey, type Weekday } from '../utils/date';
import { HabitTile } from './parts';

const COLOR_NAMES: Record<string, [string, string]> = {
  blue: ['Xanh dương', 'Blue'],
  orange: ['Cam', 'Orange'],
  green: ['Xanh lá', 'Green'],
  red: ['Đỏ', 'Red'],
  gold: ['Vàng', 'Gold'],
  purple: ['Tím', 'Purple'],
  teal: ['Xanh ngọc', 'Teal'],
  pink: ['Hồng', 'Pink'],
};

function blank(): HabitInput {
  return {
    name: '',
    icon: 'star',
    color: 'orange',
    schedule: { kind: 'daily' },
    target: 1,
    unit: '',
    timeOfDay: 'any',
    source: { kind: 'manual' },
    reminder: null,
    noteLink: null,
    startDate: todayKey(),
    why: '',
  };
}

function fromHabit(h: Habit): HabitInput {
  const {
    name,
    icon,
    color,
    schedule,
    target,
    unit,
    timeOfDay,
    source,
    reminder,
    noteLink,
    startDate,
    why,
  } = h;
  return {
    name,
    icon,
    color,
    schedule,
    target,
    unit,
    timeOfDay,
    source,
    reminder,
    noteLink,
    startDate,
    why,
  };
}

function Choice<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          className="chip"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function HabitFormPage({ habitId }: { habitId: string | null }) {
  const state = useHabitState();
  const existing = habitId ? state.habits[habitId] : undefined;
  const [form, setForm] = useState<HabitInput>(() => (existing ? fromHabit(existing) : blank()));
  const [noteInput, setNoteInput] = useState(existing?.noteLink ?? '');
  const [error, setError] = useState<string | null>(null);
  const en = getLocale() === 'en';
  const ws = state.settings.weekStart;

  if (habitId && !existing)
    return (
      <>
        <BackLink to="#habits">{tr('Thói quen', 'Habits')}</BackLink>
        <section className="card">
          <Empty
            icon="habits"
            title={tr('Không tìm thấy thói quen này', 'This habit was not found')}
          />
        </section>
      </>
    );

  const set = <K extends keyof HabitInput>(key: K, value: HabitInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const suggestion = existing ? suggestReminder(state, existing) : null;

  const applyTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setForm({
      ...t.make(todayKey()),
      name: en ? t.name[1] : t.name[0],
      unit: t.unit ? (en ? t.unit[1] : t.unit[0]) : '',
      why: form.why,
    });
  };

  const setSource = (kind: HabitSource['kind']) =>
    setForm((f) => ({
      ...f,
      source: { kind } as HabitSource,
      target: kind === 'language.daily_goal' ? 1 : f.target,
      unit: kind === 'language.lessons' ? tr('bài', 'lessons') : kind === 'manual' ? f.unit : '',
      icon: kind === 'manual' ? f.icon : kind === 'language.lessons' ? 'book' : 'language',
    }));

  const submit = () => {
    if (!form.name.trim()) {
      setError(tr('Đặt tên cho thói quen nhé.', 'Give the habit a name.'));
      return;
    }
    let noteLink: string | null = null;
    if (noteInput.trim()) {
      noteLink = normalizeNoteLink(noteInput);
      if (!noteLink) {
        setError(
          tr(
            `Liên kết sổ tay phải là địa chỉ của Olaa Note (${TAKENOTE_URL}…).`,
            `The notebook link must be an Olaa Note address (${TAKENOTE_URL}…).`,
          ),
        );
        return;
      }
    }
    const input = { ...form, noteLink };
    if (existing) {
      habitStore.update((s) => updateHabit(s, existing.id, input, Date.now()));
      navigate({ name: 'habit', id: existing.id }, true);
    } else {
      let id = '';
      habitStore.update((s) => {
        const r = createHabit(s, input, Date.now());
        id = r.id;
        return r.state;
      });
      navigate({ name: 'habit', id }, true);
    }
  };

  const schedule = form.schedule;
  const days: Weekday[] = schedule.kind === 'weekdays' ? schedule.days : [1, 2, 3, 4, 5];
  const times = schedule.kind === 'perWeek' ? schedule.times : 3;

  return (
    <>
      <BackLink to={existing ? routeHref({ name: 'habit', id: existing.id }) : '#habits'}>
        {existing ? existing.name : tr('Thói quen', 'Habits')}
      </BackLink>
      <div className="page__head">
        <div>
          <h1>{existing ? tr('Sửa thói quen', 'Edit habit') : tr('Thói quen mới', 'New habit')}</h1>
        </div>
        <HabitTile habit={form} size="lg" />
      </div>

      {!existing && (
        <section className="card">
          <h2>{tr('Bắt đầu từ mẫu', 'Start from a template')}</h2>
          <div className="tpl">
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => applyTemplate(t.id)}>
                <HabitTile habit={t.make(todayKey())} size="sm" />
                {en ? t.name[1] : t.name[0]}
              </button>
            ))}
          </div>
        </section>
      )}

      <form
        className="card form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {error && (
          <p className="err" role="alert">
            {error}
          </p>
        )}
        <label className="field-label">
          {tr('Tên', 'Name')}
          <input
            className="input"
            value={form.name}
            maxLength={NAME_MAX}
            placeholder={tr('Ví dụ: Học 15 từ mới', 'e.g. Learn 15 new words')}
            onChange={(e) => set('name', e.target.value)}
          />
        </label>

        <label className="field-label">
          {tr(
            'Vì sao thói quen này quan trọng? (không bắt buộc)',
            'Why does this habit matter? (optional)',
          )}
          <input
            className="input"
            value={form.why}
            maxLength={200}
            placeholder={tr('Ví dụ: để đọc được sách tiếng Anh', 'e.g. to read books in English')}
            onChange={(e) => set('why', e.target.value)}
          />
        </label>

        <fieldset>
          <legend>{tr('Cách ghi nhận', 'How it is tracked')}</legend>
          <Choice
            label={tr('Cách ghi nhận', 'How it is tracked')}
            value={form.source.kind}
            onChange={setSource}
            options={[
              ['manual', tr('Tự đánh dấu', 'I tick it')],
              ['language.daily_goal', tr('Language: mục tiêu ngày', 'Language: daily goal')],
              ['language.lessons', tr('Language: số bài mới', 'Language: new lessons')],
            ]}
          />
          {form.source.kind !== 'manual' && (
            <p className="small muted">
              {tr(
                'Tự đánh dấu khi bạn học trong Olaa Language (đăng nhập cùng Olaa ID ở cả hai app). Không đánh dấu tay được.',
                'Ticks itself when you study in Olaa Language (same Olaa ID in both apps). Cannot be ticked by hand.',
              )}
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend>{tr('Biểu tượng', 'Icon')}</legend>
          <div className="picks">
            {HABIT_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={`pick hc--${form.color}`}
                aria-pressed={form.icon === ic}
                aria-label={ic}
                onClick={() => set('icon', ic)}
              >
                <HabitGlyph icon={ic} />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>{tr('Màu', 'Colour')}</legend>
          <div className="picks">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`pick hc--${c}`}
                aria-pressed={form.color === c}
                aria-label={COLOR_NAMES[c]?.[en ? 1 : 0] ?? c}
                onClick={() => set('color', c)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>{tr('Lặp lại', 'Repeat')}</legend>
          <Choice
            label={tr('Lặp lại', 'Repeat')}
            value={schedule.kind}
            onChange={(kind) =>
              set(
                'schedule',
                (kind === 'daily'
                  ? { kind }
                  : kind === 'weekdays'
                    ? { kind, days }
                    : { kind, times }) as Schedule,
              )
            }
            options={[
              ['daily', tr('Hằng ngày', 'Every day')],
              ['weekdays', tr('Chọn ngày', 'Pick days')],
              ['perWeek', tr('N lần mỗi tuần', 'N times a week')],
            ]}
          />
          {schedule.kind === 'weekdays' && (
            <div className="picks" role="group" aria-label={tr('Các ngày', 'Days')}>
              {orderedWeekdays(ws).map((d) => {
                const on = schedule.days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    className="pick dayname"
                    aria-pressed={on}
                    onClick={() =>
                      set('schedule', {
                        kind: 'weekdays',
                        days: on ? schedule.days.filter((x) => x !== d) : [...schedule.days, d],
                      })
                    }
                  >
                    {weekdayShort(d, getLocale())}
                  </button>
                );
              })}
            </div>
          )}
          {schedule.kind === 'perWeek' && (
            <div
              className="picks"
              role="radiogroup"
              aria-label={tr('Số lần mỗi tuần', 'Times a week')}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  className="pick dayname"
                  aria-checked={schedule.times === n}
                  onClick={() => set('schedule', { kind: 'perWeek', times: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        {form.source.kind !== 'language.daily_goal' && (
          <fieldset>
            <legend>{tr('Mục tiêu mỗi lần', 'Target each time')}</legend>
            <div className="row">
              <input
                className="input"
                style={{ width: 110 }}
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                aria-label={tr('Số lượng', 'Amount')}
                value={form.target}
                onChange={(e) => set('target', Number(e.target.value))}
              />
              <input
                className="input"
                style={{ flex: 1, minWidth: 140 }}
                aria-label={tr('Đơn vị', 'Unit')}
                value={form.unit}
                maxLength={16}
                disabled={form.target <= 1 || form.source.kind === 'language.lessons'}
                placeholder={tr('ly, trang, phút…', 'glasses, pages, minutes…')}
                onChange={(e) => set('unit', e.target.value)}
              />
            </div>
            <p className="small muted">
              {tr(
                'Để 1 nếu chỉ cần làm hay không làm.',
                'Leave at 1 for a simple done / not done habit.',
              )}
            </p>
          </fieldset>
        )}

        <fieldset>
          <legend>{tr('Thời điểm trong ngày', 'Time of day')}</legend>
          <Choice<TimeOfDay>
            label={tr('Thời điểm trong ngày', 'Time of day')}
            value={form.timeOfDay}
            onChange={(v) => set('timeOfDay', v)}
            options={[
              ['any', tr('Cả ngày', 'Any time')],
              ['morning', tr('Sáng', 'Morning')],
              ['afternoon', tr('Chiều', 'Afternoon')],
              ['evening', tr('Tối', 'Evening')],
            ]}
          />
        </fieldset>

        <fieldset>
          <legend>{tr('Nhắc nhở', 'Reminder')}</legend>
          <div className="row">
            <label className="switch">
              <input
                type="checkbox"
                checked={form.reminder !== null}
                onChange={(e) => set('reminder', e.target.checked ? (suggestion ?? '20:00') : null)}
              />
              {tr('Nhắc tôi lúc', 'Remind me at')}
            </label>
            <input
              className="input"
              type="time"
              aria-label={tr('Giờ nhắc', 'Reminder time')}
              value={form.reminder ?? ''}
              disabled={form.reminder === null}
              onChange={(e) => set('reminder', e.target.value || null)}
            />
          </div>
          {suggestion && suggestion !== form.reminder && (
            <button
              type="button"
              className="btn btn--text btn--sm"
              style={{ justifySelf: 'start', paddingLeft: 0 }}
              onClick={() => set('reminder', suggestion)}
            >
              <Icon name="sparkle" />{' '}
              {tr(
                `Gợi ý ${suggestion}, trước giờ bạn hay làm`,
                `Suggested ${suggestion}, before your usual time`,
              )}
            </button>
          )}
          <p className="small muted">
            {tr(
              'Không nhắc nếu hôm đó đã xong. Bật thông báo ở Hồ sơ.',
              'No reminder when already done that day. Turn notifications on in Me.',
            )}
          </p>
        </fieldset>

        <label className="field-label">
          {tr('Sổ tay Olaa Note (không bắt buộc)', 'Olaa Note notebook (optional)')}
          <input
            className="input"
            type="url"
            inputMode="url"
            value={noteInput}
            placeholder={`${TAKENOTE_URL}#/nb/…`}
            onChange={(e) => setNoteInput(e.target.value)}
          />
          <span className="small muted" style={{ fontWeight: 400 }}>
            {tr(
              'Mở sổ tay trong Olaa Note, chép địa chỉ trên trình duyệt rồi dán vào đây.',
              'Open the notebook in Olaa Note, copy the address from the browser and paste it here.',
            )}
          </span>
        </label>

        <label className="field-label" style={{ maxWidth: 240 }}>
          {tr('Bắt đầu từ ngày', 'Starts on')}
          <input
            className="input"
            type="date"
            value={form.startDate}
            onChange={(e) => e.target.value && set('startDate', e.target.value)}
          />
        </label>

        <div className="row">
          <button type="submit" className="btn">
            {existing ? tr('Lưu', 'Save') : tr('Tạo thói quen', 'Create habit')}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => history.back()}>
            {tr('Huỷ', 'Cancel')}
          </button>
        </div>
      </form>
    </>
  );
}
