const MATTERS_KEY = 'dockets:matters';
const ENTRIES_KEY = 'dockets:entries';
const TEMPLATE_KEY = 'dockets:template';
const TEMPLATE_NAME_KEY = 'dockets:templateName';

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

function seedCopy() {
  return SEED_MATTERS.map((m) => ({ ...m }));
}

export function loadMatters() {
  const raw = localStorage.getItem(MATTERS_KEY);
  if (!raw) {
    const seeded = seedCopy();
    trySaveMatters(seeded);
    return seeded;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error('dockets: no se pudo leer los matters guardados, se usará la semilla.', error);
    return seedCopy();
  }

  if (!Array.isArray(parsed)) {
    console.error('dockets: los matters guardados no son una lista, se usará la semilla.');
    return seedCopy();
  }

  // The fixed potential-client matter must always exist (a backup import or a
  // manual delete can remove it); re-inject it instead of losing it forever.
  if (!parsed.some((m) => m && m.id === POTENTIAL_CLIENT_MATTER_ID)) {
    const repaired = [...seedCopy(), ...parsed];
    trySaveMatters(repaired);
    return repaired;
  }

  return parsed;
}

export function saveMatters(matters) {
  localStorage.setItem(MATTERS_KEY, JSON.stringify(matters));
}

// Persisting a repair/seed during a load must never break booting the app;
// the DataProvider surfaces real save failures for user-initiated changes.
function trySaveMatters(matters) {
  try {
    saveMatters(matters);
  } catch (error) {
    console.error('dockets: no se pudo persistir la semilla de matters.', error);
  }
}

export function loadEntries() {
  const raw = localStorage.getItem(ENTRIES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error('dockets: las entradas guardadas no son una lista, se empezará vacío.');
      return [];
    }
    return parsed;
  } catch (error) {
    console.error('dockets: no se pudo leer las entradas guardadas, se empezará vacío.', error);
    return [];
  }
}

export function saveEntries(entries) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

// A .docx is binary; localStorage only holds strings, so the uploaded
// template is kept base64-encoded. Templates are small (tens of KB), so this
// stays well inside the localStorage budget. Chunked so a large byte array
// never blows String.fromCharCode's argument limit.
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function saveCustomTemplate(name, arrayBuffer) {
  localStorage.setItem(TEMPLATE_KEY, arrayBufferToBase64(arrayBuffer));
  localStorage.setItem(TEMPLATE_NAME_KEY, name);
}

export function loadCustomTemplate() {
  const base64 = localStorage.getItem(TEMPLATE_KEY);
  if (!base64) return null;
  try {
    return {
      name: localStorage.getItem(TEMPLATE_NAME_KEY) || 'plantilla.docx',
      arrayBuffer: base64ToArrayBuffer(base64),
    };
  } catch (error) {
    console.error('dockets: no se pudo leer la plantilla guardada, se usará la predeterminada.', error);
    return null;
  }
}

export function clearCustomTemplate() {
  localStorage.removeItem(TEMPLATE_KEY);
  localStorage.removeItem(TEMPLATE_NAME_KEY);
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
