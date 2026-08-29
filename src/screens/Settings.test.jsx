import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings.jsx';
import * as storage from '../lib/storage.js';
import * as docxExport from '../lib/docxExport.js';

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

describe('Settings - custom docket template', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  function docxFile(name = 'plantilla-nueva.docx') {
    return new File(['PK fake docx bytes'], name, {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

  test('uploading a valid .docx validates it, saves it, and shows its name', async () => {
    vi.spyOn(docxExport, 'validateDocketTemplate').mockResolvedValue(undefined);
    const saveSpy = vi.spyOn(storage, 'saveCustomTemplate').mockImplementation(() => {});
    render(<Settings />);

    await userEvent.upload(screen.getByLabelText(/plantilla de word/i), docxFile());

    await vi.waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith('plantilla-nueva.docx', expect.any(ArrayBuffer));
    });
    expect(screen.getByText(/plantilla-nueva\.docx/)).toBeInTheDocument();
  });

  test('uploading a file that fails validation shows the error and does not save', async () => {
    vi.spyOn(docxExport, 'validateDocketTemplate').mockRejectedValue(
      new Error('La plantilla del docket no tiene la tabla esperada.')
    );
    const saveSpy = vi.spyOn(storage, 'saveCustomTemplate').mockImplementation(() => {});
    render(<Settings />);

    await userEvent.upload(screen.getByLabelText(/plantilla de word/i), docxFile('mala.docx'));

    await vi.waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/no tiene la tabla esperada/i);
    });
    expect(saveSpy).not.toHaveBeenCalled();
  });

  test('shows the saved template name and lets the user reset to the default', async () => {
    vi.spyOn(storage, 'loadCustomTemplate').mockReturnValue({
      name: 'plantilla-vieja.docx',
      arrayBuffer: new ArrayBuffer(8),
    });
    const clearSpy = vi.spyOn(storage, 'clearCustomTemplate').mockImplementation(() => {});
    render(<Settings />);

    expect(screen.getByText(/plantilla-vieja\.docx/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /usar plantilla predeterminada/i }));

    expect(clearSpy).toHaveBeenCalled();
    expect(screen.queryByText(/plantilla-vieja\.docx/)).not.toBeInTheDocument();
  });
});
