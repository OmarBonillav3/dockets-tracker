import { useEffect, useId, useRef, useState } from 'react';

/**
 * Searchable matter picker: type to filter by name or case number instead of
 * scrolling a plain <select> — needed once the matters catalog has more than
 * a handful of clients. Selecting a suggestion (click or Enter) calls
 * onChange with the matter's id, same contract as a native select would.
 */
export function MatterCombobox({ matters, value, onChange, label = 'Matter', placeholder = 'Selecciona matter' }) {
  const [inputText, setInputText] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const listboxId = useId();

  const selectedMatter = matters.find((m) => m.id === value) || null;

  useEffect(() => {
    setInputText(selectedMatter ? selectedMatter.name : '');
    // Only re-sync when the selected matter identity changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const query = inputText.trim().toLowerCase();
  const filtered = query
    ? matters.filter(
        (m) => m.name.toLowerCase().includes(query) || (m.caseNumber || '').toLowerCase().includes(query)
      )
    : matters;

  function selectMatter(matter) {
    onChange(matter.id);
    setInputText(matter.name);
    setOpen(false);
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
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlighted]) selectMatter(filtered[highlighted]);
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
      {open && (
        <ul className="combobox__list" role="listbox" id={listboxId}>
          {filtered.length === 0 && <li className="combobox__empty">Sin resultados</li>}
          {filtered.map((m, i) => (
            <li
              key={m.id}
              role="option"
              aria-selected={m.id === value}
              className={`combobox__option${i === highlighted ? ' combobox__option--active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectMatter(m);
              }}
            >
              {m.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
