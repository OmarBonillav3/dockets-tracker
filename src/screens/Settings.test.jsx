import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings.jsx';
import * as storage from '../lib/storage.js';

beforeEach(() => {
  localStorage.clear();
  // Mock URL.createObjectURL and URL.revokeObjectURL for download functionality
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

test('exporting a backup calls exportBackup and triggers a download', async () => {
  const spy = vi.spyOn(storage, 'exportBackup').mockReturnValue('{"matters":[],"entries":[]}');
  render(<Settings />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /exportar respaldo/i }));
  expect(spy).toHaveBeenCalled();
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
