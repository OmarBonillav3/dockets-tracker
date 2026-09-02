import { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * Searchable matter picker: type to filter by name or case number instead of
 * scrolling a plain <select> — needed once the matters catalog has more than
 * a handful of clients. Selecting a suggestion (click or Enter) calls
 * onChange with the matter's id, same contract as a native select would.
 */
export function MatterCombobox({
  matters,
  value,
  onChange,
  onCreateMatter,
  label = 'Matter',
  placeholder = 'Selecciona matter',
}) {
  const [inputText, setInputText] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [createDraft, setCreateDraft] = useState(null);
  const creatingRef = useRef(false);
  const listboxId = useId();

  const selectedMatter = matters.find((m) => m.id === value) || null;

  const focusOnMount = useCallback((el) => el?.focus(), []);

  useEffect(() => {
    setInputText(selectedMatter ? selectedMatter.name : '');
    // Only re-sync when the selected matter identity changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const typedName = inputText.trim();
  const query = typedName.toLowerCase();
  const filtered = query
    ? matters.filter(
        (m) => m.name.toLowerCase().includes(query) || (m.caseNumber || '').toLowerCase().includes(query)
      )
    : matters;

  const alreadyExists = matters.some((m) => m.name.trim().toLowerCase() === query);
  const canCreate = Boolean(onCreateMatter) && typedName !== '' && !alreadyExists;

  const options = [
    ...filtered.map((matter) => ({ kind: 'matter', key: matter.id, matter })),
    ...(canCreate ? [{ kind: 'create', key: '__create__' }] : []),
  ];

  function close(text) {
    setOpen(false);
    setInputText(text);
  }

  function startCreate() {
    creatingRef.current = true;
    setOpen(false);
    setCreateDraft({ name: typedName, caseNumber: '' });
  }

  function cancelCreate() {
    creatingRef.current = false;
    setCreateDraft(null);
    setInputText(selectedMatter ? selectedMatter.name : '');
  }

  function confirmCreate() {
    const name = createDraft.name.trim();
    if (!name) return;
    const created = onCreateMatter(name, createDraft.caseNumber.trim());
    if (!created) return;
    creatingRef.current = false;
    setCreateDraft(null);
    onChange(created.id);
    close(created.name);
  }

  function handleCreateKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmCreate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelCreate();
    }
  }

  function selectOption(option) {
    if (option.kind === 'create') {
      startCreate();
      return;
    }
    onChange(option.matter.id);
    close(option.matter.name);
  }

  function handleFocus() {
    setOpen(true);
    setHighlighted(0);
  }

  function handleChange(e) {
    setInputText(e.target.value);
    setOpen(true);
    setHighlighted(0);
  }

  function handleBlur() {
    // Let a pending option's onMouseDown (which preventDefault()s to survive
    // this blur) run before we close and reset the visible text.
    setTimeout(() => {
      if (creatingRef.current) return;
      setOpen(false);
      setInputText(selectedMatter ? selectedMatter.name : '');
    }, 100);
  }

  function handleKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options[highlighted]) selectOption(options[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setInputText(selectedMatter ? selectedMatter.name : '');
    }
  }

  return (
    <div className="combobox">
      <input
        className="input combobox__input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={label}
        autoComplete="off"
        value={inputText}
        placeholder={placeholder}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {createDraft && (
        <div className="combobox__create-panel">
          <p className="combobox__create-title">Nuevo matter</p>
          <input
            className="input"
            aria-label="Nombre del nuevo matter"
            value={createDraft.name}
            placeholder="Nombre"
            onChange={(e) => setCreateDraft({ ...createDraft, name: e.target.value })}
            onKeyDown={handleCreateKeyDown}
          />
          <input
            className="input"
            ref={focusOnMount}
            aria-label="Número de caso del nuevo matter"
            value={createDraft.caseNumber}
            placeholder="Número de caso (opcional)"
            onChange={(e) => setCreateDraft({ ...createDraft, caseNumber: e.target.value })}
            onKeyDown={handleCreateKeyDown}
          />
          <div className="btn-row btn-row--end">
            <button type="button" className="btn btn--ghost btn--sm" onClick={cancelCreate}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={confirmCreate}
              disabled={!createDraft.name.trim()}
            >
              Crear matter
            </button>
          </div>
        </div>
      )}
      {open && !createDraft && (
        <ul className="combobox__list" role="listbox" id={listboxId}>
          {options.length === 0 && <li className="combobox__empty">Sin resultados</li>}
          {options.map((option, i) => (
            <li
              key={option.key}
              role="option"
              aria-selected={option.kind === 'matter' && option.matter.id === value}
              className={[
                'combobox__option',
                option.kind === 'create' ? 'combobox__option--create' : '',
                i === highlighted ? 'combobox__option--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(option);
              }}
            >
              {option.kind === 'create' ? (
                <>
                  <span className="combobox__create-icon" aria-hidden="true">
                    +
                  </span>
                  Crear matter “{typedName}”
                </>
              ) : (
                option.matter.name
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
