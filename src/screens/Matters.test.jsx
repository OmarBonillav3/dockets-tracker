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
