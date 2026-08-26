import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { isInMonth } from '../lib/dateUtils.js';
import { parseDurationToHours } from '../lib/timeUtils.js';

export function MonthlySummary() {
  const { entries, matters } = useData();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth());

  const monthEntries = entries.filter((e) => isInMonth(e.date, year, month));
  const totalHours = monthEntries.reduce((sum, e) => sum + parseDurationToHours(e.timeSpent), 0);
  const totalCost = monthEntries.reduce((sum, e) => sum + (parseFloat(e.costAssociated) || 0), 0);

  const byMatter = matters
    .map((m) => {
      const matterEntries = monthEntries.filter((e) => e.matterId === m.id);
      return {
        matter: m,
        hours: matterEntries.reduce((sum, e) => sum + parseDurationToHours(e.timeSpent), 0),
        cost: matterEntries.reduce((sum, e) => sum + (parseFloat(e.costAssociated) || 0), 0),
      };
    })
    .filter((row) => row.hours > 0 || row.cost > 0);

  return (
    <div>
      <h1>Resumen mensual</h1>
      <p>Total horas: {totalHours.toFixed(2)}</p>
      <p>Total costo: {totalCost.toFixed(2)}</p>
      <table>
        <thead>
          <tr>
            <th>Matter</th>
            <th>Horas</th>
            <th>Costo</th>
          </tr>
        </thead>
        <tbody>
          {byMatter.map((row) => (
            <tr key={row.matter.id}>
              <td>{row.matter.name}</td>
              <td>{row.hours.toFixed(2)}</td>
              <td>{row.cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
