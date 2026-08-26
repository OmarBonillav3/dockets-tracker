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

  test('importing a backup file calls importBackup with its contents', async () => {
    const spy = vi.spyOn(storage, 'importBackup').mockImplementation(() => {});
    Object.defineProperty(window, 'location', { value: { reload: vi.fn() }, writable: true });
    render(<Settings />);
    const file = new File(['{"matters":[],"entries":[]}'], 'backup.json', { type: 'application/json' });
    const input = screen.getByLabelText(/importar respaldo/i);
    await userEvent.upload(input, file);
    await vi.waitFor(() => expect(spy).toHaveBeenCalledWith('{"matters":[],"entries":[]}'));
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
    await vi.waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Error al importar el respaldo:');
    });
    // Verify reload was NOT called
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
