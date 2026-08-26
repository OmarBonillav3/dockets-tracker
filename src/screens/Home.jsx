import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { parsePastedText } from '../lib/parser.js';

const EMPTY_FORM = { matterId: '', date: '', task: '', detailDescription: '', timeSpent: '', costAssociated: '' };

export function Home() {
  const { matters, entries, addEntry } = useData();
  const [mode, setMode] = useState('manual');
  const [form, setForm] = useState(EMPTY_FORM);
  const [pastedText, setPastedText] = useState('');
  const [candidates, setCandidates] = useState([]);

  function handleManualSubmit(e) {
    e.preventDefault();
    addEntry(form);
    setForm(EMPTY_FORM);
  }

  function handleRepeatLast() {
    const last = entries[entries.length - 1];
    if (!last) return;
    setForm({ ...EMPTY_FORM, matterId: last.matterId, task: last.task });
  }

  function handleParse() {
    setCandidates(parsePastedText(pastedText, matters));
  }

  function confirmCandidate(index) {
    const candidate = candidates[index];
    addEntry({
      matterId: candidate.matterId || '',
      date: candidate.date,
      task: candidate.task,
      detailDescription: candidate.detailDescription,
      timeSpent: candidate.timeSpent,
      costAssociated: '',
    });
    setCandidates((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <h1>Captura rápida</h1>
      <div>
        <button onClick={() => setMode('manual')} aria-pressed={mode === 'manual'}>
          Formulario manual
        </button>
        <button onClick={() => setMode('paste')} aria-pressed={mode === 'paste'}>
          Pegar texto
        </button>
      </div>

      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit}>
          <select aria-label="Matter" value={form.matterId} onChange={(e) => setForm({ ...form, matterId: e.target.value })}>
            <option value="">Selecciona matter</option>
            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input aria-label="Fecha" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input aria-label="Task" value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} placeholder="Task" />
          <textarea
            aria-label="Detalle"
            value={form.detailDescription}
            onChange={(e) => setForm({ ...form, detailDescription: e.target.value })}
            placeholder="Detalle"
          />
          <input aria-label="Tiempo" value={form.timeSpent} onChange={(e) => setForm({ ...form, timeSpent: e.target.value })} placeholder="Tiempo (ej. 10 min)" />
          <input
            aria-label="Costo"
            value={form.costAssociated}
            onChange={(e) => setForm({ ...form, costAssociated: e.target.value })}
            placeholder="Costo"
          />
          <button type="button" onClick={handleRepeatLast}>
            Repetir última tarea
          </button>
          <button type="submit">Guardar</button>
        </form>
      )}

      {mode === 'paste' && (
        <div>
          <textarea
            aria-label="Texto a pegar"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Pega tu nota, correo o mensaje"
          />
          <button onClick={handleParse}>Analizar texto</button>
          <ul>
            {candidates.map((c, i) => (
              <li key={i}>
                <input
                  aria-label={`Task sugerido ${i}`}
                  value={c.task}
                  onChange={(e) => {
                    const next = [...candidates];
                    next[i] = { ...c, task: e.target.value };
                    setCandidates(next);
                  }}
                />
                <span>
                  {c.date || 'sin fecha'} — {c.timeSpent || 'sin tiempo'}
                </span>
                <button onClick={() => confirmCandidate(i)}>Confirmar</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
