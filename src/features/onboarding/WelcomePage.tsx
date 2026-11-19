import { useState } from 'react';
import { HabitBadge } from '../../components/HabitBadge';
import { CheckIcon } from '../../components/Icons';
import { firebaseEnabled } from '../../services/firebase';
import { appStore } from '../../stores/appStore';
import { completeOnboarding } from '../../stores/appState';
import type { DayKey } from '../../utils/date';
import { AccountCard } from '../account/AccountCard';
import { HABIT_TEMPLATES } from '../habit-management/templates';
import { describeSchedule } from '../scheduling/schedule';
import { describeTarget } from '../habit-management/types';

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
            Giữ thói quen học tập <span className="brand">mỗi ngày</span>
          </h1>
          <p>Đặt thói quen nhỏ, đánh dấu trong một chạm, và giữ chuỗi kể cả những ngày bận.</p>
          <button
            type="button"
            className="btn btn--block"
            onClick={() => setStep('pick')}
            autoFocus
          >
            Bắt đầu
          </button>
          {firebaseEnabled && <AccountCard intro="Đã dùng Olaa Habits? Đăng nhập để tiếp tục." />}
        </section>
      </div>
    );
  }

  return (
    <div className="welcome">
      <section className="welcome__panel">
        <h1>Bắt đầu với vài thói quen</h1>
        <p>Chọn những thói quen muốn theo dõi. Bạn có thể sửa hoặc thêm sau.</p>
        <label className="field">
          <span>Tên của bạn (không bắt buộc)</span>
          <input
            value={name}
            maxLength={40}
            placeholder="Tên của bạn"
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
                      {t.source && <span className="auto-chip">Tự động</span>}
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
          {picked.length > 0 ? `Tạo ${picked.length} thói quen` : 'Bắt đầu, chưa chọn gì'}
        </button>
        <button type="button" className="link-btn" onClick={() => setStep('hello')}>
          Quay lại
        </button>
      </section>
    </div>
  );
}
