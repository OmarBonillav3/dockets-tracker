import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';

export function Search() {
  const { entries, matters } = useData();
  const [keyword, setKeyword] = useState('');
  const [matterId, setMatterId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const results = entries.filter((e) => {
    if (matterId && e.matterId !== matterId) return false;
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    if (keyword) {
      const haystack = `${e.task} ${e.detailDescription}`.toLowerCase();
      if (!haystack.includes(keyword.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="screen">
      <h1 className="screen__title">Buscar</h1>
      <div className="card">
        <div className="filter-bar">
          <input className="input" aria-label="Palabra clave" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Palabra clave" />
          <select className="select" aria-label="Matter" value={matterId} onChange={(e) => setMatterId(e.target.value)}>
            <option value="">Todos los matters</option>
            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="date-field">
            <input
              className={from ? 'input' : 'input date-field__input--empty'}
              aria-label="Desde"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            {!from && (
              <span className="date-field__placeholder" aria-hidden="true">
                dd/mm/aaaa
              </span>
            )}
          </div>
          <div className="date-field">
            <input
              className={to ? 'input' : 'input date-field__input--empty'}
              aria-label="Hasta"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            {!to && (
              <span className="date-field__placeholder" aria-hidden="true">
                dd/mm/aaaa
              </span>
            )}
          </div>
        </div>
      </div>
      <ul className="card rows">
        {results.map((e) => (
          <li className="row row__meta" key={e.id}>
            {e.date} — {e.task}
          </li>
        ))}
      </ul>
    </div>
  );
}
