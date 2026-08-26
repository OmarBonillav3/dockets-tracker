import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loadMatters, saveMatters, loadEntries, saveEntries } from '../lib/storage.js';

const DataContext = createContext(null);

function makeId() {
  return crypto.randomUUID();
}

export function DataProvider({ children }) {
  const [matters, setMatters] = useState(() => loadMatters());
  const [entries, setEntries] = useState(() => loadEntries());
  const [mattersSaveFailed, setMattersSaveFailed] = useState(false);
  const [entriesSaveFailed, setEntriesSaveFailed] = useState(false);

  useEffect(() => {
    try {
      saveMatters(matters);
      setMattersSaveFailed(false);
    } catch (error) {
      console.error('dockets: no se pudo guardar los matters.', error);
      setMattersSaveFailed(true);
    }
  }, [matters]);

  useEffect(() => {
    try {
      saveEntries(entries);
      setEntriesSaveFailed(false);
    } catch (error) {
      console.error('dockets: no se pudo guardar las entradas.', error);
      setEntriesSaveFailed(true);
    }
  }, [entries]);

  const saveError =
    mattersSaveFailed || entriesSaveFailed
      ? 'No se pudo guardar en este dispositivo. Es posible que tu último cambio no se haya guardado. Revisa el espacio disponible del navegador o desactiva el modo privado.'
      : null;

  const addMatter = useCallback((matter) => {
    setMatters((prev) => [...prev, { ...matter, id: makeId() }]);
  }, []);

  const updateMatter = useCallback((id, updates) => {
    setMatters((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const deleteMatter = useCallback((id) => {
    setMatters((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addEntry = useCallback((entry) => {
    const newEntry = { ...entry, id: makeId(), status: 'draft', createdAt: new Date().toISOString() };
    setEntries((prev) => [...prev, newEntry]);
    return newEntry;
  }, []);

  const updateEntry = useCallback((id, updates) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const confirmEntry = useCallback((id) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'confirmed' } : e)));
  }, []);

  const confirmDay = useCallback((date) => {
    setEntries((prev) => prev.map((e) => (e.date === date ? { ...e, status: 'confirmed' } : e)));
  }, []);

  const value = {
    matters,
    entries,
    addMatter,
    updateMatter,
    deleteMatter,
    addEntry,
    updateEntry,
    deleteEntry,
    confirmEntry,
    confirmDay,
    saveError,
  };

  return (
    <DataContext.Provider value={value}>
      {saveError && <p role="alert">{saveError}</p>}
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
