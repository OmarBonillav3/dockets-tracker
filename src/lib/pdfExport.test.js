import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildDocketPdfBlob, exportDocketToPdf, fetchImageAsDataUrl } from './pdfExport.js';

const matters = [{ id: 'm1', name: 'Gabriel Gonzalez Ocampo - Immigration', caseNumber: '0024-002', rate: 100, isPotentialClient: false }];

const entries = [
  { id: 'e1', matterId: 'm1', date: '2026-07-21', task: 'Sent translated docs', detailDescription: 'Sent translated birth certificate', timeSpent: '10 min', costAssociated: '25', status: 'confirmed', createdAt: '' },
  { id: 'e2', matterId: 'm1', date: '2026-07-22', task: 'Draft note', detailDescription: 'Not ready yet', timeSpent: '5 min', costAssociated: '', status: 'draft', createdAt: '' },
];

describe('buildDocketPdfBlob', () => {
  test('builds a non-empty PDF blob without a logo', () => {
    const blob = buildDocketPdfBlob({ firmName: 'Carus Law', entries, matters, logoDataUrl: null });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  test('builds a non-empty PDF blob with a logo data URL', () => {
    // 1x1 transparent PNG, just to exercise the addImage code path
    const tinyPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const blob = buildDocketPdfBlob({ firmName: 'Carus Law', entries, matters, logoDataUrl: tinyPng });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('fetchImageAsDataUrl', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  test('converts a fetched image into a base64 data URL', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71]); // PNG magic bytes, doesn't need to be a full valid image here
    global.fetch = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(bytes.buffer) });
    const dataUrl = await fetchImageAsDataUrl('/carus-law-logo.png');
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  test('throws a Spanish error when the image fails to load', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    await expect(fetchImageAsDataUrl('/missing.png')).rejects.toThrow(/no se pudo cargar el logo/i);
  });
});

describe('exportDocketToPdf', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  test('still exports successfully when the logo fails to load', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await exportDocketToPdf({ firmName: 'Carus Law', entries, matters, filename: 'docket-2026-07.pdf' });

    expect(clickSpy).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
