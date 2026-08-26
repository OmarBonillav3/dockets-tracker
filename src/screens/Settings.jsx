import { exportBackup, importBackup } from '../lib/storage.js';

export function Settings() {
  function handleExportBackup() {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dockets-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importBackup(reader.result);
      window.location.reload();
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <h1>Configuración</h1>
      <button onClick={handleExportBackup}>Exportar respaldo (JSON)</button>
      <input type="file" accept="application/json" onChange={handleImportBackup} aria-label="Importar respaldo" />
    </div>
  );
}
