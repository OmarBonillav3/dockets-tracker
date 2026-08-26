import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataProvider } from '../context/DataContext.jsx';
import { Export } from './Export.jsx';
import * as docxExport from '../lib/docxExport.js';

const now = new Date();
const y = now.getFullYear();
const m = String(now.getMonth() + 1).padStart(2, '0');

function entry(overrides) {
  return {
    id: 'e',
    matterId: 'm1',
    date: `${y}-${m}-01`,
    task: 't',
    detailDescription: '',
    timeSpent: '1 hr',
    costAssociated: '50',
    status: 'confirmed',
    createdAt: '',
    ...overrides,
  };
}

function seed(entries) {
  localStorage.setItem('dockets:entries', JSON.stringify(entries));
}

function renderExport() {
  return render(
    <DataProvider>
      <Export />
    </DataProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Export', () => {
  test('clicking the export button calls exportDocketToFile and shows a done message', async () => {
    const spy = vi.spyOn(docxExport, 'exportDocketToFile').mockResolvedValue(undefined);
    renderExport();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /generar docket \(\.docx\)/i }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ firmName: 'Carus Law' }));
    expect(await screen.findByText(/listo, descarga del \.docx iniciada/i)).toBeInTheDocument();
  });

  test('shows how many confirmed entries will be exported for the selected month', () => {
    seed([
      entry({ id: 'e1' }),
      entry({ id: 'e2' }),
      entry({ id: 'e3', status: 'draft' }),
      entry({ id: 'e4', date: '2020-01-05' }),
    ]);
    renderExport();
    expect(screen.getByText(/2 entradas confirmadas listas para exportar/i)).toBeInTheDocument();
  });

  test('the month picker changes which month is counted and exported', async () => {
    const spy = vi.spyOn(docxExport, 'exportDocketToFile').mockResolvedValue(undefined);
    seed([entry({ id: 'e1' }), entry({ id: 'e2', date: '2026-01-09' })]);
    renderExport();
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/^año$/i), '2026');
    await user.selectOptions(screen.getByLabelText(/^mes$/i), '0');
    expect(screen.getByText(/1 entradas confirmadas listas para exportar/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generar docket \(\.docx\)/i }));
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'docket-2026-01.docx',
        entries: [expect.objectContaining({ id: 'e2' })],
      })
    );
  });

  test('a failing export shows a Spanish error and lets the user retry', async () => {
    const spy = vi
      .spyOn(docxExport, 'exportDocketToFile')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(undefined);
    renderExport();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /generar docket \(\.docx\)/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/error al generar el docket/i);
    expect(screen.queryByText(/generando el \.docx/i)).not.toBeInTheDocument();

    // retry succeeds and clears the error
    await user.click(screen.getByRole('button', { name: /generar docket \(\.docx\)/i }));
    expect(await screen.findByText(/listo, descarga del \.docx iniciada/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('renders a live preview table matching the confirmed entries for the selected month', () => {
    seed([
      entry({ id: 'e1', matterId: 'm1', task: 'Revisado contrato' }),
      entry({ id: 'e2', status: 'draft', task: 'No debe aparecer' }),
    ]);
    localStorage.setItem(
      'dockets:matters',
      JSON.stringify([{ id: 'm1', name: 'Test Matter', caseNumber: '001', rate: 50, isPotentialClient: false }])
    );
    renderExport();
    expect(screen.getByText('Revisado contrato')).toBeInTheDocument();
    expect(screen.queryByText('No debe aparecer')).not.toBeInTheDocument();
  });

  test('the preview shows an empty-state message when there are no confirmed entries', () => {
    renderExport();
    expect(screen.getByText(/no hay entradas confirmadas para este mes todavía/i)).toBeInTheDocument();
  });
});
