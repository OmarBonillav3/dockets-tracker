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
    <div>
      <h1>Matters</h1>
      <form onSubmit={handleSubmit}>
        <input aria-label="Nombre del matter" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
        <input aria-label="Número de caso" value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="Número de caso" />
        <input aria-label="Tarifa" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Tarifa" type="number" />
        <button type="submit">Agregar matter</button>
      </form>
      <ul>
        {matters.map((m) => (
          <li key={m.id}>
            <Link to={`/matters/${m.id}`}>{m.name}</Link>
            {m.caseNumber && ` (${m.caseNumber})`}
            {!m.isPotentialClient && <button onClick={() => deleteMatter(m.id)}>Eliminar</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
