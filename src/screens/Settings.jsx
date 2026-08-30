import { useState } from 'react';
import {
  exportBackup,
  importBackup,
  loadCustomTemplate,
  saveCustomTemplate,
  clearCustomTemplate,
} from '../lib/storage.js';
import { validateDocketTemplate } from '../lib/docxExport.js';

export function Settings() {
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [templateName, setTemplateName] = useState(() => loadCustomTemplate()?.name ?? null);
  const [templateError, setTemplateError] = useState('');
  const [templateNote, setTemplateNote] = useState('');

  function handleExportBackup() {
    try {
      setErrorMessage('');
      const json = exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dockets-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage('Error al exportar el respaldo: ' + (error.message || 'Error desconocido'));
    }
  }

  // Selecting a file only stages it: importing replaces everything, so it needs
  // an explicit second click (no window.confirm - it blocks automated tests).
  function handleFileSelected(e) {
    setErrorMessage('');
    const file = e.target.files[0];
    setPendingFile(file || null);
  }

  function cancelImport() {
    setPendingFile(null);
    setErrorMessage('');
  }

  function handleConfirmImport() {
    if (!pendingFile) return;
    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importBackup(reader.result);
        setPendingFile(null);
        window.location.reload();
      } catch (error) {
        setErrorMessage('Error al importar el respaldo: ' + (error.message || 'Error desconocido'));
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo: ' + (reader.error?.message || 'Error desconocido'));
    };
    reader.readAsText(pendingFile);
  }

  // The template swap is not destructive (there is always a bundled default to
  // reset to), so it applies on selection without a confirm step. It is
  // validated first so a template the exporter cannot fill is never stored.
  function handleTemplateSelected(e) {
    setTemplateError('');
    setTemplateNote('');
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await validateDocketTemplate(reader.result);
        saveCustomTemplate(file.name, reader.result);
        setTemplateName(file.name);
        setTemplateNote('Plantilla guardada. Se usará al exportar el docket.');
      } catch (error) {
        setTemplateError(
          'No se pudo usar esa plantilla: ' + (error.message || 'Error desconocido')
        );
      }
    };
    reader.onerror = () => {
      setTemplateError('Error al leer el archivo: ' + (reader.error?.message || 'Error desconocido'));
    };
    reader.readAsArrayBuffer(file);
  }

  function handleResetTemplate() {
    clearCustomTemplate();
    setTemplateName(null);
    setTemplateError('');
    setTemplateNote('Volviste a la plantilla predeterminada.');
  }

  return (
    <div className="screen">
      <h1 className="screen__title">Configuración</h1>
      <div className="card">
        <div className="btn-row">
          <button className="btn btn--primary" onClick={handleExportBackup}>Exportar respaldo (JSON)</button>
        </div>
        <input className="file-input" type="file" accept="application/json" onChange={handleFileSelected} aria-label="Importar respaldo" />
      </div>
      {pendingFile && (
        <div className="card card--elevated">
          <p className="muted">Archivo seleccionado: {pendingFile.name}</p>
          <p className="alert alert--inline" role="alert">¿Confirmas importar? Esto reemplaza todos tus datos actuales.</p>
          <div className="btn-row btn-row--end">
            <button className="btn btn--ghost" onClick={cancelImport}>Cancelar importación</button>
            <button className="btn btn--primary" onClick={handleConfirmImport}>Confirmar importación</button>
          </div>
        </div>
      )}
      {errorMessage && <p className="alert alert--card" role="alert">{errorMessage}</p>}

      <h2 className="section-title">Plantilla del documento (.docx)</h2>
      <div className="card">
        <p className="muted">
          Sube el archivo Word que quieras usar al exportar. Debe conservar la tabla del docket
          (fila de encabezado + una fila de formato con 6 columnas).
        </p>
        <p className="muted">
          {templateName
            ? `Plantilla actual: ${templateName}`
            : 'Plantilla actual: la predeterminada de la app.'}
        </p>
        <input
          className="file-input"
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleTemplateSelected}
          aria-label="Subir plantilla de Word"
        />
        {templateName && (
          <div className="btn-row btn-row--end">
            <button className="btn btn--ghost" onClick={handleResetTemplate}>
              Usar plantilla predeterminada
            </button>
          </div>
        )}
        {templateNote && <p className="note">{templateNote}</p>}
      </div>
      {templateError && <p className="alert alert--card" role="alert">{templateError}</p>}
    </div>
  );
}
