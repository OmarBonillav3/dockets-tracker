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
      <select
        aria-label={labelFor('Matter')}
        value={value.matterId || ''}
        onChange={(e) => set({ matterId: e.target.value })}
      >
        <option value="">Selecciona matter</option>
        {matters.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <input
        aria-label={labelFor('Fecha')}
        type="date"
        value={value.date || ''}
        onChange={(e) => set({ date: e.target.value })}
      />
      <input
        aria-label={labelFor('Task')}
        value={value.task || ''}
        onChange={(e) => set({ task: e.target.value })}
        placeholder="Task"
      />
      <textarea
        aria-label={labelFor('Detalle')}
        value={value.detailDescription || ''}
        onChange={(e) => set({ detailDescription: e.target.value })}
        placeholder="Detalle"
      />
      <input
        aria-label={labelFor('Tiempo')}
        value={value.timeSpent || ''}
        onChange={(e) => set({ timeSpent: e.target.value })}
        placeholder="Tiempo (ej. 10 min)"
      />
      {showCost && (
        <input
          aria-label={labelFor('Costo')}
          value={value.costAssociated || ''}
          onChange={(e) => set({ costAssociated: e.target.value })}
          placeholder="Costo"
        />
      )}
    </>
  );
}
