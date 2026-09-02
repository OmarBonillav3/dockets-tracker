import { useState } from 'react';
import { getMonthGrid } from '../lib/dateUtils.js';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
// Spanish weekday initials, Monday-first (L M X J V S D).
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const SHORT_MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function dayLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} de ${MONTH_NAMES[m - 1].toLowerCase()} de ${y}`;
}

function shortDayLabel(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d} ${SHORT_MONTH_NAMES[m - 1]}`;
}

/**
 * A month calendar for picking an arbitrary set of days to export. The
 * selection lives in the parent (`selectedDates`) so it survives month
 * navigation; this component only owns which month is on screen.
 */
export function DayPicker({ selectedDates, onChange, entryDates = [], initialMonth }) {
  const now = new Date();
  const [view, setView] = useState(
    initialMonth ?? { year: now.getFullYear(), month: now.getMonth() }
  );

  const selected = new Set(selectedDates);
  const withEntries = new Set(entryDates);
  const weeks = getMonthGrid(view.year, view.month);
  const sortedSelection = [...selectedDates].sort();
  const monthsSelected = new Set(sortedSelection.map((d) => d.slice(0, 7))).size;

  function goToMonth(delta) {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  function toggle(dateStr) {
    const next = selected.has(dateStr)
      ? selectedDates.filter((d) => d !== dateStr)
      : [...selectedDates, dateStr].sort();
    onChange(next);
  }

  function selectVisibleMonth() {
    const visible = weeks
      .flat()
      .filter((c) => c.inMonth && withEntries.has(c.dateStr))
      .map((c) => c.dateStr);
    onChange([...new Set([...selectedDates, ...visible])].sort());
  }

  return (
    <div className="card day-picker">
      <div className="day-picker__nav">
        <button type="button" className="btn btn--ghost" aria-label="Mes anterior" onClick={() => goToMonth(-1)}>
          ‹
        </button>
        <span className="day-picker__title">
          {MONTH_NAMES[view.month]} {view.year}
        </span>
        <button type="button" className="btn btn--ghost" aria-label="Mes siguiente" onClick={() => goToMonth(1)}>
          ›
        </button>
      </div>

      <div className="day-picker__grid">
        <div className="day-picker__row day-picker__row--head">
          {WEEKDAYS.map((w, i) => (
            <span key={i} className="day-picker__weekday">
              {w}
            </span>
          ))}
        </div>
        {weeks.map((week, i) => (
          <div key={i} className="day-picker__row">
            {week.map((cell) => {
              const isSelected = selected.has(cell.dateStr);
              const has = withEntries.has(cell.dateStr);
              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  className={[
                    'day-picker__day',
                    cell.inMonth ? '' : 'day-picker__day--outside',
                    isSelected ? 'day-picker__day--selected' : '',
                    has ? 'day-picker__day--has-entries' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={dayLabel(cell.dateStr)}
                  aria-pressed={isSelected}
                  {...(has ? { 'data-has-entries': 'true' } : {})}
                  onClick={() => toggle(cell.dateStr)}
                >
                  {Number(cell.dateStr.split('-')[2])}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {sortedSelection.length > 0 && (
        <div className="day-picker__selection">
          <p className="day-picker__selection-title">
            {sortedSelection.length} {sortedSelection.length === 1 ? 'día seleccionado' : 'días seleccionados'}
            {monthsSelected > 1 && ` de ${monthsSelected} meses distintos, todos en un mismo documento`}
          </p>
          <div className="chip-row">
            {sortedSelection.map((d) => (
              <button
                type="button"
                key={d}
                className="chip chip--accent chip--removable"
                aria-label={`Quitar ${dayLabel(d)}`}
                onClick={() => onChange(selectedDates.filter((other) => other !== d))}
              >
                {shortDayLabel(d)}
                <span className="chip__remove" aria-hidden="true">
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="btn-row btn-row--end day-picker__actions">
        <button type="button" className="btn btn--ghost" onClick={selectVisibleMonth}>
          Seleccionar todo el mes
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => onChange([])}>
          Limpiar
        </button>
      </div>
    </div>
  );
}
