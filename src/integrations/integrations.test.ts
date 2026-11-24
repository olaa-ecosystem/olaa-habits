import { habit, stateWith } from '../../tests/fixtures/habits';
import { applyEvents, parseLanguageEvent } from './languageEvents';
import { normalizeNoteLink, noteHref, TAKENOTE_URL } from './olaaApps';
import { journalText } from './takenote';

describe('Language events (contract: language-events.md)', () => {
  const base = {
    type: 'language.lesson.completed',
    userId: 'u1',
    date: '2026-11-24',
    occurredAt: 1,
    source: 'language',
    payload: { courseId: 'en-vi', lessonId: 'l1' },
  };
  it('accepts v1 and pre-v1 events of the user', () => {
    expect(parseLanguageEvent({ ...base, id: 'x', version: 1 }, 'u1')).toEqual({
      type: 'language.lesson.completed',
      date: '2026-11-24',
    });
    expect(parseLanguageEvent(base, 'u1')).not.toBeNull();
  });
  it('ignores other users, unknown versions, types and bad dates', () => {
    expect(parseLanguageEvent(base, 'u2')).toBeNull();
    expect(parseLanguageEvent({ ...base, version: 2 }, 'u1')).toBeNull();
    expect(parseLanguageEvent({ ...base, type: 'language.other' }, 'u1')).toBeNull();
    expect(parseLanguageEvent({ ...base, date: '24/11/2026' }, 'u1')).toBeNull();
    expect(parseLanguageEvent(null, 'u1')).toBeNull();
  });
  it('applies an event id once (NFR-02-004)', () => {
    const s = stateWith([habit()]);
    const e = {
      id: 'u1_x',
      event: { type: 'language.lesson.completed' as const, date: '2026-11-24' },
    };
    const once = applyEvents(s, [e]);
    expect(Object.keys(once.events)).toEqual(['u1_x']);
    expect(applyEvents(once, [e])).toBe(once);
  });
});

describe('Olaa Note links', () => {
  it('accepts Olaa Note addresses only', () => {
    const nb = `${TAKENOTE_URL}#/nb/abc/1`;
    expect(normalizeNoteLink(nb)).toBe(nb);
    expect(normalizeNoteLink('https://example.com/#/nb/abc')).toBeNull();
    expect(normalizeNoteLink('javascript:alert(1)')).toBeNull();
    expect(normalizeNoteLink('')).toBeNull();
    expect(noteHref('https://evil.test/')).toBe(TAKENOTE_URL);
  });
  it('writes the journal as plain text, newest first', () => {
    const h = habit({ name: 'Đọc sách', target: 10, unit: 'trang' });
    const text = journalText(
      h,
      [
        { habitId: 'h1', date: '2026-11-22', value: 10, note: 'Chương 1', updatedAt: 0 },
        { habitId: 'h1', date: '2026-11-23', value: 12, note: 'Chương 2', updatedAt: 0 },
      ],
      'vi',
    );
    expect(text).toBe(
      'Nhật ký thói quen: Đọc sách\n\n23/11/2026 (12/10 trang)\nChương 2\n\n22/11/2026 (10/10 trang)\nChương 1\n',
    );
  });
});
