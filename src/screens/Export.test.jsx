import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataProvider } from '../context/DataContext.jsx';
import { Export } from './Export.jsx';
import { toISODate } from '../lib/dateUtils.js';
import * as docxExport from '../lib/docxExport.js';
import * as storage from '../lib/storage.js';

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const now = new Date();
const TODAY = toISODate(now);
const y = now.getFullYear();
const m = String(now.getMonth() + 1).padStart(2, '0');
const THIS_MONTH_NAME = MONTH_NAMES[now.getMonth()];
// A mid-month day that is never today and never shows up as an adjacent-month
// spill cell in the calendar grid — so tests can click it unambiguously.
const OTHER_DAY = now.getDate() === 15 ? 16 : 15;
const OTHER_DATE = `${y}-${m}-${String(OTHER_DAY).padStart(2, '0')}`;

function entry(overrides) {
  return {
    id: 'e',
    matterId: 'm1',
    date: TODAY,
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
  test('defaults to only today and exports today\'s confirmed entries', async () => {
    const spy = vi.spyOn(docxExport, 'exportDocketToFile').mockResolvedValue(undefined);
    seed([
      entry({ id: 'today-1' }),
      entry({ id: 'today-draft', status: 'draft' }),
      entry({ id: 'other-day', date: '2020-01-05' }),
    ]);
    renderExport();
    const user = userEvent.setup();

    expect(screen.getByText(/1 entrada confirmada .* 1 día/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generar docket \(\.docx\)/i }));
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        firmName: 'Carus Law',
        filename: `docket-${TODAY}.docx`,
        entries: [expect.objectContaining({ id: 'today-1' })],
      })
    );
    expect(await screen.findByText(/listo, descarga del \.docx iniciada/i)).toBeInTheDocument();
  });

  test('the generate button is disabled when the selected days hold no confirmed entries', () => {
    renderExport();
    expect(screen.getByRole('button', { name: /generar docket \(\.docx\)/i })).toBeDisabled();
  });

  test('picking an extra day widens the count, the export, and the filename range', async () => {
    const spy = vi.spyOn(docxExport, 'exportDocketToFile').mockResolvedValue(undefined);
    seed([
      entry({ id: 'today-1' }),
      entry({ id: 'other-1', date: OTHER_DATE }),
    ]);
    renderExport();
    const user = userEvent.setup();

    // The calendar opens on the current month, so the mid-month day is visible.
    await user.click(screen.getByRole('button', { name: `${OTHER_DAY} de ${THIS_MONTH_NAME} de ${y}` }));

    expect(screen.getByText(/2 entradas confirmadas .* 2 días/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generar docket \(\.docx\)/i }));
    const [first, second] = [OTHER_DATE, TODAY].sort();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: `docket-${first}_a_${second}.docx`,
        entries: [
          expect.objectContaining({ id: first === OTHER_DATE ? 'other-1' : 'today-1' }),
          expect.objectContaining({ id: first === OTHER_DATE ? 'today-1' : 'other-1' }),
        ],
      })
    );
  });

  test('a failing export shows a Spanish error and lets the user retry', async () => {
    const spy = vi
      .spyOn(docxExport, 'exportDocketToFile')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(undefined);
    seed([entry({ id: 'today-1' })]);
    renderExport();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /generar docket \(\.docx\)/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/error al generar el docket/i);
    expect(screen.queryByText(/generando el \.docx/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generar docket \(\.docx\)/i }));
    expect(await screen.findByText(/listo, descarga del \.docx iniciada/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('the live preview only shows confirmed entries for the selected days', () => {
    seed([
      entry({ id: 'e1', matterId: 'm1', task: 'Revisado contrato' }),
      entry({ id: 'e2', status: 'draft', task: 'No debe aparecer' }),
      entry({ id: 'e3', date: '2020-01-05', task: 'Otro dia' }),
    ]);
    localStorage.setItem(
      'dockets:matters',
      JSON.stringify([{ id: 'm1', name: 'Test Matter', caseNumber: '001', rate: 50, isPotentialClient: false }])
    );
    renderExport();
    expect(screen.getByText('Revisado contrato')).toBeInTheDocument();
    expect(screen.queryByText('No debe aparecer')).not.toBeInTheDocument();
    expect(screen.queryByText('Otro dia')).not.toBeInTheDocument();
  });

  test('the preview shows an empty-state message when no day with entries is selected', () => {
    renderExport();
    expect(screen.getByText(/no hay entradas confirmadas para los días seleccionados/i)).toBeInTheDocument();
  });

  test('exports with the saved custom template when one exists', async () => {
    const spy = vi.spyOn(docxExport, 'exportDocketToFile').mockResolvedValue(undefined);
    const customBuffer = new ArrayBuffer(16);
    vi.spyOn(storage, 'loadCustomTemplate').mockReturnValue({
      name: 'plantilla-de-la-novia.docx',
      arrayBuffer: customBuffer,
    });
    seed([entry({ id: 'today-1' })]);
    renderExport();
    const user = userEvent.setup();

    expect(screen.getByText(/plantilla personalizada: plantilla-de-la-novia\.docx/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generar docket \(\.docx\)/i }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ templateArrayBuffer: customBuffer }));
  });

  test('exports without a custom template buffer when none is saved', async () => {
    const spy = vi.spyOn(docxExport, 'exportDocketToFile').mockResolvedValue(undefined);
    seed([entry({ id: 'today-1' })]);
    renderExport();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /generar docket \(\.docx\)/i }));
    expect(spy.mock.calls[0][0].templateArrayBuffer).toBeUndefined();
  });
});
