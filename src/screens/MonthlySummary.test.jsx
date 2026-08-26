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
