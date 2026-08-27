import { MatterCombobox } from './MatterCombobox.jsx';

/**
 * The shared set of entry fields (matter, date, Task, detail, time, cost),
 * used by Home's manual form, Home's paste candidates and Daily Review's
 * inline edit form so all three stay in sync.
 *
 * `labelFor` lets a caller disambiguate accessible labels when several copies
 * are on screen at once (e.g. one per paste candidate).
 */
export function EntryFormFields({ value, matters, onChange, labelFor = (base) => base, showCost = true }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <>
      <MatterCombobox
        label={labelFor('Matter')}
        matters={matters}
        value={value.matterId || ''}
        onChange={(matterId) => set({ matterId })}
      />
      <div className="date-field">
        <input
          className="input"
          aria-label={labelFor('Fecha')}
          type="date"
          value={value.date || ''}
          onChange={(e) => set({ date: e.target.value })}
        />
        {/* Native date inputs' own empty-state hint ("dd/mm/aaaa") is a
            browser feature, not something we control — desktop Chrome shows
            it, Android Chrome doesn't, leaving the field looking blank with
            no clue what it's for. This overlay renders the same hint
            ourselves so it looks identical on every device; it disappears
            once a real date is picked (the native rendering of the
            selected date already works fine) or while the input is
            focused (so it doesn't sit on top of the native picker UI). */}
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
    </>
  );
}
