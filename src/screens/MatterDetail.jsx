import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';

export function MatterDetail() {
  const { id } = useParams();
  const { matters, entries } = useData();
  const matter = matters.find((m) => m.id === id);
  const matterEntries = entries.filter((e) => e.matterId === id);

  if (!matter) {
    return (
      <p>
        Matter no encontrado. <Link to="/matters">Volver</Link>
      </p>
    );
  }

  return (
    <div>
      <h1>{matter.name}</h1>
      <p>Número de caso: {matter.caseNumber || 'Sin número'}</p>
      <p>Tarifa: {matter.rate ?? 'N/A'}</p>
      <h2>Entradas</h2>
      <p>
        Para editar o eliminar una entrada, ve a <Link to="/review">Revisión diaria</Link>.
      </p>
      <ul>
        {matterEntries.map((e) => (
          <li key={e.id}>
            {e.date} — {e.task} ({e.timeSpent})
          </li>
        ))}
      </ul>
    </div>
  );
}
