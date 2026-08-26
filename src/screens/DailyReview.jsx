import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { groupEntriesByDate, findEmptyDays } from '../lib/dateUtils.js';

export function DailyReview() {
  const { entries, confirmEntry, confirmDay } = useData();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth());

  const grouped = groupEntriesByDate(entries);
  const emptyDays = findEmptyDays(entries, year, month);
  const dates = Object.keys(grouped).sort();

  return (
    <div>
      <h1>Revisión diaria</h1>
      {emptyDays.length > 0 && <p role="alert">Días sin registros este mes: {emptyDays.join(', ')}</p>}
      {dates.map((date) => (
        <section key={date}>
          <h2>{date}</h2>
          <button onClick={() => confirmDay(date)}>Confirmar todo el día</button>
          <ul>
            {grouped[date].map((e) => (
              <li key={e.id}>
                <span>{e.task}</span> — <span>{e.status}</span>
                {e.status === 'draft' && <button onClick={() => confirmEntry(e.id)}>Confirmar</button>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
