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

export function findEmptyDays(entries, year, month) {
  const allDates = getAllDatesInMonth(year, month);
  const datesWithEntries = new Set(
    entries.filter((e) => isInMonth(e.date, year, month)).map((e) => e.date)
  );
  return allDates.filter((d) => !datesWithEntries.has(d));
}
