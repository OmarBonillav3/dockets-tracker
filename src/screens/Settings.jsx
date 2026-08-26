import { useState } from 'react';
import { exportBackup, importBackup } from '../lib/storage.js';

export function Settings() {
  const [errorMessage, setErrorMessage] = useState('');

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

  function handleImportBackup(e) {
    setErrorMessage('');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importBackup(reader.result);
        window.location.reload();
      } catch (error) {
        setErrorMessage('Error al importar el respaldo: ' + (error.message || 'Error desconocido'));
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo: ' + (reader.error?.message || 'Error desconocido'));
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <h1>Configuración</h1>
      <button onClick={handleExportBackup}>Exportar respaldo (JSON)</button>
      <input type="file" accept="application/json" onChange={handleImportBackup} aria-label="Importar respaldo" />
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </div>
  );
}
