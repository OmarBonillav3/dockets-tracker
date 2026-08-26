import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { groupEntriesByDate, findEmptyDays } from '../lib/dateUtils.js';
import { EntryFormFields } from '../components/EntryFormFields.jsx';

export function DailyReview() {
  const { entries, matters, confirmEntry, confirmDay, updateEntry, deleteEntry } = useData();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth());
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const grouped = groupEntriesByDate(entries);
  const emptyDays = findEmptyDays(entries, year, month);
  const dates = Object.keys(grouped).sort();

  function startEdit(entry) {
    setEditingId(entry.id);
    setDraft({
      matterId: entry.matterId || '',
      date: entry.date || '',
      task: entry.task || '',
      detailDescription: entry.detailDescription || '',
      timeSpent: entry.timeSpent || '',
      costAssociated: entry.costAssociated || '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    updateEntry(editingId, draft);
    cancelEdit();
  }

  function handleDelete(id) {
    if (editingId === id) cancelEdit();
    deleteEntry(id);
  }

  return (
    <div className="screen">
      <h1 className="screen__title">Revisión diaria</h1>
      {emptyDays.length > 0 && (
        <p className="alert alert--card" role="alert">
          Días sin registros este mes: {emptyDays.join(', ')}
        </p>
      )}
      {dates.map((date) => (
        <section className="card" key={date}>
          <div className="card__header">
            <h2 className="day-card__date">{date}</h2>
            <button className="btn btn--sm" onClick={() => confirmDay(date)}>
              Confirmar todo el día
            </button>
          </div>
          <ul className="rows">
            {grouped[date].map((e) => (
              <li className={editingId === e.id ? 'row row--editing' : 'row'} key={e.id}>
                {editingId === e.id ? (
                  <div className="stack">
                    <div className="field-grid">
                      <EntryFormFields value={draft} matters={matters} onChange={setDraft} />
                    </div>
                    <div className="btn-row btn-row--end">
                      <button className="btn btn--ghost" onClick={cancelEdit}>Cancelar</button>
                      <button className="btn btn--primary" onClick={saveEdit}>Guardar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="row__main">
                      <span className="row__title">{e.task}</span>{' '}
                      <span className="row__sep">—</span>{' '}
                      <span className={e.status === 'draft' ? 'chip' : 'chip chip--accent'}>
                        {e.status}
                      </span>
                    </div>
                    <div className="row__actions">
                      {e.status === 'draft' && (
                        <button className="btn btn--sm" onClick={() => confirmEntry(e.id)}>
                          Confirmar
                        </button>
                      )}
                      <button className="btn btn--ghost btn--sm" onClick={() => startEdit(e)}>
                        Editar
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={() => handleDelete(e.id)}>
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
