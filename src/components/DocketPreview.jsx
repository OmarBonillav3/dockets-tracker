import { entriesToRows } from '../lib/docxExport.js';

const HEADERS = ['Matter name', 'Date', 'Task', 'Detail Description', 'Time Spent', 'Cost Associated'];

export function DocketPreview({ entries, matters, firmName = 'Carus Law', logoUrl = '/carus-law-logo.png' }) {
  const rows = entriesToRows(entries, matters);

  return (
    <div className="card docket-preview">
      <div className="docket-preview__header">
        <img src={logoUrl} alt="" className="docket-preview__logo" />
        <span className="eyebrow">{firmName}</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {HEADERS.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={HEADERS.length} className="empty">
                  No hay entradas confirmadas para este mes todavía.
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
