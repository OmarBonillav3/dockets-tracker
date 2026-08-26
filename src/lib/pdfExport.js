import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { entriesToRows } from './docxExport.js';

const HEADERS = ['Matter name', 'Date', 'Task', 'Detail Description', 'Time Spent', 'Cost Associated'];
const DEFAULT_LOGO_URL = '/carus-law-logo.png';
// Same wine-red accent as the app's visual design (oklch(38% 0.13 20) light mode), as plain RGB for jsPDF.
const ACCENT_RGB = [122, 42, 50];

export async function fetchImageAsDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('No se pudo cargar el logo para el PDF.');
  }
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

export function buildDocketPdfBlob({ firmName, entries, matters, logoDataUrl }) {
  const rows = entriesToRows(entries, matters);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

  const textX = logoDataUrl ? 84 : 40;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 40, 20, 36, 36);
  }
  doc.setFontSize(16);
  doc.text(firmName, textX, 44);

  autoTable(doc, {
    head: [HEADERS],
    body: rows,
    startY: 72,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: ACCENT_RGB, textColor: 255 },
  });

  return doc.output('blob');
}

export async function exportDocketToPdf({ firmName, entries, matters, filename, logoUrl = DEFAULT_LOGO_URL }) {
  let logoDataUrl = null;
  try {
    logoDataUrl = await fetchImageAsDataUrl(logoUrl);
  } catch {
    // Still export without the logo rather than blocking the whole PDF on it.
    logoDataUrl = null;
  }
  const blob = buildDocketPdfBlob({ firmName, entries, matters, logoDataUrl });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
