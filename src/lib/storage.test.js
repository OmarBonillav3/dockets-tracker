import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  loadMatters,
  saveMatters,
  loadEntries,
  saveEntries,
  exportBackup,
  importBackup,
  saveCustomTemplate,
  loadCustomTemplate,
  clearCustomTemplate,
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

  test('returns previously saved matters without duplicating the seed', () => {
    saveMatters([
      { id: POTENTIAL_CLIENT_MATTER_ID, name: 'Sin número / Cliente potencial', caseNumber: '', rate: null, isPotentialClient: true },
      { id: 'm1', name: 'Test Matter', caseNumber: '001', rate: 100, isPotentialClient: false },
    ]);
    const matters = loadMatters();
    expect(matters).toHaveLength(2);
    expect(matters.filter((m) => m.id === POTENTIAL_CLIENT_MATTER_ID)).toHaveLength(1);
    expect(matters.some((m) => m.id === 'm1')).toBe(true);
  });

  test('re-injects the potential-client matter when saved data is missing it, keeping user matters', () => {
    saveMatters([{ id: 'm1', name: 'Test Matter', caseNumber: '001', rate: 100, isPotentialClient: false }]);
    const matters = loadMatters();
    expect(matters.some((m) => m.id === POTENTIAL_CLIENT_MATTER_ID)).toBe(true);
    expect(matters.some((m) => m.id === 'm1')).toBe(true);
    // and the repair is persisted
    expect(JSON.parse(localStorage.getItem('dockets:matters')).some((m) => m.id === POTENTIAL_CLIENT_MATTER_ID)).toBe(true);
  });
});

describe('corrupt localStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('loadMatters falls back to the seed instead of throwing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('dockets:matters', '{not json');
    const matters = loadMatters();
    expect(matters).toHaveLength(1);
    expect(matters[0].id).toBe(POTENTIAL_CLIENT_MATTER_ID);
    expect(spy).toHaveBeenCalled();
  });

  test('loadEntries falls back to an empty list instead of throwing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('dockets:entries', 'not json at all');
    expect(loadEntries()).toEqual([]);
    expect(spy).toHaveBeenCalled();
  });

  test('non-array saved values are also rejected safely', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('dockets:matters', '{"a":1}');
    localStorage.setItem('dockets:entries', '{"a":1}');
    expect(loadMatters()[0].id).toBe(POTENTIAL_CLIENT_MATTER_ID);
    expect(loadEntries()).toEqual([]);
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

    expect(loadMatters().some((m) => m.id === 'm1')).toBe(true);
    expect(loadMatters().some((m) => m.id === POTENTIAL_CLIENT_MATTER_ID)).toBe(true);
    expect(loadEntries()).toHaveLength(1);
  });

  test('importBackup rejects malformed data', () => {
    expect(() => importBackup(JSON.stringify({ foo: 'bar' }))).toThrow();
  });
});

describe('custom docket template', () => {
  test('loadCustomTemplate returns null when nothing is saved', () => {
    expect(loadCustomTemplate()).toBeNull();
  });

  test('saveCustomTemplate round-trips the exact bytes and the file name', () => {
    const bytes = new Uint8Array([0, 1, 2, 80, 75, 200, 255, 42]);
    saveCustomTemplate('plantilla-de-la-novia.docx', bytes.buffer);

    const loaded = loadCustomTemplate();
    expect(loaded.name).toBe('plantilla-de-la-novia.docx');
    expect(new Uint8Array(loaded.arrayBuffer)).toEqual(bytes);
  });

  test('clearCustomTemplate removes the stored template', () => {
    saveCustomTemplate('x.docx', new Uint8Array([1, 2, 3]).buffer);
    clearCustomTemplate();
    expect(loadCustomTemplate()).toBeNull();
  });

  test('custom template is not included in the JSON backup', () => {
    saveCustomTemplate('x.docx', new Uint8Array([1, 2, 3]).buffer);
    const json = JSON.parse(exportBackup());
    expect(Object.keys(json).sort()).toEqual(['entries', 'matters']);
  });
});
