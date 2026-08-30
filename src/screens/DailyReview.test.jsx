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

  test('shows only confirmed hours in the day total, and updates as entries are confirmed', async () => {
    renderReview();
    const user = userEvent.setup();
    expect(screen.getByText(/0\.00 hrs confirmadas/)).toBeInTheDocument();

    const [firstConfirm] = screen.getAllByRole('button', { name: /^confirmar$/i });
    await user.click(firstConfirm);
    expect(screen.getByText(/0\.17 hrs confirmadas/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirmar todo el día/i }));
    expect(screen.getByText(/0\.25 hrs confirmadas/)).toBeInTheDocument();
  });

  test('editing an entry inline pre-fills the form and saves the changes', async () => {
    renderReview();
    const user = userEvent.setup();
    const [firstEdit] = screen.getAllByRole('button', { name: /^editar$/i });
    await user.click(firstEdit);

    expect(screen.getByLabelText(/^task$/i)).toHaveValue('Task A');
    expect(screen.getByLabelText(/^tiempo$/i)).toHaveValue('10 min');
    expect(screen.getByLabelText(/^matter$/i)).toHaveValue('Sin número / Cliente potencial');

    await user.clear(screen.getByLabelText(/^task$/i));
    await user.type(screen.getByLabelText(/^task$/i), 'Task A editada');
    await user.clear(screen.getByLabelText(/^tiempo$/i));
    await user.type(screen.getByLabelText(/^tiempo$/i), '45 min');
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));

    expect(screen.getByText('Task A editada')).toBeInTheDocument();
    expect(screen.queryByText('Task A')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^task$/i)).not.toBeInTheDocument();
    // the change is persisted
    const saved = JSON.parse(localStorage.getItem('dockets:entries'));
    expect(saved.find((e) => e.id === 'e1').timeSpent).toBe('45 min');
  });

  test('cancelling an edit discards the changes', async () => {
    renderReview();
    const user = userEvent.setup();
    const [firstEdit] = screen.getAllByRole('button', { name: /^editar$/i });
    await user.click(firstEdit);
    await user.clear(screen.getByLabelText(/^task$/i));
    await user.type(screen.getByLabelText(/^task$/i), 'No guardar esto');
    await user.click(screen.getByRole('button', { name: /^cancelar$/i }));

    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.queryByText('No guardar esto')).not.toBeInTheDocument();
  });

  test('deleting an entry removes it from the list and from storage', async () => {
    renderReview();
    const user = userEvent.setup();
    const [firstDelete] = screen.getAllByRole('button', { name: /^eliminar$/i });
    await user.click(firstDelete);

    expect(screen.queryByText('Task A')).not.toBeInTheDocument();
    expect(screen.getByText('Task B')).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem('dockets:entries'));
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('e2');
  });
});
