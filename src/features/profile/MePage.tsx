import { useState } from 'react';
import { appStore, useAppState } from '../../stores/appStore';
import { activeHabits, orderedHabits } from '../../stores/appState';
import { firebaseEnabled } from '../../services/firebase';
import type { DayKey } from '../../utils/date';
import { AccountCard } from '../account/AccountCard';
import { BADGES } from '../gamification/badges';
import { habitStreak } from '../habit-tracking/TodayPage';

/** Stats, badges, account and settings. */
export function MePage({ today }: { today: DayKey }) {
  const state = useAppState();
  const [confirmReset, setConfirmReset] = useState(false);
  const totalCheckins = Object.values(state.checkins).reduce(
    (n, days) => n + Object.keys(days).length,
    0,
  );
  const bestStreak = Math.max(
    0,
    ...orderedHabits(state).map((h) => habitStreak(state, h, h.archivedOn ?? today).best),
  );
  const earned = BADGES.filter((b) => state.badges[b.id]).length;

  return (
    <div className="page">
      <header className="page__head">
        <h1>{state.name || 'Tôi'}</h1>
      </header>

      <div className="stat-tiles">
        <div className="card stat-tile">
          <strong>{activeHabits(state).length}</strong>
          <span>thói quen đang theo dõi</span>
        </div>
        <div className="card stat-tile">
          <strong>{totalCheckins}</strong>
          <span>lượt hoàn thành</span>
        </div>
        <div className="card stat-tile">
          <strong>{bestStreak}</strong>
          <span>chuỗi dài nhất</span>
        </div>
      </div>

      <h2 className="section-title">
        Huy hiệu{' '}
        <span className="muted">
          ({earned}/{BADGES.length})
        </span>
      </h2>
      <ul className="badge-grid">
        {BADGES.map((badge) => {
          const on = state.badges[badge.id];
          return (
            <li key={badge.id} className={`card badge ${on ? 'is-earned' : ''}`}>
              <span className="badge__icon" aria-hidden>
                {badge.icon}
              </span>
              <strong>{badge.title}</strong>
              <span className="small muted">{badge.description}</span>
              <span className="small">
                {on ? `Đạt ngày ${on.split('-').reverse().join('/')}` : 'Chưa đạt'}
              </span>
            </li>
          );
        })}
      </ul>

      {firebaseEnabled && (
        <>
          <h2 className="section-title">Tài khoản</h2>
          <AccountCard />
        </>
      )}

      <h2 className="section-title">Cài đặt</h2>
      <div className="card stack">
        {confirmReset ? (
          <div className="stack" role="alertdialog" aria-label="Xác nhận xoá dữ liệu">
            <p>Xoá mọi thói quen và lịch sử trên máy này? Không thể hoàn tác.</p>
            <div className="form-actions">
              <button type="button" className="btn btn--danger" onClick={() => appStore.reset()}>
                Xoá hết
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirmReset(false)}
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="link-btn link-btn--danger"
            onClick={() => setConfirmReset(true)}
          >
            Xoá toàn bộ dữ liệu
          </button>
        )}
        {!firebaseEnabled && <p className="muted small">Dữ liệu chỉ lưu trên trình duyệt này.</p>}
      </div>
    </div>
  );
}
