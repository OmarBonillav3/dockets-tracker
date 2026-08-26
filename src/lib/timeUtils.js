const DURATION_PATTERN = /^(\d+(?:\.\d+)?)\s*(min|mins|minutes|m|hr|hrs|hours|h)$/;

/**
 * Parses a duration string into hours.
 * Returns null when the input is present but not recognized, so callers can
 * surface a count of unparseable values instead of silently summing zeros.
 * Blank/empty input returns 0 (a legitimately empty field, not an error).
 */
export function parseDuration(input) {
  if (input === null || input === undefined) return 0;
  const str = String(input).trim().toLowerCase();
  if (str === '') return 0;
  const match = str.match(DURATION_PATTERN);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2];
  const isMinutes = unit.startsWith('min') || unit === 'm';
  return isMinutes ? value / 60 : value;
}

export function parseDurationToHours(input) {
  const hours = parseDuration(input);
  return hours === null ? 0 : hours;
}

export function isDurationUnparseable(input) {
  return parseDuration(input) === null;
}

/**
 * Parses a manually entered currency value ("$1,200.00", "50", " ") into a number.
 * Returns null when the input is present but not a number, 0 when blank.
 * Never derives a cost from rate x time - cost is always manually entered.
 */
export function parseCost(input) {
  if (input === null || input === undefined) return 0;
  const str = String(input).trim();
  if (str === '') return 0;
  const cleaned = str.replace(/\$/g, '').replace(/,/g, '').trim();
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = parseFloat(cleaned);
  return Number.isNaN(value) ? null : value;
}

export function parseCostToNumber(input) {
  const value = parseCost(input);
  return value === null ? 0 : value;
}

export function isCostUnparseable(input) {
  return parseCost(input) === null;
}

export function formatHours(hours) {
  return `${hours.toFixed(2)} hrs`;
}
