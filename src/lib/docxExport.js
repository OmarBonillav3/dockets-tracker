import { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun } from 'docx';

const HEADERS = ['Matter name', 'Date', 'Task', 'Detail Description', 'Time Spent', 'Cost Associated'];

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

function textCell(text) {
  return new TableCell({ children: [new Paragraph(String(text ?? ''))] });
}

function buildTable(rows) {
  const headerRow = new TableRow({ children: HEADERS.map((h) => textCell(h)) });
  const dataRows = rows.map((row) => new TableRow({ children: row.map((cell) => textCell(cell)) }));
  return new Table({ rows: [headerRow, ...dataRows] });
}

export function buildDocketDocument({ firmName, entries, matters }) {
  const rows = entriesToRows(entries, matters);
  return new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: firmName, bold: true, size: 32 })] }),
          buildTable(rows),
        ],
      },
    ],
  });
}

export async function exportDocketToFile({ firmName, entries, matters, filename }) {
  const doc = buildDocketDocument({ firmName, entries, matters });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
