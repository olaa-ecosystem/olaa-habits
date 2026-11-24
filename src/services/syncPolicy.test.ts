import { habit, stateWith } from '../../tests/fixtures/habits';
import { emptyState } from '../stores/habitState';
import { fromRemoteDoc, initialSyncAction, toRemoteDoc } from './syncPolicy';

describe('sync policy', () => {
  const local = stateWith([habit()]);
  it('decides what to do after sign-in', () => {
    expect(initialSyncAction(local, 5, null)).toBe('push');
    expect(initialSyncAction(emptyState(), 0, null)).toBe('none');
    expect(initialSyncAction(emptyState(), 0, { state: local, updatedAt: 1 })).toBe('pull');
    expect(initialSyncAction(local, 5, { state: local, updatedAt: 9 })).toBe('pull');
    expect(initialSyncAction(local, 9, { state: local, updatedAt: 5 })).toBe('push');
  });
  it('round-trips and refuses unknown versions', () => {
    const doc = toRemoteDoc(local, 7);
    expect(Object.keys(doc).sort()).toEqual(['schemaVersion', 'stateJson', 'updatedAt']);
    expect(fromRemoteDoc(doc)?.state.habits.h1?.name).toBe('Read');
    expect(fromRemoteDoc({ ...doc, schemaVersion: 2 })).toBeNull();
    expect(fromRemoteDoc({ ...doc, stateJson: '{' })).toBeNull();
  });
});
