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

const WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';

function setCellText(cell, text) {
  const existingText = cell.getElementsByTagName('w:t')[0];
  if (existingText) {
    existingText.setAttributeNS(XML_NAMESPACE, 'xml:space', 'preserve');
    existingText.textContent = text;
    return;
  }

  const paragraph = cell.getElementsByTagName('w:p')[0];
  if (!paragraph) return;

  const doc = paragraph.ownerDocument;
  const run = doc.createElementNS(WORD_NAMESPACE, 'w:r');
  const textNode = doc.createElementNS(WORD_NAMESPACE, 'w:t');
  textNode.setAttributeNS(XML_NAMESPACE, 'xml:space', 'preserve');
  textNode.textContent = text;
  run.appendChild(textNode);
  paragraph.appendChild(run);
}

/**
 * The bundled template (public/docket-template.docx) is Carus Law's real
 * template file, stripped down to its header row plus formatting-only rows:
 * this function clones those rows once per docket entry, filling in their 6
 * cells in place, so the exported file keeps the template's real fonts,
 * borders and logo untouched.
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
  const formatRows = rowNodes.slice(1);

  rows.forEach((rowValues, i) => {
    const clone = formatRows[i % formatRows.length].cloneNode(true);
    const cells = Array.from(clone.getElementsByTagName('w:tc'));
    cells.forEach((cell, column) => {
      setCellText(cell, String(rowValues[column] ?? ''));
    });
    table.insertBefore(clone, formatRows[0]);
  });
  formatRows.forEach((row) => table.removeChild(row));

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

/**
 * Structural check for a user-uploaded template, run at upload time so a
 * broken file is rejected in Settings instead of blowing up at export. Reuses
 * the real fill logic (with zero rows) as the table/format-row check, so the
 * accepted shape is exactly what buildDocketZipBlob can fill.
 */
export async function validateDocketTemplate(templateArrayBuffer) {
  let zip;
  try {
    zip = await JSZip.loadAsync(templateArrayBuffer);
  } catch {
    throw new Error('El archivo no es un .docx válido.');
  }
  const documentXmlFile = zip.file(DOCUMENT_XML_PATH);
  if (!documentXmlFile) {
    throw new Error('La plantilla del docket no contiene word/document.xml.');
  }
  const xml = await documentXmlFile.async('string');
  fillTemplateDocumentXml(xml, []);
}

export async function exportDocketToFile({
  entries,
  matters,
  filename,
  templateUrl = DEFAULT_TEMPLATE_URL,
  templateArrayBuffer,
}) {
  let buffer = templateArrayBuffer;
  if (!buffer) {
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error('No se pudo cargar la plantilla del docket.');
    }
    buffer = await response.arrayBuffer();
  }
  const blob = await buildDocketZipBlob({ entries, matters, templateArrayBuffer: buffer });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
