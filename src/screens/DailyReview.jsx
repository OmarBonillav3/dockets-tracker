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
                {editingId === e.id ? (
                  <div>
                    <EntryFormFields value={draft} matters={matters} onChange={setDraft} />
                    <button onClick={saveEdit}>Guardar</button>
                    <button onClick={cancelEdit}>Cancelar</button>
                  </div>
                ) : (
                  <>
                    <span>{e.task}</span> — <span>{e.status}</span>
                    {e.status === 'draft' && <button onClick={() => confirmEntry(e.id)}>Confirmar</button>}
                    <button onClick={() => startEdit(e)}>Editar</button>
                    <button onClick={() => handleDelete(e.id)}>Eliminar</button>
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
