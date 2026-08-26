import { describe, expect, test } from 'vitest';
import { parseDurationToHours, formatHours } from './timeUtils.js';

describe('parseDurationToHours', () => {
  test.each([
    ['10 min', 10 / 60],
    ['1.5 hrs', 1.5],
    ['30m', 0.5],
    ['2h', 2],
    ['', 0],
    [undefined, 0],
  ])('parses %s to %f hours', (input, expected) => {
    expect(parseDurationToHours(input)).toBeCloseTo(expected, 4);
  });
});

describe('formatHours', () => {
  test('formats with two decimals and unit suffix', () => {
    expect(formatHours(1.5)).toBe('1.50 hrs');
  });
});
