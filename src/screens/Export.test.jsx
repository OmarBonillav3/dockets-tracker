import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataProvider } from '../context/DataContext.jsx';
import { Export } from './Export.jsx';
import * as docxExport from '../lib/docxExport.js';

beforeEach(() => {
  localStorage.clear();
});

test('clicking the export button calls exportDocketToFile and shows a done message', async () => {
  const spy = vi.spyOn(docxExport, 'exportDocketToFile').mockResolvedValue(undefined);
  render(
    <DataProvider>
      <Export />
    </DataProvider>
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /generar docket/i }));
  expect(spy).toHaveBeenCalledWith(expect.objectContaining({ firmName: 'Carus Law' }));
  expect(await screen.findByText(/listo, descarga iniciada/i)).toBeInTheDocument();
});
