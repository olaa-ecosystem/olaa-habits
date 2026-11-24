import { freeze, habit, stateWith } from '../../../tests/fixtures/habits';
import { canFreeze, canUnfreeze, freezesLeftInMonth } from './freezes';

const TODAY = '2026-11-24';

describe('freezes', () => {
  it('allows today and later, within the monthly allowance', () => {
    const s = stateWith([habit()]);
    expect(canFreeze(s, TODAY, TODAY)).toBe('ok');
    expect(canFreeze(s, '2026-11-23', TODAY)).toBe('past');
    freeze(s, '2026-11-25', '2026-11-26');
    expect(freezesLeftInMonth(s, '2026-11')).toBe(0);
    expect(canFreeze(s, '2026-11-27', TODAY)).toBe('none-left');
    expect(canFreeze(s, '2026-12-01', TODAY)).toBe('ok');
    expect(canFreeze(s, '2026-11-25', TODAY)).toBe('already');
  });
  it('can take back a freeze until its day passes', () => {
    const s = freeze(stateWith([habit()]), '2026-11-20', '2026-11-25');
    expect(canUnfreeze(s, '2026-11-25', TODAY)).toBe(true);
    expect(canUnfreeze(s, '2026-11-20', TODAY)).toBe(false);
  });
});
