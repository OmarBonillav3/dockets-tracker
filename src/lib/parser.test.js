// src/lib/parser.test.js
import { describe, expect, test } from 'vitest';
import { parsePastedText } from './parser.js';

const matters = [
  { id: 'm1', name: 'Gabriel Gonzalez Ocampo - Immigration Negligence', caseNumber: '0024-002', rate: 100, isPotentialClient: false },
  { id: 'potential-client', name: 'Sin número / Cliente potencial', caseNumber: '', rate: null, isPotentialClient: true },
];

describe('parsePastedText', () => {
  test('splits blank-line-separated blocks into separate candidates', () => {
    const text = 'Sent translated birth cert. July 21. 10 min\n\nCalled client about hearing. July 22. 5 min';
    const result = parsePastedText(text, matters, 2026);
    expect(result).toHaveLength(2);
  });

  test('extracts a date in "Month Day" format', () => {
    const result = parsePastedText('Reviewed filing. July 21.', matters, 2026);
    expect(result[0].date).toBe('2026-07-21');
  });

  test('extracts a duration like "10 min" or "1.5 hrs"', () => {
    const result = parsePastedText('Reviewed filing. 10 min', matters, 2026);
    expect(result[0].timeSpent).toBe('10 min');
  });

  test('guesses the matter by fuzzy-matching matter name words', () => {
    const result = parsePastedText('Worked on Gabriel Gonzalez Ocampo immigration filing. 10 min', matters, 2026);
    expect(result[0].matterId).toBe('m1');
  });

  test('leaves matterId null when nothing matches', () => {
    const result = parsePastedText('Completely unrelated note with no matter mention. 10 min', matters, 2026);
    expect(result[0].matterId).toBeNull();
  });

  test('falls back to the whole trimmed text as one candidate when there are no blank lines', () => {
    const result = parsePastedText('Single note, no blank lines here. 5 min', matters, 2026);
    expect(result).toHaveLength(1);
    expect(result[0].detailDescription).toBe('Single note, no blank lines here. 5 min');
  });
});
