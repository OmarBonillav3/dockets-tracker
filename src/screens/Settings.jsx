import { useState } from 'react';
import { exportBackup, importBackup } from '../lib/storage.js';

export function Settings() {
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingFile, setPendingFile] = useState(null);

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
    </div>
  );
}
