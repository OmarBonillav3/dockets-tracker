import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { isInMonth } from '../lib/dateUtils.js';
import { exportDocketToFile } from '../lib/docxExport.js';
import { MonthPicker } from '../components/MonthPicker.jsx';
import { DocketPreview } from '../components/DocketPreview.jsx';

const FIRM_NAME = 'Carus Law';

export function Export() {
  const { entries, matters } = useData();
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const { year, month } = period;
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const monthEntries = entries.filter((e) => isInMonth(e.date, year, month) && e.status === 'confirmed');

  async function handleExport() {
    setStatus('generating');
    setErrorMessage('');
    try {
      await exportDocketToFile({
        firmName: FIRM_NAME,
        entries: monthEntries,
        matters,
        filename: `docket-${year}-${String(month + 1).padStart(2, '0')}.docx`,
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
      <MonthPicker year={year} month={month} onChange={setPeriod} />
      <div className="card">
        <p className="muted num">{monthEntries.length} entradas confirmadas listas para exportar.</p>
        <div className="btn-row">
          <button className="btn btn--primary" onClick={handleExport}>
            Generar docket (.docx)
          </button>
        </div>
        {status === 'generating' && <p className="note">Generando el .docx...</p>}
        {status === 'done' && <p className="note">Listo, descarga del .docx iniciada.</p>}
      </div>
      {errorMessage && (
        <p className="alert alert--card" role="alert">
          {errorMessage}
        </p>
      )}

      <h2 className="section-title">Vista previa</h2>
      <DocketPreview entries={monthEntries} matters={matters} firmName={FIRM_NAME} />
    </div>
  );
}
