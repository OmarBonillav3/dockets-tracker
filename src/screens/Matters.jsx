import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';

export function Matters() {
  const { matters, addMatter, deleteMatter } = useData();
  const [name, setName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [rate, setRate] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    addMatter({
      name: name.trim(),
      caseNumber: caseNumber.trim(),
      rate: rate ? parseFloat(rate) : null,
      isPotentialClient: false,
    });
    setName('');
    setCaseNumber('');
    setRate('');
  }

  return (
    <div className="screen">
      <h1 className="screen__title">Matters</h1>
      <form className="card" onSubmit={handleSubmit}>
        <div className="field-grid">
          <input className="input" aria-label="Nombre del matter" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          <input className="input" aria-label="Número de caso" value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="Número de caso" />
          <input className="input input--num" aria-label="Tarifa" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Tarifa" type="number" />
          <div className="form-actions">
            <button className="btn btn--primary" type="submit">Agregar matter</button>
          </div>
        </div>
      </form>
      <ul className="card rows">
        {matters.map((m) => (
          <li className="row" key={m.id}>
            <span className="row__main">
              <Link className="row__link" to={`/matters/${m.id}`}>{m.name}</Link>
              {m.caseNumber && <span className="row__meta">{` (${m.caseNumber})`}</span>}
            </span>
            {!m.isPotentialClient && (
              <span className="row__actions">
                <button className="btn btn--ghost btn--sm" onClick={() => deleteMatter(m.id)}>Eliminar</button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
