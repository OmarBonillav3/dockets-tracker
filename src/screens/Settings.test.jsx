import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings.jsx';
import * as storage from '../lib/storage.js';

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock URL.createObjectURL and URL.revokeObjectURL for download functionality
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    // Mock HTMLAnchorElement.prototype.click for download simulation
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  test('exporting a backup calls exportBackup and triggers a download', async () => {
    const spy = vi.spyOn(storage, 'exportBackup').mockReturnValue('{"matters":[],"entries":[]}');
    render(<Settings />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /exportar respaldo/i }));
    expect(spy).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  test('selecting a file does not import until the user confirms', async () => {
    const spy = vi.spyOn(storage, 'importBackup').mockImplementation(() => {});
    Object.defineProperty(window, 'location', { value: { reload: vi.fn() }, writable: true });
    render(<Settings />);
    const file = new File(['{"matters":[],"entries":[]}'], 'backup.json', { type: 'application/json' });
    await userEvent.upload(screen.getByLabelText(/importar respaldo/i), file);

    expect(screen.getByText(/¿confirmas importar\? esto reemplaza todos tus datos actuales\./i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /confirmar importación/i }));
    await vi.waitFor(() => expect(spy).toHaveBeenCalledWith('{"matters":[],"entries":[]}'));
  });

  test('cancelling a staged import discards it without importing', async () => {
    const spy = vi.spyOn(storage, 'importBackup').mockImplementation(() => {});
    render(<Settings />);
    const file = new File(['{"matters":[],"entries":[]}'], 'backup.json', { type: 'application/json' });
    await userEvent.upload(screen.getByLabelText(/importar respaldo/i), file);
    await userEvent.click(screen.getByRole('button', { name: /cancelar importación/i }));

    expect(screen.queryByRole('button', { name: /confirmar importación/i })).not.toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  test('importing a file whose content causes importBackup to throw shows error message', async () => {
    const spy = vi.spyOn(storage, 'importBackup').mockImplementation(() => {
      throw new Error('Backup inválido: se esperaban "matters" y "entries".');
    });
    Object.defineProperty(window, 'location', { value: { reload: vi.fn() }, writable: true });
    render(<Settings />);
    const file = new File(['invalid json'], 'backup.json', { type: 'application/json' });
    const input = screen.getByLabelText(/importar respaldo/i);
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole('button', { name: /confirmar importación/i }));
    await vi.waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(screen.getByText(/Error al importar el respaldo:/)).toBeInTheDocument();
      expect(screen.getAllByRole('alert').some((el) => /Error al importar el respaldo:/.test(el.textContent))).toBe(true);
    });
    // Verify reload was NOT called
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
