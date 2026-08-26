export function parseDurationToHours(input) {
  if (!input) return 0;
  const str = String(input).trim().toLowerCase();
  const match = str.match(/^(\d+(?:\.\d+)?)\s*(min|mins|minutes|m|hr|hrs|hours|h)$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2];
  const isMinutes = unit.startsWith('min') || unit === 'm';
  return isMinutes ? value / 60 : value;
}

export function formatHours(hours) {
  return `${hours.toFixed(2)} hrs`;
}
