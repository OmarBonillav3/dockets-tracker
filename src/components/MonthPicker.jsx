const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function getSelectableYears(selectedYear, now = new Date()) {
  const current = now.getFullYear();
  const years = new Set();
  for (let y = current - 3; y <= current + 1; y += 1) years.add(y);
  years.add(selectedYear);
  return [...years].sort((a, b) => b - a);
}

export function MonthPicker({ year, month, onChange }) {
  return (
    <div className="inline-fields">
      <select
        className="select"
        aria-label="Mes"
        value={month}
        onChange={(e) => onChange({ year, month: Number(e.target.value) })}
      >
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={i}>
            {name}
          </option>
        ))}
      </select>
      <select
        className="select"
        aria-label="Año"
        value={year}
        onChange={(e) => onChange({ year: Number(e.target.value), month })}
      >
        {getSelectableYears(year).map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
