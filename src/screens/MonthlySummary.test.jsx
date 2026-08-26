import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataProvider } from '../context/DataContext.jsx';
import { MonthlySummary } from './MonthlySummary.jsx';

const now = new Date();
const y = now.getFullYear();
const m = String(now.getMonth() + 1).padStart(2, '0');

function entry(overrides) {
  return {
    id: 'e',
    matterId: 'm1',
    date: `${y}-${m}-01`,
    task: 't',
    detailDescription: '',
    timeSpent: '1 hr',
    costAssociated: '50',
    status: 'confirmed',
    createdAt: '',
    ...overrides,
  };
}

function seed(entries) {
  localStorage.setItem(
    'dockets:matters',
    JSON.stringify([{ id: 'm1', name: 'Test Matter', caseNumber: '001', rate: 100, isPotentialClient: false }])
  );
  localStorage.setItem('dockets:entries', JSON.stringify(entries));
}

function renderSummary() {
  return render(
    <DataProvider>
      <MonthlySummary />
    </DataProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  seed([
    entry({ id: 'e1' }),
    entry({ id: 'e2', date: `${y}-${m}-02`, timeSpent: '30 min', costAssociated: '25' }),
  ]);
});

describe('MonthlySummary', () => {
  test('shows total hours, total cost, and a per-matter breakdown for the current month', () => {
    renderSummary();
    expect(screen.getByText(/total horas: 1\.50/i)).toBeInTheDocument();
    expect(screen.getByText(/total costo: 75\.00/i)).toBeInTheDocument();
    expect(screen.getByText('Test Matter')).toBeInTheDocument();
  });

  test('totals count confirmed entries only, and unconfirmed ones are surfaced as a warning', () => {
    seed([
      entry({ id: 'e1' }),
      entry({ id: 'e2', status: 'draft', timeSpent: '2 hrs', costAssociated: '999' }),
    ]);
    renderSummary();
    expect(screen.getByText(/total horas: 1\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/total costo: 50\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/1 entradas sin confirmar este mes/i)).toBeInTheDocument();
  });

  test('parses currency-formatted costs like "$1,200.00"', () => {
    seed([entry({ id: 'e1', costAssociated: '$1,200.00' })]);
    renderSummary();
    expect(screen.getByText(/total costo: 1200\.00/i)).toBeInTheDocument();
  });

  test('counts entries with unparseable time and unparseable cost', () => {
    seed([
      entry({ id: 'e1', timeSpent: '1 hr 30 min', costAssociated: 'como quedamos' }),
      entry({ id: 'e2', timeSpent: '45', costAssociated: '' }),
      entry({ id: 'e3', timeSpent: '1 hr', costAssociated: '10' }),
    ]);
    renderSummary();
    expect(screen.getByText(/2 entradas con tiempo no reconocido/i)).toBeInTheDocument();
    expect(screen.getByText(/1 entradas con costo no reconocido/i)).toBeInTheDocument();
    // blank cost is not an error and simply contributes 0
    expect(screen.getByText(/total costo: 10\.00/i)).toBeInTheDocument();
  });

  test('the month picker lets the user see a different month', async () => {
    seed([
      entry({ id: 'e1', date: `${y}-${m}-01` }),
      entry({ id: 'e2', date: '2026-01-15', timeSpent: '3 hrs', costAssociated: '300' }),
    ]);
    renderSummary();
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/^año$/i), '2026');
    await user.selectOptions(screen.getByLabelText(/^mes$/i), '0');
    expect(screen.getByText(/total horas: 3\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/total costo: 300\.00/i)).toBeInTheDocument();
  });
});
