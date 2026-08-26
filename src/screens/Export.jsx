import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { isInMonth } from '../lib/dateUtils.js';
import { exportDocketToFile } from '../lib/docxExport.js';

export function Export() {
  const { entries, matters } = useData();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth());
  const [status, setStatus] = useState('idle');

  async function handleExport() {
    setStatus('generating');
    const monthEntries = entries.filter((e) => isInMonth(e.date, year, month) && e.status === 'confirmed');
    await exportDocketToFile({
      firmName: 'Carus Law',
      entries: monthEntries,
      matters,
      filename: `docket-${year}-${String(month + 1).padStart(2, '0')}.docx`,
    });
    setStatus('done');
  }

  return (
    <div>
      <h1>Exportar</h1>
      <button onClick={handleExport}>Generar docket (.docx)</button>
      {status === 'generating' && <p>Generando...</p>}
      {status === 'done' && <p>Listo, descarga iniciada.</p>}
    </div>
  );
}
