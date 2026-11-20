import { useState } from 'react';
import { HabitBadge } from '../../components/HabitBadge';
import { CheckIcon } from '../../components/Icons';
import { firebaseEnabled } from '../../services/firebase';
import { appStore } from '../../stores/appStore';
import { completeOnboarding } from '../../stores/appState';
import type { DayKey } from '../../utils/date';
import { AccountCard } from '../account/AccountCard';
import { HABIT_TEMPLATES } from '../habit-management/templates';
import { LocalePicker } from '../../i18n/LocalePicker';
import { describeSchedule } from '../scheduling/schedule';
import { describeTarget } from '../habit-management/types';
import { tr } from '../../i18n/locale';

/** First run: pick starter habits (learning first) or sign in to an existing account. */
export function WelcomePage({ today }: { today: DayKey }) {
  const [step, setStep] = useState<'hello' | 'pick'>('hello');
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>(['language']);

  const finish = () => {
    const drafts = HABIT_TEMPLATES.filter((t) => picked.includes(t.id)).map(
      ({ name, icon, color, schedule, source, kind, target, unit }) => ({
        name,
        icon,
        color,
        schedule,
        source,
        kind,
        target,
        unit,
      }),
    );
    appStore.update((s) => completeOnboarding(s, { name, drafts }, today));
  };

  if (step === 'hello') {
    return (
      <div className="welcome">
        <section className="welcome__panel">
          <div className="welcome__mark" aria-hidden>
            <CheckIcon size={44} />
          </div>
          <h1>
            {tr('Giữ thói quen học tập ', 'Keep your study habits ')}
            <span className="brand">{tr('mỗi ngày', 'every day')}</span>
          </h1>
          <p>
            {tr(
              'Đặt thói quen nhỏ, đánh dấu trong một chạm, và giữ chuỗi kể cả những ngày bận.',
              'Set small habits, check them off in one tap, and keep your streak even on busy days.',
            )}
          </p>
          <LocalePicker />
          <button
            type="button"
            className="btn btn--block"
            onClick={() => setStep('pick')}
            autoFocus
          >
            {tr('Bắt đầu', 'Get started')}
          </button>
          {firebaseEnabled && (
            <AccountCard
              intro={tr(
                'Đã dùng Olaa Habits? Đăng nhập để tiếp tục.',
                'Already using Olaa Habits? Sign in to continue.',
              )}
            />
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="welcome">
      <section className="welcome__panel">
        <h1>{tr('Bắt đầu với vài thói quen', 'Start with a few habits')}</h1>
        <p>
          {tr(
            'Chọn những thói quen muốn theo dõi. Bạn có thể sửa hoặc thêm sau.',
            'Pick the habits you want to track. You can edit or add more later.',
          )}
        </p>
        <label className="field">
          <span>{tr('Tên của bạn (không bắt buộc)', 'Your name (optional)')}</span>
          <input
            value={name}
            maxLength={40}
            placeholder={tr('Tên của bạn', 'Your name')}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <ul className="template-list">
          {HABIT_TEMPLATES.map((t) => {
            const on = picked.includes(t.id);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  className={`template ${on ? 'is-selected' : ''}`}
                  aria-pressed={on}
                  onClick={() =>
                    setPicked(on ? picked.filter((x) => x !== t.id) : [...picked, t.id])
                  }
                >
                  <HabitBadge habit={t} size={40} />
                  <span className="habit-row__text">
                    <span className="habit-row__name">{t.name}</span>
                    <span className="habit-row__meta">
                      {describeSchedule(t.schedule)}
                      {describeTarget(t) && <span>· {describeTarget(t)}</span>}
                      {t.source && <span className="auto-chip">{tr('Tự động', 'Automatic')}</span>}
                    </span>
                  </span>
                  <span className="template__check" aria-hidden>
                    {on && <CheckIcon size={18} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="btn btn--block" onClick={finish}>
          {picked.length > 0
            ? tr(
                `Tạo ${picked.length} thói quen`,
                `Create ${picked.length} habit${picked.length === 1 ? '' : 's'}`,
              )
            : tr('Bắt đầu, chưa chọn gì', 'Start without any')}
        </button>
        <button type="button" className="link-btn" onClick={() => setStep('hello')}>
          {tr('Quay lại', 'Back')}
        </button>
      </section>
    </div>
  );
}
