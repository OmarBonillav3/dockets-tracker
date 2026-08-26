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
