import { useState } from 'react';
import { appStore, useAppState } from '../../stores/appStore';
import {
  activeHabits,
  habitStreak,
  orderedHabits,
  overallConsistency,
  outcomeOn,
} from '../../stores/appState';
import { firebaseEnabled } from '../../services/firebase';
import type { DayKey } from '../../utils/date';
import { AccountCard } from '../account/AccountCard';
import { LocalePicker } from '../../i18n/LocalePicker';
import { downloadExport } from '../data-export/exportData';
import { useAccount } from '../../services/cloudSync';
import { BADGES } from '../gamification/badges';
import { CONSISTENCY_DAYS, formatRate } from '../streaks/consistency';
import { tr } from '../../i18n/locale';

/** Stats, badges, account and settings. */
export function MePage({ today }: { today: DayKey }) {
  const state = useAppState();
  const [confirmReset, setConfirmReset] = useState(false);
  const account = useAccount();
  const totalCheckins = orderedHabits(state).reduce(
    (n, h) =>
      n +
      Object.keys(state.checkins[h.id] ?? {}).filter((d) => outcomeOn(state, h, d) === 'done')
        .length,
    0,
  );
  const consistency = overallConsistency(state, today);
  const bestStreak = Math.max(
    0,
    ...orderedHabits(state).map((h) => habitStreak(state, h, h.archivedOn ?? today).best),
  );
  const earned = BADGES.filter((b) => state.badges[b.id]).length;

  return (
    <div className="page">
      <header className="page__head">
        <h1>{state.name || tr('Tôi', 'Me')}</h1>
      </header>

      <div className="stat-tiles">
        <div className="card stat-tile">
          <strong>{formatRate(consistency)}</strong>
          <span>
            {tr(
              `nhất quán ${CONSISTENCY_DAYS} ngày (${consistency.completed}/${consistency.opportunities} lần có lịch)`,
              `${CONSISTENCY_DAYS}-day consistency (${consistency.completed} of ${consistency.opportunities} scheduled)`,
            )}
          </span>
        </div>
        <div className="card stat-tile">
          <strong>{totalCheckins}</strong>
          <span>
            {tr(
              `lượt hoàn thành · ${activeHabits(state).length} thói quen`,
              `check-ins · ${activeHabits(state).length} habit${activeHabits(state).length === 1 ? '' : 's'}`,
            )}
          </span>
        </div>
        <div className="card stat-tile">
          <strong>{bestStreak}</strong>
          <span>{tr('chuỗi dài nhất', 'best streak')}</span>
        </div>
      </div>

      <h2 className="section-title">
        {tr('Huy hiệu', 'Badges')}{' '}
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
                {on
                  ? tr(
                      `Đạt ngày ${on.split('-').reverse().join('/')}`,
                      `Earned ${on.split('-').reverse().join('/')}`,
                    )
                  : tr('Chưa đạt', 'Not yet')}
              </span>
            </li>
          );
        })}
      </ul>

      {firebaseEnabled && (
        <>
          <h2 className="section-title">{tr('Tài khoản', 'Account')}</h2>
          <AccountCard />
        </>
      )}

      <h2 className="section-title">{tr('Cài đặt', 'Settings')}</h2>
      <div className="card stack">
        <fieldset>
          <legend>{tr('Ngôn ngữ giao diện', 'App language')}</legend>
          <LocalePicker />
        </fieldset>
        {confirmReset ? (
          <div
            className="stack"
            role="alertdialog"
            aria-label={tr('Xác nhận xoá dữ liệu', 'Confirm deleting data')}
          >
            <p>
              {tr(
                'Xoá mọi thói quen và lịch sử trên máy này? Không thể hoàn tác.',
                'Delete every habit and its history on this device? This can’t be undone.',
              )}
            </p>
            <div className="form-actions">
              <button type="button" className="btn btn--danger" onClick={() => appStore.reset()}>
                {tr('Xoá hết', 'Delete all')}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirmReset(false)}
              >
                {tr('Huỷ', 'Cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="link-btn link-btn--danger"
            onClick={() => setConfirmReset(true)}
          >
            {tr('Xoá toàn bộ dữ liệu', 'Delete all data')}
          </button>
        )}
        <div className="stack">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => downloadExport(appStore.getState(), account.email)}
          >
            {tr('Tải dữ liệu của tôi (JSON)', 'Download my data (JSON)')}
          </button>
          <p className="muted small">
            {tr(
              'Mọi thứ app lưu về bạn: thói quen, lịch sử điểm danh, ghi chú và cài đặt.',
              'Everything this app stores about you: habits, check-in history, notes and settings.',
            )}
          </p>
        </div>
        {!firebaseEnabled && (
          <p className="muted small">
            {tr('Dữ liệu chỉ lưu trên trình duyệt này.', 'Data is saved in this browser only.')}
          </p>
        )}
      </div>
    </div>
  );
}
