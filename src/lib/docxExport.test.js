import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import JSZip from 'jszip';
import { entriesToRows, fillTemplateDocumentXml, buildDocketZipBlob, exportDocketToFile, validateDocketTemplate } from './docxExport.js';

const matters = [{ id: 'm1', name: 'Gabriel Gonzalez Ocampo - Immigration', caseNumber: '0024-002', rate: 100, isPotentialClient: false }];

const entries = [
  { id: 'e1', matterId: 'm1', date: '2026-07-21', task: 'Sent translated docs', detailDescription: 'Sent translated birth certificate', timeSpent: '10 min', costAssociated: '25', status: 'confirmed', createdAt: '' },
  { id: 'e2', matterId: 'm1', date: '2026-07-22', task: 'Draft note', detailDescription: 'Not ready yet', timeSpent: '5 min', costAssociated: '', status: 'draft', createdAt: '' },
  { id: 'e3', matterId: 'm1', date: '2026-07-23', task: 'Called client', detailDescription: 'Follow-up call about hearing', timeSpent: '15 min', costAssociated: '40', status: 'confirmed', createdAt: '' },
];

describe('entriesToRows', () => {
  test('includes only confirmed entries, in column order', () => {
    const rows = entriesToRows(entries, matters);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual([
      '0024-002 - Gabriel Gonzalez Ocampo - Immigration',
      '2026-07-21',
      'Sent translated docs',
      'Sent translated birth certificate',
      '10 min',
      '25',
    ]);
  });
});

const FIXTURE_TEMPLATE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl>
      <w:tr><w:tc><w:p><w:r><w:t>Matter name</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Date</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:p><w:r><w:t>placeholder-matter</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>placeholder-date</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
  </w:body>
</w:document>`;

describe('fillTemplateDocumentXml', () => {
  test('clones the formatting row once per entry, fills its cells, and drops the template row', () => {
    const filled = fillTemplateDocumentXml(FIXTURE_TEMPLATE_XML, [
      ['Matter A', '2026-07-21'],
      ['Matter B', '2026-07-22'],
    ]);

    const parser = new DOMParser();
    const doc = parser.parseFromString(filled, 'application/xml');
    const rows = Array.from(doc.getElementsByTagName('w:tr'));

    // header + 2 data rows, no leftover placeholder row
    expect(rows).toHaveLength(3);
    const rowTexts = rows.map((row) => Array.from(row.getElementsByTagName('w:t')).map((t) => t.textContent));
    expect(rowTexts).toEqual([
      ['Matter name', 'Date'],
      ['Matter A', '2026-07-21'],
      ['Matter B', '2026-07-22'],
    ]);
  });

  test('throws a Spanish error when the template has no table', () => {
    const noTableXml = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>`;
    expect(() => fillTemplateDocumentXml(noTableXml, [])).toThrow(/tabla esperada/i);
  });
});

function loadRealTemplateArrayBuffer() {
  // Returns a Node Buffer rather than a "real" ArrayBuffer: in the jsdom test
  // environment, jsdom's ArrayBuffer lives in a different realm than Node's,
  // so a sliced ArrayBuffer fails JSZip's instanceof checks here. JSZip
  // accepts a Node Buffer directly ("nodebuffer" input), which sidesteps the
  // realm mismatch and is equivalent for these tests' purposes — the real
  // browser code path (fetch().arrayBuffer()) only ever deals with one realm.
  const path = resolve(__dirname, '../../public/docket-template.docx');
  return readFileSync(path);
}

