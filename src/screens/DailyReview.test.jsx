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
