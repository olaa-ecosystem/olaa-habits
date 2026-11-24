import {
  addDays,
  addMonths,
  daysBetween,
  monthGrid,
  parseTime,
  startOfWeek,
  weekday,
} from './date';

describe('day keys', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('counts whole days, also across a DST change', () => {
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31);
  });
  it('finds the start of the week for Monday and Sunday starts', () => {
    expect(weekday('2026-11-24')).toBe(2); // Tuesday
    expect(startOfWeek('2026-11-24', 1)).toBe('2026-11-23');
    expect(startOfWeek('2026-11-24', 0)).toBe('2026-11-22');
    expect(startOfWeek('2026-11-22', 1)).toBe('2026-11-16');
  });
  it('builds a rectangular month grid', () => {
    const rows = monthGrid('2026-11', 1);
    expect(rows[0]![0]).toBe('2026-10-26');
    expect(rows.every((r) => r.length === 7)).toBe(true);
    expect(rows.flat()).toContain('2026-11-30');
  });
  it('moves months', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });
  it('parses times', () => {
    expect(parseTime('07:30')).toBe(450);
    expect(parseTime('24:00')).toBeNull();
  });
});
