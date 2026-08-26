import { beforeEach, describe, expect, test } from 'vitest';
import {
  loadMatters,
  saveMatters,
  loadEntries,
  saveEntries,
  exportBackup,
  importBackup,
  POTENTIAL_CLIENT_MATTER_ID,
} from './storage.js';

beforeEach(() => {
  localStorage.clear();
});

describe('loadMatters', () => {
  test('seeds the potential-client matter on first load', () => {
    const matters = loadMatters();
    expect(matters).toHaveLength(1);
    expect(matters[0].id).toBe(POTENTIAL_CLIENT_MATTER_ID);
    expect(matters[0].isPotentialClient).toBe(true);
  });

  test('returns previously saved matters without re-seeding', () => {
    saveMatters([{ id: 'm1', name: 'Test Matter', caseNumber: '001', rate: 100, isPotentialClient: false }]);
    const matters = loadMatters();
    expect(matters).toHaveLength(1);
    expect(matters[0].id).toBe('m1');
  });
});

describe('entries', () => {
  test('loadEntries returns an empty array when nothing is saved', () => {
    expect(loadEntries()).toEqual([]);
  });

  test('saveEntries persists and loadEntries reads it back', () => {
    const entries = [{ id: 'e1', matterId: 'm1', date: '2026-07-21', task: 'x', detailDescription: 'y', timeSpent: '10 min', costAssociated: '', status: 'draft', createdAt: '2026-07-21T00:00:00.000Z' }];
    saveEntries(entries);
    expect(loadEntries()).toEqual(entries);
  });
});

describe('backup', () => {
  test('exportBackup round-trips through importBackup', () => {
    saveMatters([{ id: 'm1', name: 'Test Matter', caseNumber: '001', rate: 100, isPotentialClient: false }]);
    saveEntries([{ id: 'e1', matterId: 'm1', date: '2026-07-21', task: 'x', detailDescription: 'y', timeSpent: '10 min', costAssociated: '50', status: 'confirmed', createdAt: '2026-07-21T00:00:00.000Z' }]);
    const json = exportBackup();

    localStorage.clear();
    importBackup(json);

    expect(loadMatters()).toHaveLength(1);
    expect(loadEntries()).toHaveLength(1);
  });

  test('importBackup rejects malformed data', () => {
    expect(() => importBackup(JSON.stringify({ foo: 'bar' }))).toThrow();
  });
});
