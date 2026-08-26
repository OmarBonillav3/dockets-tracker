const MATTERS_KEY = 'dockets:matters';
const ENTRIES_KEY = 'dockets:entries';

export const POTENTIAL_CLIENT_MATTER_ID = 'potential-client';

const SEED_MATTERS = [
  {
    id: POTENTIAL_CLIENT_MATTER_ID,
    name: 'Sin número / Cliente potencial',
    caseNumber: '',
    rate: null,
    isPotentialClient: true,
  },
];

export function loadMatters() {
  const raw = localStorage.getItem(MATTERS_KEY);
  if (!raw) {
    saveMatters(SEED_MATTERS);
    return SEED_MATTERS;
  }
  return JSON.parse(raw);
}

export function saveMatters(matters) {
  localStorage.setItem(MATTERS_KEY, JSON.stringify(matters));
}

export function loadEntries() {
  const raw = localStorage.getItem(ENTRIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveEntries(entries) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function exportBackup() {
  return JSON.stringify({ matters: loadMatters(), entries: loadEntries() }, null, 2);
}

export function importBackup(json) {
  const data = JSON.parse(json);
  if (!Array.isArray(data.matters) || !Array.isArray(data.entries)) {
    throw new Error('Backup inválido: se esperaban "matters" y "entries".');
  }
  saveMatters(data.matters);
  saveEntries(data.entries);
}
