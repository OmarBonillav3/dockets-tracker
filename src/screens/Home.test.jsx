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
