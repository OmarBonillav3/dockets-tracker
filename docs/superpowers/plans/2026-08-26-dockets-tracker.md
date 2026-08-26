# Dockets Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user React web app that lets a paralegal at Carus Law capture billable-work entries (typed or pasted from scattered notes), review them by day, and export a `.docx` docket matching her firm's exact Word template.

**Architecture:** Vite + React SPA, no backend. All data (matters, entries) lives in `localStorage`, read/written through a small storage module and exposed to screens via a single React context. A pure heuristic parser turns pasted free text into editable candidate entries. Export uses the `docx` npm package to build a Word document client-side and trigger a download. Eight screens are wired together with `react-router-dom`.

**Tech Stack:** React 18, Vite, react-router-dom, docx (Word generation), Vitest + @testing-library/react + jsdom for testing.

**Spec:** `docs/superpowers/specs/2026-08-26-dockets-tracker-design.md`

## Global Constraints

- No backend, no authentication, no multi-device sync — single user, `localStorage` only.
- `costAssociated` is always a manually-entered value; never computed from `rate × timeSpent`.
- The paste-parser uses local heuristics only — no external API calls, no AI service.
- A fixed matter with id `potential-client` (name "Sin número / Cliente potencial") must be seeded on first load and cannot be deleted.
- Export must produce a real downloadable `.docx` file with columns in this exact order: Matter name, Date, Task, Detail Description, Time Spent, Cost Associated.
- Only entries with `status: 'confirmed'` are included in exports.
- All UI copy is in Spanish, matching the user's language throughout this project.
- Visual styling (colors, radii, shadows, typography) is explicitly out of scope for this plan — screens are built with plain, unstyled/minimally-styled markup. A separate pass applies the design system via the `frontend-design` skill.

---

## File Structure Overview

```
package.json
vite.config.js
index.html
src/
  main.jsx
  App.jsx
  lib/
    storage.js
    timeUtils.js
    dateUtils.js
    parser.js
    docxExport.js
  context/
    DataContext.jsx
  components/
    Nav.jsx
  screens/
    Home.jsx
    DailyReview.jsx
    Matters.jsx
    MatterDetail.jsx
    Search.jsx
    MonthlySummary.jsx
    Export.jsx
    Settings.jsx
```

---

### Task 1: Project scaffolding and test setup

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx` (placeholder shell, replaced fully in Task 5)
- Create: `src/test/setup.js`
- Test: `src/App.test.jsx`

**Interfaces:**
- Produces: a running Vite dev server and a working `npm test` (Vitest) command that later tasks build on.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "dockets-tracker",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "docx": "^8.5.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
  },
});
```

- [ ] **Step 3: Create `src/test/setup.js`**

```js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Dockets Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Create placeholder `src/App.jsx`**

```jsx
export default function App() {
  return <h1>Dockets Tracker</h1>;
}
```

- [ ] **Step 7: Write the failing test**

```jsx
// src/App.test.jsx
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders the app heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /dockets tracker/i })).toBeInTheDocument();
});
```

- [ ] **Step 8: Install dependencies and run the test**

Run: `npm install && npm test`
Expected: FAIL if `npm install` hasn't completed yet, then PASS once dependencies are installed and the test runs against the placeholder `App.jsx`.

- [ ] **Step 9: Commit**

```bash
git add package.json vite.config.js index.html src/main.jsx src/App.jsx src/App.test.jsx src/test/setup.js
git commit -m "chore: scaffold Vite + React project with Vitest"
```

---

### Task 2: Storage layer and data model

**Files:**
- Create: `src/lib/storage.js`
- Test: `src/lib/storage.test.js`

**Interfaces:**
- Produces: `loadMatters()`, `saveMatters(matters)`, `loadEntries()`, `saveEntries(entries)`, `exportBackup()`, `importBackup(json)`, `POTENTIAL_CLIENT_MATTER_ID` — used by `DataContext` (Task 4) and `Settings` (Task 12).

- [ ] **Step 1: Write the failing tests**

```js
// src/lib/storage.test.js
import { beforeEach, describe, expect, test } from 'vitest';
import {
  loadMatters,
  saveMatters,
  loadEntries,
  saveEntries,
  exportBackup,
  importBackup,
  POTENTIAL_CLIENT_MATTER_ID,
} from './storage.js';

beforeEach(() => {
  localStorage.clear();
});

describe('loadMatters', () => {
  test('seeds the potential-client matter on first load', () => {
    const matters = loadMatters();
    expect(matters).toHaveLength(1);
    expect(matters[0].id).toBe(POTENTIAL_CLIENT_MATTER_ID);
    expect(matters[0].isPotentialClient).toBe(true);
  });

  test('returns previously saved matters without re-seeding', () => {
    saveMatters([{ id: 'm1', name: 'Test Matter', caseNumber: '001', rate: 100, isPotentialClient: false }]);
    const matters = loadMatters();
    expect(matters).toHaveLength(1);
    expect(matters[0].id).toBe('m1');
  });
});

describe('entries', () => {
  test('loadEntries returns an empty array when nothing is saved', () => {
    expect(loadEntries()).toEqual([]);
  });

  test('saveEntries persists and loadEntries reads it back', () => {
    const entries = [{ id: 'e1', matterId: 'm1', date: '2026-07-21', task: 'x', detailDescription: 'y', timeSpent: '10 min', costAssociated: '', status: 'draft', createdAt: '2026-07-21T00:00:00.000Z' }];
    saveEntries(entries);
    expect(loadEntries()).toEqual(entries);
  });
});

