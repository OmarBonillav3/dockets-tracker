import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

async function analyze(user, text) {
  await user.click(screen.getByRole('button', { name: /pegar texto/i }));
  await user.type(screen.getByLabelText(/texto a pegar/i), text);
  await user.click(screen.getByRole('button', { name: /analizar texto/i }));
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
    await analyze(user, 'Reviewed filing. July 21. 10 min');
    expect(screen.getByLabelText(/task sugerido 0/i)).toBeInTheDocument();
    // the parser cannot guess a matter, so a matter must be chosen first
    await user.click(screen.getByLabelText(/matter sugerido 0/i));
    await user.click(screen.getByRole('option', { name: /sin número/i }));
    await user.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(screen.queryByLabelText(/task sugerido 0/i)).not.toBeInTheDocument();
  });

  test('paste mode: every candidate field is editable', async () => {
    renderHome();
    const user = userEvent.setup();
    await analyze(user, 'Reviewed filing. July 21. 10 min');

    fireEvent.change(screen.getByLabelText(/fecha sugerido 0/i), { target: { value: '2026-08-03' } });
    await user.click(screen.getByLabelText(/matter sugerido 0/i));
    await user.click(screen.getByRole('option', { name: /sin número/i }));
    await user.clear(screen.getByLabelText(/task sugerido 0/i));
    await user.type(screen.getByLabelText(/task sugerido 0/i), 'Llamada con cliente');
    await user.clear(screen.getByLabelText(/detalle sugerido 0/i));
    await user.type(screen.getByLabelText(/detalle sugerido 0/i), 'Detalle editado');
    await user.clear(screen.getByLabelText(/tiempo sugerido 0/i));
    await user.type(screen.getByLabelText(/tiempo sugerido 0/i), '25 min');

    expect(screen.getByLabelText(/fecha sugerido 0/i)).toHaveValue('2026-08-03');
    expect(screen.getByLabelText(/matter sugerido 0/i)).toHaveValue('Sin número / Cliente potencial');
    expect(screen.getByLabelText(/task sugerido 0/i)).toHaveValue('Llamada con cliente');
    expect(screen.getByLabelText(/detalle sugerido 0/i)).toHaveValue('Detalle editado');
    expect(screen.getByLabelText(/tiempo sugerido 0/i)).toHaveValue('25 min');
  });

  test('paste mode: a candidate with no matter cannot be confirmed', async () => {
    renderHome();
    const user = userEvent.setup();
    await analyze(user, 'Reviewed filing. July 21. 10 min');
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(/falta la fecha o el matter/i);

    await user.click(screen.getByLabelText(/matter sugerido 0/i));
    await user.click(screen.getByRole('option', { name: /sin número/i }));
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeEnabled();
  });

  test('paste mode: a candidate with no date cannot be confirmed', async () => {
    renderHome();
    const user = userEvent.setup();
    await analyze(user, 'Reviewed filing, no date here');
    await user.click(screen.getByLabelText(/matter sugerido 0/i));
    await user.click(screen.getByRole('option', { name: /sin número/i }));
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/fecha sugerido 0/i), { target: { value: '2026-08-03' } });
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeEnabled();
  });
});
