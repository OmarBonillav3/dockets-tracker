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
  test('returns days in the month with no entries', () => {
    const entries = [entry({ date: '2026-07-01' })];
    const emptyDays = findEmptyDays(entries, 2026, 6);
    expect(emptyDays).toHaveLength(30);
    expect(emptyDays).not.toContain('2026-07-01');
    expect(emptyDays).toContain('2026-07-02');
  });
});