describe('backup', () => {
  test('exportBackup round-trips through importBackup', () => {
    saveMatters([{ id: 'm1', name: 'Test Matter', caseNumber: '001', rate: 100, isPotentialClient: false }]);
    saveEntries([{ id: 'e1', matterId: 'm1', date: '2026-07-21', task: 'x', detailDescription: 'y', timeSpent: '10 min', costAssociated: '50', status: 'confirmed', createdAt: '2026-07-21T00:00:00.000Z' }]);
    const json = exportBackup();

    localStorage.clear();
    importBackup(json);

    expect(loadMatters()).toHaveLength(1);
    expect(loadEntries()).toHaveLength(1);
  });

  test('importBackup rejects malformed data', () => {
    expect(() => importBackup(JSON.stringify({ foo: 'bar' }))).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/storage.test.js`
Expected: FAIL with "Cannot find module './storage.js'" or similar.

- [ ] **Step 3: Implement `src/lib/storage.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/storage.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.js src/lib/storage.test.js
git commit -m "feat: add localStorage-backed storage layer with matter seeding and backup"
```

---

### Task 3: Time and date utilities

**Files:**
- Create: `src/lib/timeUtils.js`
- Create: `src/lib/dateUtils.js`
- Test: `src/lib/timeUtils.test.js`
- Test: `src/lib/dateUtils.test.js`

**Interfaces:**
- Produces: `parseDurationToHours(input)`, `formatHours(hours)` — used by `MonthlySummary` (Task 11).
- Produces: `groupEntriesByDate(entries)`, `isInMonth(dateStr, year, month)`, `getAllDatesInMonth(year, month)`, `findEmptyDays(entries, year, month)` — used by `DailyReview` (Task 9), `MonthlySummary` (Task 11), `Export` (Task 12).

- [ ] **Step 1: Write the failing tests for time utilities**

```js
// src/lib/timeUtils.test.js
import { describe, expect, test } from 'vitest';
import { parseDurationToHours, formatHours } from './timeUtils.js';

describe('parseDurationToHours', () => {
  test.each([
    ['10 min', 10 / 60],
    ['1.5 hrs', 1.5],
    ['30m', 0.5],
    ['2h', 2],
    ['', 0],
    [undefined, 0],
  ])('parses %s to %f hours', (input, expected) => {
    expect(parseDurationToHours(input)).toBeCloseTo(expected, 4);
  });
});

describe('formatHours', () => {
  test('formats with two decimals and unit suffix', () => {
    expect(formatHours(1.5)).toBe('1.50 hrs');
  });
});
```

- [ ] **Step 2: Write the failing tests for date utilities**

```js
// src/lib/dateUtils.test.js
import { describe, expect, test } from 'vitest';
import { groupEntriesByDate, isInMonth, getAllDatesInMonth, findEmptyDays } from './dateUtils.js';

const entry = (overrides) => ({ id: 'e', matterId: 'm', date: '2026-07-21', task: 't', detailDescription: 'd', timeSpent: '10 min', costAssociated: '', status: 'draft', createdAt: '', ...overrides });

describe('groupEntriesByDate', () => {
  test('groups entries under their date key', () => {
    const entries = [entry({ id: 'a', date: '2026-07-21' }), entry({ id: 'b', date: '2026-07-22' }), entry({ id: 'c', date: '2026-07-21' })];
    const grouped = groupEntriesByDate(entries);
    expect(Object.keys(grouped).sort()).toEqual(['2026-07-21', '2026-07-22']);
    expect(grouped['2026-07-21']).toHaveLength(2);
  });
});

describe('isInMonth', () => {
  test('returns true when the date falls in the given year/month', () => {
    expect(isInMonth('2026-07-21', 2026, 6)).toBe(true);
  });

  test('returns false otherwise', () => {
    expect(isInMonth('2026-07-21', 2026, 7)).toBe(false);
  });
});

describe('getAllDatesInMonth', () => {
  test('returns every date string for July 2026', () => {
    const dates = getAllDatesInMonth(2026, 6);
    expect(dates).toHaveLength(31);
    expect(dates[0]).toBe('2026-07-01');
    expect(dates[30]).toBe('2026-07-31');
  });
});

describe('findEmptyDays', () => {
  test('returns days in the month with no entries', () => {
    const entries = [entry({ date: '2026-07-01' })];
    const emptyDays = findEmptyDays(entries, 2026, 6);
    expect(emptyDays).toHaveLength(30);
    expect(emptyDays).not.toContain('2026-07-01');
    expect(emptyDays).toContain('2026-07-02');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- src/lib/timeUtils.test.js src/lib/dateUtils.test.js`
Expected: FAIL, modules don't exist yet.

- [ ] **Step 4: Implement `src/lib/timeUtils.js`**

```js
export function parseDurationToHours(input) {
  if (!input) return 0;
  const str = String(input).trim().toLowerCase();
  const match = str.match(/^(\d+(?:\.\d+)?)\s*(min|mins|minutes|m|hr|hrs|hours|h)$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2];
  const isMinutes = unit.startsWith('min') || unit === 'm';
  return isMinutes ? value / 60 : value;
}

export function formatHours(hours) {
  return `${hours.toFixed(2)} hrs`;
}
```

- [ ] **Step 5: Implement `src/lib/dateUtils.js`**

```js
export function groupEntriesByDate(entries) {
  return entries.reduce((acc, entry) => {
    (acc[entry.date] ||= []).push(entry);
    return acc;
  }, {});
}

export function isInMonth(dateStr, year, month) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getFullYear() === year && d.getMonth() === month;
}

export function getAllDatesInMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    const m = String(month + 1).padStart(2, '0');
    return `${year}-${m}-${day}`;
  });
}

export function findEmptyDays(entries, year, month) {
  const allDates = getAllDatesInMonth(year, month);
  const datesWithEntries = new Set(
    entries.filter((e) => isInMonth(e.date, year, month)).map((e) => e.date)
  );
  return allDates.filter((d) => !datesWithEntries.has(d));
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- src/lib/timeUtils.test.js src/lib/dateUtils.test.js`
Expected: PASS (all tests)

- [ ] **Step 7: Commit**

```bash
git add src/lib/timeUtils.js src/lib/dateUtils.js src/lib/timeUtils.test.js src/lib/dateUtils.test.js
git commit -m "feat: add time and date utility functions"
```

---

### Task 4: DataContext (CRUD state for matters and entries)

**Files:**
- Create: `src/context/DataContext.jsx`
- Test: `src/context/DataContext.test.jsx`

**Interfaces:**
- Consumes: `loadMatters`, `saveMatters`, `loadEntries`, `saveEntries` from `src/lib/storage.js` (Task 2).
- Produces: `DataProvider` component and `useData()` hook returning `{ matters, entries, addMatter, updateMatter, deleteMatter, addEntry, updateEntry, deleteEntry, confirmEntry, confirmDay }` — used by every screen (Tasks 6–13).

- [ ] **Step 1: Write the failing test**

```jsx
// src/context/DataContext.test.jsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataProvider, useData } from './DataContext.jsx';

beforeEach(() => {
  localStorage.clear();
});

function TestConsumer() {
  const { matters, entries, addMatter, addEntry, confirmEntry, confirmDay } = useData();
  const nonSeedMatters = matters.filter((m) => !m.isPotentialClient);
  return (
    <div>
      <p data-testid="matter-count">{nonSeedMatters.length}</p>
      <p data-testid="entry-count">{entries.length}</p>
      <button onClick={() => addMatter({ name: 'Nuevo Matter', caseNumber: '001', rate: 50, isPotentialClient: false })}>
        add matter
      </button>
      <button
        onClick={() =>
          addEntry({ matterId: 'potential-client', date: '2026-07-21', task: 't', detailDescription: 'd', timeSpent: '10 min', costAssociated: '' })
        }
      >
        add entry
      </button>
      {entries.map((e) => (
        <div key={e.id}>
          <span data-testid={`status-${e.id}`}>{e.status}</span>
          <button onClick={() => confirmEntry(e.id)}>confirm {e.id}</button>
          <button onClick={() => confirmDay(e.date)}>confirm day {e.date}</button>
        </div>
      ))}
    </div>
  );
}

describe('DataContext', () => {
  test('adds a matter and it appears in state', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add matter'));
    expect(screen.getByTestId('matter-count').textContent).toBe('1');
  });

  test('adds an entry with draft status by default', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add entry'));
    expect(screen.getByTestId('entry-count').textContent).toBe('1');
    const statusEl = screen.getByText(/draft/);
    expect(statusEl).toBeInTheDocument();
  });

  test('confirmEntry moves a single entry to confirmed', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add entry'));
    fireEvent.click(screen.getByText(/^confirm e/));
    expect(screen.getByText(/confirmed/)).toBeInTheDocument();
  });

  test('confirmDay moves all entries on that date to confirmed', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add entry'));
    fireEvent.click(screen.getByText(/^confirm day/));
    expect(screen.getByText(/confirmed/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/context/DataContext.test.jsx`
Expected: FAIL, module doesn't exist.

- [ ] **Step 3: Implement `src/context/DataContext.jsx`**

```jsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/context/DataContext.test.jsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/context/DataContext.jsx src/context/DataContext.test.jsx
git commit -m "feat: add DataContext exposing matters/entries CRUD backed by storage"
```

---

### Task 5: App shell, routing, and navigation

**Files:**
- Create: `src/components/Nav.jsx`
- Modify: `src/App.jsx` (replace placeholder from Task 1)
- Test: `src/components/Nav.test.jsx`

**Interfaces:**
- Consumes: `DataProvider` from `src/context/DataContext.jsx` (Task 4). Screen components from Tasks 6–13 (referenced here but implemented later — see note below).
- Produces: the routed shell every screen mounts into; route paths `/`, `/review`, `/matters`, `/matters/:id`, `/search`, `/summary`, `/export`, `/settings` that later tasks' `Link`/`NavLink` usage depends on.

**Note:** This task wires `App.jsx` to import all 8 screen modules. Since those modules don't exist until Tasks 6–13, this task creates minimal stub screens first so the app builds and the Nav test passes, and each later task replaces its stub with the real implementation (same file path, so no import changes needed).

- [ ] **Step 1: Create stub screens so routing compiles**

Create each of these 8 files with the same minimal shape (shown here for `Home`; repeat for `DailyReview`, `Matters`, `MatterDetail`, `Search`, `MonthlySummary`, `Export`, `Settings`, changing only the heading text and export name):

```jsx
// src/screens/Home.jsx
export function Home() {
  return <h1>Inicio</h1>;
}
```

```jsx
// src/screens/DailyReview.jsx
export function DailyReview() {
  return <h1>Revisión diaria</h1>;
}
```

```jsx
// src/screens/Matters.jsx
export function Matters() {
  return <h1>Matters</h1>;
}
```

```jsx
// src/screens/MatterDetail.jsx
export function MatterDetail() {
  return <h1>Detalle de matter</h1>;
}
```

```jsx
// src/screens/Search.jsx
export function Search() {
  return <h1>Buscar</h1>;
}
```

```jsx
// src/screens/MonthlySummary.jsx
export function MonthlySummary() {
  return <h1>Resumen mensual</h1>;
}
```

```jsx
// src/screens/Export.jsx
export function Export() {
  return <h1>Exportar</h1>;
}
```

```jsx
// src/screens/Settings.jsx
export function Settings() {
  return <h1>Configuración</h1>;
}
```

- [ ] **Step 2: Write the failing test for Nav**

```jsx
// src/components/Nav.test.jsx
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Nav } from './Nav.jsx';

describe('Nav', () => {
  test('renders a link for each of the 7 top-level screens', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>);
    const expectedLabels = ['Inicio', 'Revisión diaria', 'Matters', 'Buscar', 'Resumen mensual', 'Exportar', 'Configuración'];
    for (const label of expectedLabels) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/components/Nav.test.jsx`
Expected: FAIL, `Nav.jsx` doesn't exist.

- [ ] **Step 4: Implement `src/components/Nav.jsx`**

```jsx
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/review', label: 'Revisión diaria' },
  { to: '/matters', label: 'Matters' },
  { to: '/search', label: 'Buscar' },
  { to: '/summary', label: 'Resumen mensual' },
  { to: '/export', label: 'Exportar' },
  { to: '/settings', label: 'Configuración' },
];

export function Nav() {
  return (
    <nav>
      <ul>
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/components/Nav.test.jsx`
Expected: PASS

- [ ] **Step 6: Replace `src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext.jsx';
import { Nav } from './components/Nav.jsx';
import { Home } from './screens/Home.jsx';
import { DailyReview } from './screens/DailyReview.jsx';
import { Matters } from './screens/Matters.jsx';
import { MatterDetail } from './screens/MatterDetail.jsx';
import { Search } from './screens/Search.jsx';
import { MonthlySummary } from './screens/MonthlySummary.jsx';
import { Export } from './screens/Export.jsx';
import { Settings } from './screens/Settings.jsx';

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/review" element={<DailyReview />} />
            <Route path="/matters" element={<Matters />} />
            <Route path="/matters/:id" element={<MatterDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/summary" element={<MonthlySummary />} />
            <Route path="/export" element={<Export />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </BrowserRouter>
    </DataProvider>
  );
}
```

- [ ] **Step 7: Update `src/App.test.jsx` for the new shell**

```jsx
// src/App.test.jsx
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders the Inicio screen by default with navigation present', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /inicio/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /matters/i })).toBeInTheDocument();
});
```

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: PASS (all tests across all tasks so far)

- [ ] **Step 9: Commit**

```bash
git add src/App.jsx src/App.test.jsx src/components/Nav.jsx src/components/Nav.test.jsx src/screens/
git commit -m "feat: wire up routing shell with navigation and stub screens"
```

---

### Task 6: Matters catalog screen

**Files:**
- Modify: `src/screens/Matters.jsx` (replacing the Task 5 stub)
- Test: `src/screens/Matters.test.jsx`

**Interfaces:**
- Consumes: `useData()` → `matters`, `addMatter`, `deleteMatter` (Task 4).
- Produces: `/matters` route content; links to `/matters/:id` consumed by `MatterDetail` (Task 7).

- [ ] **Step 1: Write the failing test**

```jsx
// src/screens/Matters.test.jsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DataProvider } from '../context/DataContext.jsx';
import { Matters } from './Matters.jsx';

beforeEach(() => {
  localStorage.clear();
});

function renderMatters() {
  return render(
    <DataProvider>
      <MemoryRouter>
        <Matters />
      </MemoryRouter>
    </DataProvider>
  );
}

describe('Matters', () => {
  test('adds a new matter via the form', async () => {
    renderMatters();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nombre del matter/i), 'Gabriel Gonzalez Ocampo - Immigration');
    await user.type(screen.getByLabelText(/número de caso/i), '0024-002');
    await user.click(screen.getByRole('button', { name: /agregar matter/i }));
    expect(screen.getByText(/Gabriel Gonzalez Ocampo - Immigration/)).toBeInTheDocument();
  });

  test('the seeded potential-client matter cannot be deleted', () => {
    renderMatters();
    expect(screen.getByText(/Sin número \/ Cliente potencial/)).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /eliminar/i })).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/screens/Matters.test.jsx`
Expected: FAIL, the stub has no form.

- [ ] **Step 3: Implement `src/screens/Matters.jsx`**

```jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';

export function Matters() {
  const { matters, addMatter, deleteMatter } = useData();
  const [name, setName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [rate, setRate] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    addMatter({
      name: name.trim(),
      caseNumber: caseNumber.trim(),
      rate: rate ? parseFloat(rate) : null,
      isPotentialClient: false,
    });
    setName('');
    setCaseNumber('');
    setRate('');
  }

  return (
    <div>
      <h1>Matters</h1>
      <form onSubmit={handleSubmit}>
        <input aria-label="Nombre del matter" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
        <input aria-label="Número de caso" value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="Número de caso" />
        <input aria-label="Tarifa" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Tarifa" type="number" />
        <button type="submit">Agregar matter</button>
      </form>
      <ul>
        {matters.map((m) => (
          <li key={m.id}>
            <Link to={`/matters/${m.id}`}>{m.name}</Link>
            {m.caseNumber && ` (${m.caseNumber})`}
            {!m.isPotentialClient && <button onClick={() => deleteMatter(m.id)}>Eliminar</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/screens/Matters.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/Matters.jsx src/screens/Matters.test.jsx
git commit -m "feat: implement Matters catalog screen with add/delete"
```

---

### Task 7: Matter detail screen

**Files:**
- Modify: `src/screens/MatterDetail.jsx` (replacing the Task 5 stub)
- Test: `src/screens/MatterDetail.test.jsx`

**Interfaces:**
- Consumes: `useParams()` from react-router-dom; `useData()` → `matters`, `entries` (Task 4).

- [ ] **Step 1: Write the failing test**

```jsx
// src/screens/MatterDetail.test.jsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from '../context/DataContext.jsx';
import { MatterDetail } from './MatterDetail.jsx';

beforeEach(() => {
  localStorage.clear();
});

test('shows matter info and its entries', async () => {
  localStorage.setItem(
    'dockets:matters',
    JSON.stringify([{ id: 'm1', name: 'Test Matter', caseNumber: '001', rate: 50, isPotentialClient: false }])
  );
  localStorage.setItem(
    'dockets:entries',
    JSON.stringify([
      { id: 'e1', matterId: 'm1', date: '2026-07-21', task: 'Reviewed docs', detailDescription: 'd', timeSpent: '10 min', costAssociated: '', status: 'confirmed', createdAt: '' },
    ])
  );

  render(
    <DataProvider>
      <MemoryRouter initialEntries={['/matters/m1']}>
        <Routes>
          <Route path="/matters/:id" element={<MatterDetail />} />
        </Routes>
      </MemoryRouter>
    </DataProvider>
  );

  expect(screen.getByRole('heading', { name: 'Test Matter' })).toBeInTheDocument();
  expect(screen.getByText(/Reviewed docs/)).toBeInTheDocument();
});

test('shows a fallback message for an unknown matter id', () => {
  render(
    <DataProvider>
      <MemoryRouter initialEntries={['/matters/does-not-exist']}>
        <Routes>
          <Route path="/matters/:id" element={<MatterDetail />} />
        </Routes>
      </MemoryRouter>
    </DataProvider>
  );

  expect(screen.getByText(/no encontrado/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/screens/MatterDetail.test.jsx`
Expected: FAIL, stub doesn't read params or data.

- [ ] **Step 3: Implement `src/screens/MatterDetail.jsx`**

```jsx
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';

export function MatterDetail() {
  const { id } = useParams();
  const { matters, entries } = useData();
  const matter = matters.find((m) => m.id === id);
  const matterEntries = entries.filter((e) => e.matterId === id);

  if (!matter) {
    return (
      <p>
        Matter no encontrado. <Link to="/matters">Volver</Link>
      </p>
    );
  }

  return (
    <div>
      <h1>{matter.name}</h1>
      <p>Número de caso: {matter.caseNumber || 'Sin número'}</p>
      <p>Tarifa: {matter.rate ?? 'N/A'}</p>
      <h2>Entradas</h2>
      <ul>
        {matterEntries.map((e) => (
          <li key={e.id}>
            {e.date} — {e.task} ({e.timeSpent})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/screens/MatterDetail.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/MatterDetail.jsx src/screens/MatterDetail.test.jsx
git commit -m "feat: implement matter detail screen"
```

---

### Task 8: Paste-parse heuristic

**Files:**
- Create: `src/lib/parser.js`
- Test: `src/lib/parser.test.js`

**Interfaces:**
- Produces: `parsePastedText(text, matters, referenceYear)` returning an array of `{ date, matterId, task, detailDescription, timeSpent }` — used by `Home` (Task 9).

- [ ] **Step 1: Write the failing tests**

```js
// src/lib/parser.test.js
import { describe, expect, test } from 'vitest';
import { parsePastedText } from './parser.js';

const matters = [
  { id: 'm1', name: 'Gabriel Gonzalez Ocampo - Immigration Negligence', caseNumber: '0024-002', rate: 100, isPotentialClient: false },
  { id: 'potential-client', name: 'Sin número / Cliente potencial', caseNumber: '', rate: null, isPotentialClient: true },
];

describe('parsePastedText', () => {
  test('splits blank-line-separated blocks into separate candidates', () => {
    const text = 'Sent translated birth cert. July 21. 10 min\n\nCalled client about hearing. July 22. 5 min';
    const result = parsePastedText(text, matters, 2026);
    expect(result).toHaveLength(2);
  });

  test('extracts a date in "Month Day" format', () => {
    const result = parsePastedText('Reviewed filing. July 21.', matters, 2026);
    expect(result[0].date).toBe('2026-07-21');
  });

  test('extracts a duration like "10 min" or "1.5 hrs"', () => {
    const result = parsePastedText('Reviewed filing. 10 min', matters, 2026);
    expect(result[0].timeSpent).toBe('10 min');
  });

  test('guesses the matter by fuzzy-matching matter name words', () => {
    const result = parsePastedText('Worked on Gabriel Gonzalez Ocampo immigration filing. 10 min', matters, 2026);
    expect(result[0].matterId).toBe('m1');
  });

  test('leaves matterId null when nothing matches', () => {
    const result = parsePastedText('Completely unrelated note with no matter mention. 10 min', matters, 2026);
    expect(result[0].matterId).toBeNull();
  });

  test('falls back to the whole trimmed text as one candidate when there are no blank lines', () => {
    const result = parsePastedText('Single note, no blank lines here. 5 min', matters, 2026);
    expect(result).toHaveLength(1);
    expect(result[0].detailDescription).toBe('Single note, no blank lines here. 5 min');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/parser.test.js`
Expected: FAIL, module doesn't exist.

- [ ] **Step 3: Implement `src/lib/parser.js`**

```js
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const MONTH_DAY_PATTERN = new RegExp(
  `\\b(${MONTHS.join('|')})\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?\\b`,
  'i'
);
const NUMERIC_DATE_PATTERN = /\b(\d{1,2})\/(\d{1,2})\/?(\d{2,4})?\b/;
const DURATION_PATTERN = /\b(\d+(?:\.\d+)?)\s*(min|mins|minutes|m|hr|hrs|hours|h)\b/i;

function extractDate(text, referenceYear) {
  let m = text.match(MONTH_DAY_PATTERN);
  if (m) {
    const month = MONTHS.indexOf(m[1].toLowerCase());
    const day = parseInt(m[2], 10);
    const year = m[3] ? parseInt(m[3], 10) : referenceYear;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  m = text.match(NUMERIC_DATE_PATTERN);
  if (m) {
    const month = parseInt(m[1], 10);
    const day = parseInt(m[2], 10);
    const year = m[3] ? (m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10)) : referenceYear;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}

function extractDuration(text) {
  const m = text.match(DURATION_PATTERN);
  return m ? `${m[1]} ${m[2]}` : '';
}

function guessMatterId(text, matters) {
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const matter of matters) {
    if (matter.isPotentialClient) continue;
    const words = matter.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const score = words.filter((w) => lower.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = matter;
    }
  }
  return bestScore > 0 ? best.id : null;
}

export function parsePastedText(text, matters, referenceYear = new Date().getFullYear()) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const source = blocks.length > 0 ? blocks : [text.trim()];

  return source.map((block) => {
    const date = extractDate(block, referenceYear);
    const timeSpent = extractDuration(block);
    const matterId = guessMatterId(block, matters);
    const firstLine = block.split('\n')[0];
    const task = firstLine.slice(0, 60);
    return {
      date: date || '',
      matterId,
      task,
      detailDescription: block,
      timeSpent,
    };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/parser.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser.js src/lib/parser.test.js
git commit -m "feat: add local heuristic parser for pasted text"
```

---

### Task 9: Home / quick capture screen

**Files:**
- Modify: `src/screens/Home.jsx` (replacing the Task 5 stub)
- Test: `src/screens/Home.test.jsx`

**Interfaces:**
- Consumes: `useData()` → `matters`, `entries`, `addEntry` (Task 4); `parsePastedText` (Task 8).

- [ ] **Step 1: Write the failing tests**

```jsx
// src/screens/Home.test.jsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataProvider } from '../context/DataContext.jsx';
import { Home } from './Home.jsx';

beforeEach(() => {
  localStorage.clear();
});

function renderHome() {
  return render(
    <DataProvider>
      <Home />
    </DataProvider>
  );
}

describe('Home', () => {
  test('manual mode: filling the form and submitting creates a draft entry visible on repeat-last', async () => {
    renderHome();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^task$/i), 'Sent translated birth certificate');
    await user.type(screen.getByLabelText(/^tiempo$/i), '10 min');
    await user.click(screen.getByRole('button', { name: /guardar/i }));
    await user.click(screen.getByRole('button', { name: /repetir última tarea/i }));
    expect(screen.getByLabelText(/^task$/i)).toHaveValue('Sent translated birth certificate');
  });

  test('paste mode: pasting text and analyzing shows an editable candidate that can be confirmed', async () => {
    renderHome();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /pegar texto/i }));
    await user.type(screen.getByLabelText(/texto a pegar/i), 'Reviewed filing. July 21. 10 min');
    await user.click(screen.getByRole('button', { name: /analizar texto/i }));
    expect(screen.getByLabelText(/task sugerido 0/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(screen.queryByLabelText(/task sugerido 0/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/screens/Home.test.jsx`
Expected: FAIL, stub has no form.

- [ ] **Step 3: Implement `src/screens/Home.jsx`**

```jsx
import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { parsePastedText } from '../lib/parser.js';

const EMPTY_FORM = { matterId: '', date: '', task: '', detailDescription: '', timeSpent: '', costAssociated: '' };

export function Home() {
  const { matters, entries, addEntry } = useData();
  const [mode, setMode] = useState('manual');
  const [form, setForm] = useState(EMPTY_FORM);
  const [pastedText, setPastedText] = useState('');
  const [candidates, setCandidates] = useState([]);

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
    setCandidates(parsePastedText(pastedText, matters));
  }

  function confirmCandidate(index) {
    const candidate = candidates[index];
    addEntry({
      matterId: candidate.matterId || '',
      date: candidate.date,
      task: candidate.task,
      detailDescription: candidate.detailDescription,
      timeSpent: candidate.timeSpent,
      costAssociated: '',
    });
    setCandidates((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <h1>Captura rápida</h1>
      <div>
        <button onClick={() => setMode('manual')} aria-pressed={mode === 'manual'}>
          Formulario manual
        </button>
        <button onClick={() => setMode('paste')} aria-pressed={mode === 'paste'}>
          Pegar texto
        </button>
      </div>

      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit}>
          <select aria-label="Matter" value={form.matterId} onChange={(e) => setForm({ ...form, matterId: e.target.value })}>
            <option value="">Selecciona matter</option>
            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input aria-label="Fecha" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input aria-label="Task" value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} placeholder="Task" />
          <textarea
            aria-label="Detalle"
            value={form.detailDescription}
            onChange={(e) => setForm({ ...form, detailDescription: e.target.value })}
            placeholder="Detalle"
          />
          <input aria-label="Tiempo" value={form.timeSpent} onChange={(e) => setForm({ ...form, timeSpent: e.target.value })} placeholder="Tiempo (ej. 10 min)" />
          <input
            aria-label="Costo"
            value={form.costAssociated}
            onChange={(e) => setForm({ ...form, costAssociated: e.target.value })}
            placeholder="Costo"
          />
          <button type="button" onClick={handleRepeatLast}>
            Repetir última tarea
          </button>
          <button type="submit">Guardar</button>
        </form>
      )}

      {mode === 'paste' && (
        <div>
          <textarea
            aria-label="Texto a pegar"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Pega tu nota, correo o mensaje"
          />
          <button onClick={handleParse}>Analizar texto</button>
          <ul>
            {candidates.map((c, i) => (
              <li key={i}>
                <input
                  aria-label={`Task sugerido ${i}`}
                  value={c.task}
                  onChange={(e) => {
                    const next = [...candidates];
                    next[i] = { ...c, task: e.target.value };
                    setCandidates(next);
                  }}
                />
                <span>
                  {c.date || 'sin fecha'} — {c.timeSpent || 'sin tiempo'}
                </span>
                <button onClick={() => confirmCandidate(i)}>Confirmar</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/screens/Home.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/Home.jsx src/screens/Home.test.jsx
git commit -m "feat: implement quick capture screen with manual form and paste-parse mode"
```

---

### Task 10: Daily review screen

**Files:**
- Modify: `src/screens/DailyReview.jsx` (replacing the Task 5 stub)
- Test: `src/screens/DailyReview.test.jsx`

**Interfaces:**
- Consumes: `useData()` → `entries`, `confirmEntry`, `confirmDay` (Task 4); `groupEntriesByDate`, `findEmptyDays` (Task 3).

- [ ] **Step 1: Write the failing tests**

```jsx
// src/screens/DailyReview.test.jsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataProvider } from '../context/DataContext.jsx';
import { DailyReview } from './DailyReview.jsx';

beforeEach(() => {
  localStorage.clear();
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  localStorage.setItem(
    'dockets:entries',
    JSON.stringify([
      { id: 'e1', matterId: 'potential-client', date: `${y}-${m}-01`, task: 'Task A', detailDescription: '', timeSpent: '10 min', costAssociated: '', status: 'draft', createdAt: '' },
      { id: 'e2', matterId: 'potential-client', date: `${y}-${m}-01`, task: 'Task B', detailDescription: '', timeSpent: '5 min', costAssociated: '', status: 'draft', createdAt: '' },
    ])
  );
});

function renderReview() {
  return render(
    <DataProvider>
      <DailyReview />
    </DataProvider>
  );
}

describe('DailyReview', () => {
  test('groups entries under their date and shows an empty-day alert', () => {
    renderReview();
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Task B')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/días sin registros/i);
  });

  test('confirming a single entry updates its status', async () => {
    renderReview();
    const user = userEvent.setup();
    const [firstConfirm] = screen.getAllByRole('button', { name: /^confirmar$/i });
    await user.click(firstConfirm);
    expect(screen.getAllByText('confirmed')).toHaveLength(1);
  });

  test('confirming the whole day updates every entry for that date', async () => {
    renderReview();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /confirmar todo el día/i }));
    expect(screen.getAllByText('confirmed')).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/screens/DailyReview.test.jsx`
Expected: FAIL, stub has no content.

- [ ] **Step 3: Implement `src/screens/DailyReview.jsx`**

```jsx
import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { groupEntriesByDate, findEmptyDays } from '../lib/dateUtils.js';

export function DailyReview() {
  const { entries, confirmEntry, confirmDay } = useData();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth());

  const grouped = groupEntriesByDate(entries);
  const emptyDays = findEmptyDays(entries, year, month);
  const dates = Object.keys(grouped).sort();

  return (
    <div>
      <h1>Revisión diaria</h1>
      {emptyDays.length > 0 && <p role="alert">Días sin registros este mes: {emptyDays.join(', ')}</p>}
      {dates.map((date) => (
        <section key={date}>
          <h2>{date}</h2>
          <button onClick={() => confirmDay(date)}>Confirmar todo el día</button>
          <ul>
            {grouped[date].map((e) => (
              <li key={e.id}>
                {e.task} — {e.status}
                {e.status === 'draft' && <button onClick={() => confirmEntry(e.id)}>Confirmar</button>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/screens/DailyReview.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/DailyReview.jsx src/screens/DailyReview.test.jsx
git commit -m "feat: implement daily review screen with bulk and per-entry confirmation"
```

---

### Task 11: Search screen

**Files:**
- Modify: `src/screens/Search.jsx` (replacing the Task 5 stub)
- Test: `src/screens/Search.test.jsx`

**Interfaces:**
- Consumes: `useData()` → `entries`, `matters` (Task 4).

- [ ] **Step 1: Write the failing test**

```jsx
// src/screens/Search.test.jsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataProvider } from '../context/DataContext.jsx';
import { Search } from './Search.jsx';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    'dockets:entries',
    JSON.stringify([
      { id: 'e1', matterId: 'potential-client', date: '2026-07-21', task: 'Translated birth certificate', detailDescription: '', timeSpent: '10 min', costAssociated: '', status: 'draft', createdAt: '' },
      { id: 'e2', matterId: 'potential-client', date: '2026-07-22', task: 'Called client about hearing', detailDescription: '', timeSpent: '5 min', costAssociated: '', status: 'draft', createdAt: '' },
    ])
  );
});

test('filters entries by keyword', async () => {
  render(
    <DataProvider>
      <Search />
    </DataProvider>
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/palabra clave/i), 'birth');
  expect(screen.getByText(/Translated birth certificate/)).toBeInTheDocument();
  expect(screen.queryByText(/Called client about hearing/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/screens/Search.test.jsx`
Expected: FAIL, stub has no filtering.

- [ ] **Step 3: Implement `src/screens/Search.jsx`**

```jsx
import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';

export function Search() {
  const { entries, matters } = useData();
  const [keyword, setKeyword] = useState('');
  const [matterId, setMatterId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const results = entries.filter((e) => {
    if (matterId && e.matterId !== matterId) return false;
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    if (keyword) {
      const haystack = `${e.task} ${e.detailDescription}`.toLowerCase();
      if (!haystack.includes(keyword.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <h1>Buscar</h1>
      <input aria-label="Palabra clave" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Palabra clave" />
      <select aria-label="Matter" value={matterId} onChange={(e) => setMatterId(e.target.value)}>
        <option value="">Todos los matters</option>
        {matters.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <input aria-label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      <input aria-label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      <ul>
        {results.map((e) => (
          <li key={e.id}>
            {e.date} — {e.task}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/screens/Search.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/Search.jsx src/screens/Search.test.jsx
git commit -m "feat: implement search screen with matter/date/keyword filters"
```

---

### Task 12: Monthly summary screen

**Files:**
- Modify: `src/screens/MonthlySummary.jsx` (replacing the Task 5 stub)
- Test: `src/screens/MonthlySummary.test.jsx`

**Interfaces:**
- Consumes: `useData()` → `entries`, `matters` (Task 4); `isInMonth` (Task 3); `parseDurationToHours` (Task 3).

- [ ] **Step 1: Write the failing test**

```jsx
// src/screens/MonthlySummary.test.jsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataProvider } from '../context/DataContext.jsx';
import { MonthlySummary } from './MonthlySummary.jsx';

beforeEach(() => {
  localStorage.clear();
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  localStorage.setItem(
    'dockets:matters',
    JSON.stringify([{ id: 'm1', name: 'Test Matter', caseNumber: '001', rate: 100, isPotentialClient: false }])
  );
  localStorage.setItem(
    'dockets:entries',
    JSON.stringify([
      { id: 'e1', matterId: 'm1', date: `${y}-${m}-01`, task: 't', detailDescription: '', timeSpent: '1 hr', costAssociated: '50', status: 'confirmed', createdAt: '' },
      { id: 'e2', matterId: 'm1', date: `${y}-${m}-02`, task: 't', detailDescription: '', timeSpent: '30 min', costAssociated: '25', status: 'confirmed', createdAt: '' },
    ])
  );
});

test('shows total hours, total cost, and a per-matter breakdown for the current month', () => {
  render(
    <DataProvider>
      <MonthlySummary />
    </DataProvider>
  );
  expect(screen.getByText(/total horas: 1\.50/i)).toBeInTheDocument();
  expect(screen.getByText(/total costo: 75\.00/i)).toBeInTheDocument();
  expect(screen.getByText('Test Matter')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/screens/MonthlySummary.test.jsx`
Expected: FAIL, stub has no totals.

- [ ] **Step 3: Implement `src/screens/MonthlySummary.jsx`**

```jsx
import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { isInMonth } from '../lib/dateUtils.js';
import { parseDurationToHours } from '../lib/timeUtils.js';

export function MonthlySummary() {
  const { entries, matters } = useData();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth());

  const monthEntries = entries.filter((e) => isInMonth(e.date, year, month));
  const totalHours = monthEntries.reduce((sum, e) => sum + parseDurationToHours(e.timeSpent), 0);
  const totalCost = monthEntries.reduce((sum, e) => sum + (parseFloat(e.costAssociated) || 0), 0);

  const byMatter = matters
    .map((m) => {
      const matterEntries = monthEntries.filter((e) => e.matterId === m.id);
      return {
        matter: m,
        hours: matterEntries.reduce((sum, e) => sum + parseDurationToHours(e.timeSpent), 0),
        cost: matterEntries.reduce((sum, e) => sum + (parseFloat(e.costAssociated) || 0), 0),
      };
    })
    .filter((row) => row.hours > 0 || row.cost > 0);

  return (
    <div>
      <h1>Resumen mensual</h1>
      <p>Total horas: {totalHours.toFixed(2)}</p>
      <p>Total costo: {totalCost.toFixed(2)}</p>
      <table>
        <thead>
          <tr>
            <th>Matter</th>
            <th>Horas</th>
            <th>Costo</th>
          </tr>
        </thead>
        <tbody>
          {byMatter.map((row) => (
            <tr key={row.matter.id}>
              <td>{row.matter.name}</td>
              <td>{row.hours.toFixed(2)}</td>
              <td>{row.cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/screens/MonthlySummary.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/MonthlySummary.jsx src/screens/MonthlySummary.test.jsx
git commit -m "feat: implement monthly summary screen with totals and per-matter breakdown"
```

---

### Task 13: docx export generation

**Files:**
- Create: `src/lib/docxExport.js`
- Modify: `src/screens/Export.jsx` (replacing the Task 5 stub)
- Test: `src/lib/docxExport.test.js`
- Test: `src/screens/Export.test.jsx`

**Interfaces:**
- Produces: `entriesToRows(entries, matters)`, `buildDocketDocument({ firmName, entries, matters })`, `exportDocketToFile({ firmName, entries, matters, filename })`.
- Consumes (in `Export.jsx`): `useData()` → `entries`, `matters` (Task 4); `isInMonth` (Task 3); `exportDocketToFile` (this task).

- [ ] **Step 1: Write the failing tests for `docxExport.js`**

```js
// src/lib/docxExport.test.js
import { describe, expect, test } from 'vitest';
import { Document } from 'docx';
import { entriesToRows, buildDocketDocument } from './docxExport.js';

const matters = [{ id: 'm1', name: 'Gabriel Gonzalez Ocampo - Immigration', caseNumber: '0024-002', rate: 100, isPotentialClient: false }];

const entries = [
  { id: 'e1', matterId: 'm1', date: '2026-07-21', task: 'Sent translated docs', detailDescription: 'Sent translated birth certificate', timeSpent: '10 min', costAssociated: '25', status: 'confirmed', createdAt: '' },
  { id: 'e2', matterId: 'm1', date: '2026-07-22', task: 'Draft note', detailDescription: 'Not ready yet', timeSpent: '5 min', costAssociated: '', status: 'draft', createdAt: '' },
];

describe('entriesToRows', () => {
  test('includes only confirmed entries, in column order', () => {
    const rows = entriesToRows(entries, matters);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual([
      '0024-002 - Gabriel Gonzalez Ocampo - Immigration',
      '2026-07-21',
      'Sent translated docs',
      'Sent translated birth certificate',
      '10 min',
      '25',
    ]);
  });
});

describe('buildDocketDocument', () => {
  test('builds a Document instance without throwing', () => {
    const doc = buildDocketDocument({ firmName: 'Carus Law', entries, matters });
    expect(doc).toBeInstanceOf(Document);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/docxExport.test.js`
Expected: FAIL, module doesn't exist.

- [ ] **Step 3: Implement `src/lib/docxExport.js`**

```js
import { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun } from 'docx';

const HEADERS = ['Matter name', 'Date', 'Task', 'Detail Description', 'Time Spent', 'Cost Associated'];

export function entriesToRows(entries, matters) {
  const matterById = Object.fromEntries(matters.map((m) => [m.id, m]));
  return entries
    .filter((e) => e.status === 'confirmed')
    .map((e) => {
      const matter = matterById[e.matterId];
      const matterLabel = matter ? [matter.caseNumber, matter.name].filter(Boolean).join(' - ') : '';
      return [matterLabel, e.date, e.task, e.detailDescription, e.timeSpent, e.costAssociated];
    });
}

function textCell(text) {
  return new TableCell({ children: [new Paragraph(String(text ?? ''))] });
}

function buildTable(rows) {
  const headerRow = new TableRow({ children: HEADERS.map((h) => textCell(h)) });
  const dataRows = rows.map((row) => new TableRow({ children: row.map((cell) => textCell(cell)) }));
  return new Table({ rows: [headerRow, ...dataRows] });
}

export function buildDocketDocument({ firmName, entries, matters }) {
  const rows = entriesToRows(entries, matters);
  return new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: firmName, bold: true, size: 32 })] }),
          buildTable(rows),
        ],
      },
    ],
  });
}

export async function exportDocketToFile({ firmName, entries, matters, filename }) {
  const doc = buildDocketDocument({ firmName, entries, matters });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/docxExport.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing test for the Export screen**

```jsx
// src/screens/Export.test.jsx
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataProvider } from '../context/DataContext.jsx';
import { Export } from './Export.jsx';
import * as docxExport from '../lib/docxExport.js';

beforeEach(() => {
  localStorage.clear();
});

test('clicking the export button calls exportDocketToFile and shows a done message', async () => {
  const spy = vi.spyOn(docxExport, 'exportDocketToFile').mockResolvedValue(undefined);
  render(
    <DataProvider>
      <Export />
    </DataProvider>
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /generar docket/i }));
  expect(spy).toHaveBeenCalledWith(expect.objectContaining({ firmName: 'Carus Law' }));
  expect(await screen.findByText(/listo, descarga iniciada/i)).toBeInTheDocument();
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- src/screens/Export.test.jsx`
Expected: FAIL, stub has no button.

- [ ] **Step 7: Implement `src/screens/Export.jsx`**

```jsx
import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { isInMonth } from '../lib/dateUtils.js';
import { exportDocketToFile } from '../lib/docxExport.js';

export function Export() {
  const { entries, matters } = useData();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth());
  const [status, setStatus] = useState('idle');

  async function handleExport() {
    setStatus('generating');
    const monthEntries = entries.filter((e) => isInMonth(e.date, year, month) && e.status === 'confirmed');
    await exportDocketToFile({
      firmName: 'Carus Law',
      entries: monthEntries,
      matters,
      filename: `docket-${year}-${String(month + 1).padStart(2, '0')}.docx`,
    });
    setStatus('done');
  }

  return (
    <div>
      <h1>Exportar</h1>
      <button onClick={handleExport}>Generar docket (.docx)</button>
      {status === 'generating' && <p>Generando...</p>}
      {status === 'done' && <p>Listo, descarga iniciada.</p>}
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- src/screens/Export.test.jsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/docxExport.js src/lib/docxExport.test.js src/screens/Export.jsx src/screens/Export.test.jsx
git commit -m "feat: implement .docx export matching Carus Law template columns"
```

---

### Task 14: Settings screen (backup export/import)

**Files:**
- Modify: `src/screens/Settings.jsx` (replacing the Task 5 stub)
- Test: `src/screens/Settings.test.jsx`

**Interfaces:**
- Consumes: `exportBackup`, `importBackup` (Task 2).

- [ ] **Step 1: Write the failing test**

```jsx
// src/screens/Settings.test.jsx
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings.jsx';
import * as storage from '../lib/storage.js';

beforeEach(() => {
  localStorage.clear();
});

test('exporting a backup calls exportBackup and triggers a download', async () => {
  const spy = vi.spyOn(storage, 'exportBackup').mockReturnValue('{"matters":[],"entries":[]}');
  render(<Settings />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /exportar respaldo/i }));
  expect(spy).toHaveBeenCalled();
});

test('importing a backup file calls importBackup with its contents', async () => {
  const spy = vi.spyOn(storage, 'importBackup').mockImplementation(() => {});
  Object.defineProperty(window, 'location', { value: { reload: vi.fn() }, writable: true });
  render(<Settings />);
  const file = new File(['{"matters":[],"entries":[]}'], 'backup.json', { type: 'application/json' });
  const input = screen.getByLabelText(/importar respaldo/i);
  await userEvent.upload(input, file);
  await vi.waitFor(() => expect(spy).toHaveBeenCalledWith('{"matters":[],"entries":[]}'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/screens/Settings.test.jsx`
Expected: FAIL, stub has no controls.

- [ ] **Step 3: Implement `src/screens/Settings.jsx`**

```jsx
import { exportBackup, importBackup } from '../lib/storage.js';

export function Settings() {
  function handleExportBackup() {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dockets-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importBackup(reader.result);
      window.location.reload();
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <h1>Configuración</h1>
      <button onClick={handleExportBackup}>Exportar respaldo (JSON)</button>
      <input type="file" accept="application/json" onChange={handleImportBackup} aria-label="Importar respaldo" />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/screens/Settings.test.jsx`
Expected: PASS

- [ ] **Step 5: Run the entire test suite**

Run: `npm test`
Expected: PASS (every test file from Tasks 1–14)

- [ ] **Step 6: Commit**

```bash
git add src/screens/Settings.jsx src/screens/Settings.test.jsx
git commit -m "feat: implement settings screen with JSON backup export/import"
```

---

## After this plan

Once all 14 tasks are complete and `npm test` passes end to end, run `npm run dev` and click through all 8 screens manually to confirm the flows feel right before touching visual style. The next step — explicitly out of scope here — is applying the `frontend-design` skill to redesign the visual language (surfaces, radii, shadows, typography, accent color) across these same 8 screens without changing their logic or structure.
