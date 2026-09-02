import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { toISODate } from '../lib/dateUtils.js';
import { loadCustomTemplate } from '../lib/storage.js';
import { exportDocketToFile } from '../lib/docxExport.js';
import { DayPicker } from '../components/DayPicker.jsx';
import { DocketPreview } from '../components/DocketPreview.jsx';

const FIRM_NAME = 'Carus Law';

function buildFilename(selectedDates) {
  const sorted = [...selectedDates].sort();
  if (sorted.length === 1) return `docket-${sorted[0]}.docx`;
  return `docket-${sorted[0]}_a_${sorted[sorted.length - 1]}.docx`;
}

export function Export() {
  const { entries, matters } = useData();
  const now = new Date();
  const [selectedDates, setSelectedDates] = useState([toISODate(now)]);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const confirmed = entries.filter((e) => e.status === 'confirmed');
  const entryDates = [...new Set(confirmed.map((e) => e.date))];
  const selectedSet = new Set(selectedDates);
  const selectedEntries = confirmed
    .filter((e) => selectedSet.has(e.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const dayCount = selectedDates.length;
  const entryCount = selectedEntries.length;
  const customTemplate = loadCustomTemplate();

  async function handleExport() {
    setStatus('generating');
    setErrorMessage('');
    try {
      await exportDocketToFile({
        firmName: FIRM_NAME,
        entries: selectedEntries,
        matters,
        filename: buildFilename(selectedDates),
        templateArrayBuffer: customTemplate?.arrayBuffer,
      });
      setStatus('done');
    } catch (error) {
      // Reset out of "generating" so the button can simply be pressed again.
      setStatus('idle');
      setErrorMessage('Error al generar el docket: ' + (error?.message || 'Error desconocido'));
    }
  }

  return (
    <div className="screen">
      <h1 className="screen__title">Exportar</h1>
      <p className="muted">
        Elige los días que quieres exportar. Puedes cambiar de mes y combinar días de meses distintos:
        todo lo seleccionado sale junto, en una sola tabla y un solo documento. Por defecto se
        selecciona hoy, así no vuelves a mandar lo que ya enviaste.
      </p>
      <DayPicker
        selectedDates={selectedDates}
        onChange={setSelectedDates}
        entryDates={entryDates}
        initialMonth={{ year: now.getFullYear(), month: now.getMonth() }}
      />
      <div className="card">
        <p className="muted num">
          {entryCount} {entryCount === 1 ? 'entrada confirmada' : 'entradas confirmadas'} en{' '}
          {dayCount} {dayCount === 1 ? 'día seleccionado' : 'días seleccionados'}.
        </p>
        <div className="btn-row">
          <button className="btn btn--primary" onClick={handleExport} disabled={entryCount === 0}>
            Generar docket (.docx)
          </button>
        </div>
        {customTemplate && (
          <p className="muted">Usando plantilla personalizada: {customTemplate.name}</p>
        )}
        {status === 'generating' && <p className="note">Generando el .docx...</p>}
        {status === 'done' && <p className="note">Listo, descarga del .docx iniciada.</p>}
      </div>
      {errorMessage && (
        <p className="alert alert--card" role="alert">
          {errorMessage}
        </p>
      )}

      <h2 className="section-title">Vista previa</h2>
      <DocketPreview entries={selectedEntries} matters={matters} firmName={FIRM_NAME} />
    </div>
  );
}
