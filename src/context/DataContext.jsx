import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loadMatters, saveMatters, loadEntries, saveEntries } from '../lib/storage.js';

const DataContext = createContext(null);

function makeId() {
  return crypto.randomUUID();
}

export function DataProvider({ children }) {
  const [matters, setMatters] = useState(() => loadMatters());
  const [entries, setEntries] = useState(() => loadEntries());

  useEffect(() => {
    saveMatters(matters);
  }, [matters]);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

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
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
