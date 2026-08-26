import { describe, expect, test } from 'vitest';
import {
  parseDurationToHours,
  parseDuration,
  isDurationUnparseable,
  parseCost,
  parseCostToNumber,
  isCostUnparseable,
  formatHours,
} from './timeUtils.js';

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

describe('parseDuration (null on unrecognized input)', () => {
  test.each(['1 hr 30 min', '45', 'una hora', 'abc'])('returns null for %s', (input) => {
    expect(parseDuration(input)).toBeNull();
    expect(isDurationUnparseable(input)).toBe(true);
    expect(parseDurationToHours(input)).toBe(0);
  });

  test.each(['', '  ', undefined, null])('treats blank input %s as 0, not an error', (input) => {
    expect(parseDuration(input)).toBe(0);
    expect(isDurationUnparseable(input)).toBe(false);
  });

  test('still parses recognized durations', () => {
    expect(parseDuration('30 min')).toBeCloseTo(0.5, 4);
  });
});

describe('parseCost', () => {
  test.each([
    ['$1,200.00', 1200],
    ['1,200.00', 1200],
    ['$50', 50],
    ['50.25', 50.25],
    [' $ 75 ', 75],
  ])('parses %s to %f', (input, expected) => {
    expect(parseCost(input)).toBeCloseTo(expected, 4);
    expect(parseCostToNumber(input)).toBeCloseTo(expected, 4);
  });

  test.each(['', '   ', undefined, null])('treats blank %s as 0, not an error', (input) => {
    expect(parseCost(input)).toBe(0);
    expect(isCostUnparseable(input)).toBe(false);
  });

  test.each(['abc', '12 dolares', '$$', '1.2.3'])('returns null for unparseable %s', (input) => {
    expect(parseCost(input)).toBeNull();
    expect(isCostUnparseable(input)).toBe(true);
    expect(parseCostToNumber(input)).toBe(0);
  });
});

describe('formatHours', () => {
  test('formats with two decimals and unit suffix', () => {
    expect(formatHours(1.5)).toBe('1.50 hrs');
  });
});
