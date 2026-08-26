import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { isInMonth } from '../lib/dateUtils.js';
import {
  parseDurationToHours,
  parseCostToNumber,
  isDurationUnparseable,
  isCostUnparseable,
} from '../lib/timeUtils.js';
import { MonthPicker } from '../components/MonthPicker.jsx';

export function MonthlySummary() {
  const { entries, matters } = useData();
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const { year, month } = period;

  const monthEntries = entries.filter((e) => isInMonth(e.date, year, month));
  // Totals mirror what Export sends: confirmed entries only.
  const confirmedEntries = monthEntries.filter((e) => e.status === 'confirmed');
  const unconfirmedCount = monthEntries.length - confirmedEntries.length;
  const badTimeCount = confirmedEntries.filter((e) => isDurationUnparseable(e.timeSpent)).length;
  const badCostCount = confirmedEntries.filter((e) => isCostUnparseable(e.costAssociated)).length;

  const totalHours = confirmedEntries.reduce((sum, e) => sum + parseDurationToHours(e.timeSpent), 0);
  const totalCost = confirmedEntries.reduce((sum, e) => sum + parseCostToNumber(e.costAssociated), 0);

  const byMatter = matters
    .map((m) => {
      const matterEntries = confirmedEntries.filter((e) => e.matterId === m.id);
      return {
        matter: m,
        hours: matterEntries.reduce((sum, e) => sum + parseDurationToHours(e.timeSpent), 0),
        cost: matterEntries.reduce((sum, e) => sum + parseCostToNumber(e.costAssociated), 0),
      };
    })
    .filter((row) => row.hours > 0 || row.cost > 0);

  return (
    <div className="screen">
      <h1 className="screen__title">Resumen mensual</h1>
      <MonthPicker year={year} month={month} onChange={setPeriod} />
      <p className="muted">Totales de entradas confirmadas únicamente.</p>
      <div className="stat-row">
        <p className="stat-card">Total horas: {totalHours.toFixed(2)}</p>
        <p className="stat-card">Total costo: {totalCost.toFixed(2)}</p>
      </div>
      {unconfirmedCount > 0 && (
        <p className="alert alert--card" role="alert">
          {unconfirmedCount} entradas sin confirmar este mes. No están incluidas en los totales; confírmalas en
          Revisión diaria antes de exportar.
        </p>
      )}
      {badTimeCount > 0 && (
        <p className="alert alert--inline" role="alert">{badTimeCount} entradas con tiempo no reconocido (cuentan como 0 horas).</p>
      )}
      {badCostCount > 0 && (
        <p className="alert alert--inline" role="alert">{badCostCount} entradas con costo no reconocido (cuentan como 0).</p>
      )}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Matter</th>
                <th className="num">Horas</th>
                <th className="num">Costo</th>
              </tr>
            </thead>
            <tbody>
              {byMatter.map((row) => (
                <tr key={row.matter.id}>
                  <td>{row.matter.name}</td>
                  <td className="num">{row.hours.toFixed(2)}</td>
                  <td className="num">{row.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
