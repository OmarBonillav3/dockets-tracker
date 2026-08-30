export function groupEntriesByDate(entries) {
  return entries.reduce((acc, entry) => {
    (acc[entry.date] ||= []).push(entry);
    return acc;
  }, {});
}

export function isInMonth(dateStr, year, month) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getFullYear() === year && d.getMonth() === month;
}

export function getAllDatesInMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    const m = String(month + 1).padStart(2, '0');
    return `${year}-${m}-${day}`;
  });
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * A month laid out as calendar weeks for a Monday-first grid: an array of
 * 7-cell rows, each cell `{ dateStr, inMonth }`. Leading/trailing cells carry
 * the real dates of the adjacent months (with inMonth: false) so the grid is
 * always rectangular.
 */
export function getMonthGrid(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const weeks = [];
  for (let cell = 0; cell < totalCells; cell += 1) {
    const d = new Date(year, month, 1 + (cell - firstDow));
    if (cell % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push({
      dateStr: toISODate(d),
      inMonth: d.getFullYear() === year && d.getMonth() === month,
    });
  }
  return weeks;
}

/**
 * Days with no entries so far this month. Only counts days that have
 * actually happened: a future month contributes nothing (nothing could have
 * been logged yet), and the current month is capped at today — otherwise
 * every remaining day of the month shows up as "empty" before it even
 * arrives, which buries the days that genuinely need attention.
 */
export function findEmptyDays(entries, year, month, today = new Date()) {
  const isFutureMonth = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());
  if (isFutureMonth) return [];

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const allDates = getAllDatesInMonth(year, month);
  const relevantDates = isCurrentMonth ? allDates.filter((d) => d <= toISODate(today)) : allDates;

  const datesWithEntries = new Set(
    entries.filter((e) => isInMonth(e.date, year, month)).map((e) => e.date)
  );
  return relevantDates.filter((d) => !datesWithEntries.has(d));
}
