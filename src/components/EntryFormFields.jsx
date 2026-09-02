import { useState } from 'react';
import { MatterCombobox } from './MatterCombobox.jsx';

/**
 * The shared set of entry fields (matter, date, Task, detail, time, cost),
 * used by Home's manual form, Home's paste candidates and Daily Review's
 * inline edit form so all three stay in sync.
 *
 * `labelFor` lets a caller disambiguate accessible labels when several copies
 * are on screen at once (e.g. one per paste candidate).
 */
export function EntryFormFields({
  value,
  matters,
  onChange,
  onCreateMatter,
  labelFor = (base) => base,
  showCost = true,
}) {
  const set = (patch) => onChange({ ...value, ...patch });
  const [matterMissingCaseNumber, setMatterMissingCaseNumber] = useState(null);

  function handleCreateMatter(name, caseNumber) {
    const created = onCreateMatter(name, caseNumber);
    if (created) setMatterMissingCaseNumber(created.caseNumber ? null : created.name);
    return created;
  }

  return (
    <>
      <MatterCombobox
        label={labelFor('Matter')}
        matters={matters}
        value={value.matterId || ''}
        onChange={(matterId) => set({ matterId })}
        onCreateMatter={onCreateMatter ? handleCreateMatter : undefined}
      />
      <div className="date-field">
        <input
          className={value.date ? 'input' : 'input date-field__input--empty'}
          aria-label={labelFor('Fecha')}
          type="date"
          value={value.date || ''}
          onChange={(e) => set({ date: e.target.value })}
        />
        {/* Whether the browser draws its own empty-state hint ("dd/mm/aaaa")
            varies by platform and isn't something we can detect from CSS —
            date-field__input--empty makes that native hint invisible
            whenever the field is empty, and this overlay draws the hint
            ourselves instead, so exactly one always shows. It disappears
            once a real date is picked (the native rendering of the selected
            date already works fine) or while the input is focused (so it
            doesn't sit on top of the native picker UI). */}
        {!value.date && (
          <span className="date-field__placeholder" aria-hidden="true">
            dd/mm/aaaa
          </span>
        )}
      </div>
      <input
        className="input"
        aria-label={labelFor('Task')}
        value={value.task || ''}
        onChange={(e) => set({ task: e.target.value })}
        placeholder="Task"
      />
      <textarea
        className="textarea"
        aria-label={labelFor('Detalle')}
        value={value.detailDescription || ''}
        onChange={(e) => set({ detailDescription: e.target.value })}
        placeholder="Detalle"
      />
      <input
        className="input input--num"
        aria-label={labelFor('Tiempo')}
        value={value.timeSpent || ''}
        onChange={(e) => set({ timeSpent: e.target.value })}
        placeholder="Tiempo (ej. 10 min)"
      />
      {showCost && (
        <input
          className="input input--num"
          aria-label={labelFor('Costo')}
          value={value.costAssociated || ''}
          onChange={(e) => set({ costAssociated: e.target.value })}
          placeholder="Costo"
        />
      )}
      {matterMissingCaseNumber && (
        <p className="note note--full" role="status">
          Matter “{matterMissingCaseNumber}” creado sin número de caso. Agrégaselo en la pantalla Matters
          para que salga completo en el docket.
        </p>
      )}
    </>
  );
}
