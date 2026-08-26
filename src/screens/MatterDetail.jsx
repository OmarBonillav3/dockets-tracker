import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';

export function MatterDetail() {
  const { id } = useParams();
  const { matters, entries } = useData();
  const matter = matters.find((m) => m.id === id);
  const matterEntries = entries.filter((e) => e.matterId === id);

  if (!matter) {
    return (
      <p className="empty">
        Matter no encontrado. <Link to="/matters">Volver</Link>
      </p>
    );
  }

  return (
    <div className="screen">
      <h1 className="screen__title">{matter.name}</h1>
      <div className="card card--tight">
        <p className="muted num">Número de caso: {matter.caseNumber || 'Sin número'}</p>
        <p className="muted num">Tarifa: {matter.rate ?? 'N/A'}</p>
      </div>
      <div className="card">
        <div className="card__header">
          <h2 className="section-title">Entradas</h2>
        </div>
        <p className="note">
          Para editar o eliminar una entrada, ve a <Link className="row__link" to="/review">Revisión diaria</Link>.
        </p>
        <ul className="rows">
          {matterEntries.map((e) => (
            <li className="row row__meta" key={e.id}>
              {e.date} — {e.task} ({e.timeSpent})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
