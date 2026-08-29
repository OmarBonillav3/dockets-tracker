import { describe, expect, test } from 'vitest';
import { groupEntriesByDate, isInMonth, getAllDatesInMonth, findEmptyDays, getMonthGrid, toISODate } from './dateUtils.js';

const entry = (overrides) => ({ id: 'e', matterId: 'm', date: '2026-07-21', task: 't', detailDescription: 'd', timeSpent: '10 min', costAssociated: '', status: 'draft', createdAt: '', ...overrides });

describe('groupEntriesByDate', () => {
  test('groups entries under their date key', () => {
    const entries = [entry({ id: 'a', date: '2026-07-21' }), entry({ id: 'b', date: '2026-07-22' }), entry({ id: 'c', date: '2026-07-21' })];
    const grouped = groupEntriesByDate(entries);
    expect(Object.keys(grouped).sort()).toEqual(['2026-07-21', '2026-07-22']);
    expect(grouped['2026-07-21']).toHaveLength(2);
  });
});

describe('isInMonth', () => {
  test('returns true when the date falls in the given year/month', () => {
    expect(isInMonth('2026-07-21', 2026, 6)).toBe(true);
  });

  test('returns false otherwise', () => {
    expect(isInMonth('2026-07-21', 2026, 7)).toBe(false);
  });
});

describe('getAllDatesInMonth', () => {
  test('returns every date string for July 2026', () => {
    const dates = getAllDatesInMonth(2026, 6);
    expect(dates).toHaveLength(31);
    expect(dates[0]).toBe('2026-07-01');
    expect(dates[30]).toBe('2026-07-31');
  });
});

describe('toISODate', () => {
  test('formats a Date as a local YYYY-MM-DD string', () => {
    expect(toISODate(new Date(2026, 6, 5))).toBe('2026-07-05');
  });
});

describe('getMonthGrid', () => {
  test('returns whole weeks (Monday-first) padded with adjacent-month days', () => {
    // July 2026 starts on a Wednesday and ends on a Friday.
    const weeks = getMonthGrid(2026, 6);
    expect(weeks).toHaveLength(5);
    expect(weeks.every((w) => w.length === 7)).toBe(true);

    expect(weeks[0][0]).toEqual({ dateStr: '2026-06-29', inMonth: false });
    expect(weeks[0][2]).toEqual({ dateStr: '2026-07-01', inMonth: true });
    expect(weeks[4][6]).toEqual({ dateStr: '2026-08-02', inMonth: false });
  });

  test('a month that starts on Monday has no leading padding', () => {
    // June 2026 starts on a Monday.
    const weeks = getMonthGrid(2026, 5);
    expect(weeks[0][0]).toEqual({ dateStr: '2026-06-01', inMonth: true });
  });

  test('handles a December view spilling into the next January', () => {
    const weeks = getMonthGrid(2026, 11);
    const flat = weeks.flat();
    expect(flat.find((c) => c.dateStr === '2026-12-31').inMonth).toBe(true);
    expect(flat.find((c) => c.dateStr === '2027-01-01').inMonth).toBe(false);
  });
});

describe('findEmptyDays', () => {
  test('for a fully-elapsed past month, returns every day in the month with no entries', () => {
    const entries = [entry({ date: '2026-07-01' })];
    const today = new Date('2026-08-26T12:00:00');
    const emptyDays = findEmptyDays(entries, 2026, 6, today);
    expect(emptyDays).toHaveLength(30);
    expect(emptyDays).not.toContain('2026-07-01');
    expect(emptyDays).toContain('2026-07-02');
  });

  test('for the current month, stops at today instead of listing days that have not happened yet', () => {
    const entries = [];
    const today = new Date('2026-08-05T12:00:00');
    const emptyDays = findEmptyDays(entries, 2026, 7, today);
    expect(emptyDays).toHaveLength(5);
    expect(emptyDays).toEqual(['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05']);
    expect(emptyDays).not.toContain('2026-08-06');
  });

  test('for a future month, returns nothing — none of it has happened yet', () => {
    const today = new Date('2026-08-05T12:00:00');
    const emptyDays = findEmptyDays([], 2026, 8, today);
    expect(emptyDays).toEqual([]);
  });
});
