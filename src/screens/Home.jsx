import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { parsePastedText } from '../lib/parser.js';
import { EntryFormFields } from '../components/EntryFormFields.jsx';

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
    setCandidates(
      parsePastedText(pastedText, matters).map((c) => ({
        ...c,
        matterId: c.matterId || '',
        date: c.date || '',
        costAssociated: '',
      }))
    );
  }

  function updateCandidate(index, next) {
    setCandidates((prev) => prev.map((c, i) => (i === index ? next : c)));
  }

  function confirmCandidate(index) {
    const candidate = candidates[index];
    if (!isCandidateComplete(candidate)) return;
    addEntry({
      matterId: candidate.matterId,
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
          <EntryFormFields value={form} matters={matters} onChange={setForm} />
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
            {candidates.map((c, i) => {
              const complete = isCandidateComplete(c);
              return (
                <li key={i}>
                  <EntryFormFields
                    value={c}
                    matters={matters}
                    onChange={(next) => updateCandidate(i, next)}
                    labelFor={(base) => `${base} sugerido ${i}`}
                    showCost={false}
                  />
                  {!complete && <p role="alert">Falta la fecha o el matter para poder confirmar esta entrada.</p>}
                  <button onClick={() => confirmCandidate(i)} disabled={!complete}>
                    Confirmar
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function isCandidateComplete(candidate) {
  return Boolean(candidate && candidate.date && candidate.matterId);
}
