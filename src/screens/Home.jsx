import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { parsePastedText } from '../lib/parser.js';
import { EntryFormFields } from '../components/EntryFormFields.jsx';

const EMPTY_FORM = { matterId: '', date: '', task: '', detailDescription: '', timeSpent: '', costAssociated: '' };

export function Home() {
  const { matters, entries, addEntry, addMatter } = useData();
  const [mode, setMode] = useState('manual');
  const [form, setForm] = useState(EMPTY_FORM);
  const [pastedText, setPastedText] = useState('');
  const [candidates, setCandidates] = useState([]);

  function createMatter(name, caseNumber) {
    return addMatter({ name, caseNumber: caseNumber || '', rate: null, isPotentialClient: false });
  }

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
    <div className="screen">
      <h1 className="screen__title">Captura rápida</h1>
      <div className="segmented">
        <button
          className="segmented__btn"
          onClick={() => setMode('manual')}
          aria-pressed={mode === 'manual'}
        >
          Formulario manual
        </button>
        <button
          className="segmented__btn"
          onClick={() => setMode('paste')}
          aria-pressed={mode === 'paste'}
        >
          Pegar texto
        </button>
      </div>

      {mode === 'manual' && (
        <form className="card" onSubmit={handleManualSubmit}>
          <div className="field-grid">
            <EntryFormFields
              value={form}
              matters={matters}
              onChange={setForm}
              onCreateMatter={createMatter}
            />
            <div className="form-actions">
              <button className="btn btn--ghost" type="button" onClick={handleRepeatLast}>
                Repetir última tarea
              </button>
              <button className="btn btn--primary" type="submit">Guardar</button>
            </div>
          </div>
        </form>
      )}

      {mode === 'paste' && (
        <div className="stack--lg stack">
          <div className="card">
            <textarea
              className="textarea"
              aria-label="Texto a pegar"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Pega tu nota, correo o mensaje"
            />
            <div className="btn-row btn-row--end">
              <button className="btn btn--primary" onClick={handleParse}>Analizar texto</button>
            </div>
          </div>
          <ul className="stack">
            {candidates.map((c, i) => {
              const complete = isCandidateComplete(c);
              return (
                <li className="card card--elevated" key={i}>
                  <div className="field-grid">
                    <EntryFormFields
                      value={c}
                      matters={matters}
                      onChange={(next) => updateCandidate(i, next)}
                      onCreateMatter={createMatter}
                      labelFor={(base) => `${base} sugerido ${i}`}
                      showCost={false}
                    />
                  </div>
                  {!complete && (
                    <p className="alert alert--inline" role="alert">
                      Falta la fecha o el matter para poder confirmar esta entrada.
                    </p>
                  )}
                  <div className="btn-row btn-row--end">
                    <button
                      className="btn btn--primary"
                      onClick={() => confirmCandidate(i)}
                      disabled={!complete}
                    >
                      Confirmar
                    </button>
                  </div>
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
