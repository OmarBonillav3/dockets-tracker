import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { isInMonth } from '../lib/dateUtils.js';
import { exportDocketToFile } from '../lib/docxExport.js';
import { exportDocketToPdf } from '../lib/pdfExport.js';
import { MonthPicker } from '../components/MonthPicker.jsx';
import { DocketPreview } from '../components/DocketPreview.jsx';

const FIRM_NAME = 'Carus Law';

export function Export() {
  const { entries, matters } = useData();
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const { year, month } = period;
  const [docxStatus, setDocxStatus] = useState('idle');
  const [docxError, setDocxError] = useState('');
  const [pdfStatus, setPdfStatus] = useState('idle');
  const [pdfError, setPdfError] = useState('');

  const monthEntries = entries.filter((e) => isInMonth(e.date, year, month) && e.status === 'confirmed');
  const filenameBase = `docket-${year}-${String(month + 1).padStart(2, '0')}`;

  async function handleExportDocx() {
    setDocxStatus('generating');
    setDocxError('');
    try {
      await exportDocketToFile({
        firmName: FIRM_NAME,
        entries: monthEntries,
        matters,
        filename: `${filenameBase}.docx`,
      });
      setDocxStatus('done');
    } catch (error) {
      // Reset out of "generating" so the button can simply be pressed again.
      setDocxStatus('idle');
      setDocxError('Error al generar el docket: ' + (error?.message || 'Error desconocido'));
    }
  }

  async function handleExportPdf() {
    setPdfStatus('generating');
    setPdfError('');
    try {
      await exportDocketToPdf({
        firmName: FIRM_NAME,
        entries: monthEntries,
        matters,
        filename: `${filenameBase}.pdf`,
      });
      setPdfStatus('done');
    } catch (error) {
      setPdfStatus('idle');
      setPdfError('Error al generar el PDF: ' + (error?.message || 'Error desconocido'));
    }
  }

  return (
    <div className="screen">
      <h1 className="screen__title">Exportar</h1>
      <MonthPicker year={year} month={month} onChange={setPeriod} />
      <div className="card">
        <p className="muted num">{monthEntries.length} entradas confirmadas listas para exportar.</p>
        <div className="btn-row">
          <button className="btn btn--primary" onClick={handleExportDocx}>
            Generar docket (.docx)
          </button>
          <button className="btn btn--primary" onClick={handleExportPdf}>
            Generar docket (.pdf)
          </button>
        </div>
        {docxStatus === 'generating' && <p className="note">Generando el .docx...</p>}
        {docxStatus === 'done' && <p className="note">Listo, descarga del .docx iniciada.</p>}
        {pdfStatus === 'generating' && <p className="note">Generando el .pdf...</p>}
        {pdfStatus === 'done' && <p className="note">Listo, descarga del .pdf iniciada.</p>}
      </div>
      {docxError && (
        <p className="alert alert--card" role="alert">
          {docxError}
        </p>
      )}
      {pdfError && (
        <p className="alert alert--card" role="alert">
          {pdfError}
        </p>
      )}

      <h2 className="section-title">Vista previa</h2>
      <DocketPreview entries={monthEntries} matters={matters} firmName={FIRM_NAME} />
    </div>
  );
}
