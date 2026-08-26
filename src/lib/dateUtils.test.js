import { describe, expect, test } from 'vitest';
import { groupEntriesByDate, isInMonth, getAllDatesInMonth, findEmptyDays } from './dateUtils.js';

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
