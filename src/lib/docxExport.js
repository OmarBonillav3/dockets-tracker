import JSZip from 'jszip';

const DOCUMENT_XML_PATH = 'word/document.xml';
// Absolute root paths break once the app is hosted from a subpath (e.g.
// GitHub Pages serves from https://user.github.io/repo-name/, not the
// domain root) — BASE_URL is Vite's own resolved `base` config, so this
// stays correct wherever the built app actually lives.
const DEFAULT_TEMPLATE_URL = `${import.meta.env.BASE_URL}docket-template.docx`;

export function entriesToRows(entries, matters) {
  const matterById = Object.fromEntries(matters.map((m) => [m.id, m]));
  return entries
    .filter((e) => e.status === 'confirmed')
    .map((e) => {
      const matter = matterById[e.matterId];
      const matterLabel = matter ? [matter.caseNumber, matter.name].filter(Boolean).join(' - ') : '';
      return [matterLabel, e.date, e.task, e.detailDescription, e.timeSpent, e.costAssociated];
    });
}

/**
 * The bundled template (public/docket-template.docx) is Carus Law's real
 * template file, stripped down to its header row plus exactly one
 * formatting-only row: this function clones that second row once per docket
 * entry, filling in its 6 cells in place, so the exported file keeps the
 * template's real fonts, borders and logo untouched.
 */
export function fillTemplateDocumentXml(templateXmlString, rows) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(templateXmlString, 'application/xml');

  const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
  if (parserError) {
    throw new Error('La plantilla del docket no se pudo leer: XML inválido.');
  }

  const table = xmlDoc.getElementsByTagName('w:tbl')[0];
  if (!table) {
    throw new Error('La plantilla del docket no tiene la tabla esperada.');
  }

  const rowNodes = Array.from(table.childNodes).filter((node) => node.nodeName === 'w:tr');
  if (rowNodes.length < 2) {
    throw new Error('La plantilla del docket no tiene la fila de formato esperada.');
  }
  const templateRow = rowNodes[1];

  for (const rowValues of rows) {
    const clone = templateRow.cloneNode(true);
    const cells = Array.from(clone.getElementsByTagName('w:tc'));
    cells.forEach((cell, i) => {
      const textNode = cell.getElementsByTagName('w:t')[0];
      if (textNode) {
        textNode.textContent = String(rowValues[i] ?? '');
      }
    });
    table.insertBefore(clone, templateRow);
  }
  table.removeChild(templateRow);

  return new XMLSerializer().serializeToString(xmlDoc);
}

export async function buildDocketZipBlob({ entries, matters, templateArrayBuffer }) {
  const rows = entriesToRows(entries, matters);
  const zip = await JSZip.loadAsync(templateArrayBuffer);
  const documentXmlFile = zip.file(DOCUMENT_XML_PATH);
  if (!documentXmlFile) {
    throw new Error('La plantilla del docket no contiene word/document.xml.');
  }
  const originalXml = await documentXmlFile.async('string');
  const filledXml = fillTemplateDocumentXml(originalXml, rows);
  zip.file(DOCUMENT_XML_PATH, filledXml);
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export async function exportDocketToFile({ entries, matters, filename, templateUrl = DEFAULT_TEMPLATE_URL }) {
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error('No se pudo cargar la plantilla del docket.');
  }
  const templateArrayBuffer = await response.arrayBuffer();
  const blob = await buildDocketZipBlob({ entries, matters, templateArrayBuffer });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