describe('buildDocketZipBlob (real bundled template)', () => {
  test('produces a docx whose document.xml has the header, both confirmed rows, and no draft entry', async () => {
    const templateArrayBuffer = loadRealTemplateArrayBuffer();
    const blob = await buildDocketZipBlob({ entries, matters, templateArrayBuffer });

    const zip = await JSZip.loadAsync(blob);
    const xml = await zip.file('word/document.xml').async('string');

    expect(xml).toContain('0024-002 - Gabriel Gonzalez Ocampo - Immigration');
    expect(xml).toContain('Sent translated docs');
    expect(xml).toContain('Called client');
    expect(xml).not.toContain('Draft note');

    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const rows = Array.from(doc.getElementsByTagName('w:tr'));
    // header + 2 confirmed entries, template placeholder row is gone
    expect(rows).toHaveLength(3);
    expect(xml).not.toContain('placeholder');
  });

  test('preserves the template logo and other parts untouched', async () => {
    const templateArrayBuffer = loadRealTemplateArrayBuffer();
    const blob = await buildDocketZipBlob({ entries, matters, templateArrayBuffer });

    const zip = await JSZip.loadAsync(blob);
    expect(zip.file('word/media/image1.png')).not.toBeNull();
    expect(zip.file('word/header1.xml')).not.toBeNull();
  });

  // Regression guard: an earlier version of the bundled template was produced
  // by round-tripping document.xml through Python's ElementTree, which drops
  // "unused" xmlns declarations from the <w:document> root — but Word's
  // mc:Ignorable attribute still listed those now-undeclared prefixes (w15,
  // w16*, wp14, ...), which is invalid OOXML and made real Word refuse to
  // open the file ("Word found unreadable content"). Every prefix named in
  // mc:Ignorable must have a matching xmlns: declaration on the same element.
  test('every namespace prefix referenced by mc:Ignorable is actually declared', async () => {
    const templateArrayBuffer = loadRealTemplateArrayBuffer();
    const blob = await buildDocketZipBlob({ entries, matters, templateArrayBuffer });

    const zip = await JSZip.loadAsync(blob);
    const xml = await zip.file('word/document.xml').async('string');

    const rootTag = xml.match(/<w:document\b[^>]*>/)[0];
    const declaredPrefixes = new Set(Array.from(rootTag.matchAll(/xmlns:([\w-]+)=/g)).map((m) => m[1]));
    const ignorable = rootTag.match(/mc:Ignorable="([^"]*)"/);
    expect(ignorable).not.toBeNull();
    const ignorablePrefixes = ignorable[1].split(/\s+/).filter(Boolean);
    expect(ignorablePrefixes.length).toBeGreaterThan(0);
    for (const prefix of ignorablePrefixes) {
      expect(declaredPrefixes.has(prefix)).toBe(true);
    }
  });
});

describe('exportDocketToFile', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  test('fetches the template, builds the docx, and triggers a download', async () => {
    const templateArrayBuffer = loadRealTemplateArrayBuffer();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(templateArrayBuffer),
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await exportDocketToFile({ entries, matters, filename: 'docket-2026-07.docx' });

    expect(global.fetch).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}docket-template.docx`);
    expect(clickSpy).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  test('throws a Spanish error when the template fails to load', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    await expect(exportDocketToFile({ entries, matters, filename: 'x.docx' })).rejects.toThrow(
      /no se pudo cargar la plantilla/i
    );
  });

  test('uses a provided template ArrayBuffer instead of fetching', async () => {
    global.fetch = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await exportDocketToFile({
      entries,
      matters,
      filename: 'x.docx',
      templateArrayBuffer: loadRealTemplateArrayBuffer(),
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});

describe('validateDocketTemplate', () => {
  test('resolves for the real bundled template', async () => {
    await expect(validateDocketTemplate(loadRealTemplateArrayBuffer())).resolves.toBeUndefined();
  });

  test('rejects a file that is not a valid .docx (zip)', async () => {
    await expect(validateDocketTemplate(Buffer.from([1, 2, 3, 4, 5]))).rejects.toThrow(/no es un \.docx válido/i);
  });

  test('rejects a .docx whose document.xml has no table', async () => {
    const zip = new JSZip();
    zip.file(
      'word/document.xml',
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>'
    );
    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    await expect(validateDocketTemplate(buf)).rejects.toThrow(/tabla esperada/i);
  });

  test('rejects a .docx that has no word/document.xml at all', async () => {
    const zip = new JSZip();
    zip.file('hello.txt', 'not a word doc');
    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    await expect(validateDocketTemplate(buf)).rejects.toThrow(/document\.xml/i);
  });
});
