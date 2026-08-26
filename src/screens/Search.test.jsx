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
