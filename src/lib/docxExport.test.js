import { describe, expect, test } from 'vitest';
import { Document } from 'docx';
import { entriesToRows, buildDocketDocument } from './docxExport.js';

const matters = [{ id: 'm1', name: 'Gabriel Gonzalez Ocampo - Immigration', caseNumber: '0024-002', rate: 100, isPotentialClient: false }];

const entries = [
  { id: 'e1', matterId: 'm1', date: '2026-07-21', task: 'Sent translated docs', detailDescription: 'Sent translated birth certificate', timeSpent: '10 min', costAssociated: '25', status: 'confirmed', createdAt: '' },
  { id: 'e2', matterId: 'm1', date: '2026-07-22', task: 'Draft note', detailDescription: 'Not ready yet', timeSpent: '5 min', costAssociated: '', status: 'draft', createdAt: '' },
];

describe('entriesToRows', () => {
  test('includes only confirmed entries, in column order', () => {
    const rows = entriesToRows(entries, matters);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual([
      '0024-002 - Gabriel Gonzalez Ocampo - Immigration',
      '2026-07-21',
      'Sent translated docs',
      'Sent translated birth certificate',
      '10 min',
      '25',
    ]);
  });
});

describe('buildDocketDocument', () => {
  test('builds a Document instance without throwing', () => {
    const doc = buildDocketDocument({ firmName: 'Carus Law', entries, matters });
    expect(doc).toBeInstanceOf(Document);
  });
});
