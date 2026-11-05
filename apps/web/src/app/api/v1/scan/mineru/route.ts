import { NextRequest, NextResponse } from 'next/server';
import type { MinerUScanResult } from '@babilon/shared-types';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { extractText, getDocumentProxy } from 'unpdf';
import {
  buildPaginasFromMiddleJson,
  buildPaginasFromPageTexts,
  type BuiltBookPage,
  validatePaginasCoverage,
} from '@/lib/buildPaginasFromMiddleJson';
import { cleanAndFilterBookPages } from '@/lib/bookPageCleaner';
import { processMinerUOutput } from '@/lib/mineruParser';
import { formatPagesToDocument } from '@/lib/pageSplitter';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface PythonExtractionResult {
  middleJson?: unknown;
  pages?: Array<{ pageNumber: number; markdown: string }>;
  title?: string;
  author?: string;
  pageCount?: number;
  engine?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function extractWithUnpdf(doc: Awaited<ReturnType<typeof getDocumentProxy>>) {
  const metadata = await doc.getMetadata();
  const info = metadata?.info as Record<string, unknown> | undefined;
  const { totalPages, text } = await extractText(doc, { mergePages: false });

  if (!Array.isArray(text) || text.length !== totalPages) {
    throw new Error(
      `unpdf devolvió ${Array.isArray(text) ? text.length : 0} páginas de texto para un PDF de ${totalPages} páginas.`
    );
  }

  const paginas = buildPaginasFromPageTexts(
    text.map((pageText, index) => ({ pageNumber: index + 1, text: pageText })),
    totalPages
  );
  const referenceWordCount = (Array.isArray(text) ? text : []).reduce(
    (sum, pageText) => sum + pageText.trim().split(/\s+/u).filter(Boolean).length,
    0
  );
  const validation = validatePaginasCoverage(paginas, totalPages, referenceWordCount);

  return {
    paginas,
    title: typeof info?.Title === 'string' ? info.Title.trim() : '',
    author: typeof info?.Author === 'string' ? info.Author.trim() : '',
    warnings: validation.warnings,
  };
}

async function tryExtractWithPython(
  scriptPath: string,
  filePath: string,
  outputDir: string
): Promise<PythonExtractionResult | null> {
  return new Promise((resolve) => {
    try {
      const pyProcess = spawn('python', [scriptPath, filePath, outputDir]);
      let stdout = '';
      let stderr = '';

      pyProcess.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      pyProcess.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      pyProcess.on('error', (error) => {
        console.warn('Python no disponible en este entorno:', error.message);
        resolve(null);
      });

      pyProcess.on('close', (code) => {
        if (code !== 0 || !stdout.trim()) {
          if (stderr.trim()) console.warn('Falló el extractor Python:', stderr.trim());
          resolve(null);
          return;
        }

        try {
          const result: unknown = JSON.parse(stdout);
          if (!isRecord(result) || typeof result.error === 'string') {
            console.warn(
              'El extractor Python devolvió un resultado inválido:',
              isRecord(result) ? result.error : 'formato desconocido'
            );
            resolve(null);
            return;
          }

          const pages = Array.isArray(result.pages)
            ? result.pages.flatMap((page): Array<{ pageNumber: number; markdown: string }> => {
                if (
                  !isRecord(page) ||
                  typeof page.pageNumber !== 'number' ||
                  typeof page.markdown !== 'string'
                ) {
                  return [];
                }
                return [{ pageNumber: page.pageNumber, markdown: page.markdown }];
              })
            : undefined;

          resolve({
            middleJson: result.middleJson,
            pages,
            title: typeof result.title === 'string' ? result.title : undefined,
            author: typeof result.author === 'string' ? result.author : undefined,
            pageCount: typeof result.pageCount === 'number' ? result.pageCount : undefined,
            engine: typeof result.engine === 'string' ? result.engine : undefined,
          });
        } catch {
          console.warn('No se pudo interpretar la respuesta JSON del extractor Python.');
          resolve(null);
        }
      });
    } catch (error) {
      console.warn('No se pudo iniciar el extractor Python:', error);
      resolve(null);
    }
  });
}

function makeScanResult(
  rawPaginas: BuiltBookPage[],
  filename: string,
  metadata: Record<string, unknown> | undefined,
  startTime: number,
  warnings: string[] = []
): MinerUScanResult {
  const fullMarkdown = formatPagesToDocument(rawPaginas);
  const parsed = processMinerUOutput({
    markdown: fullMarkdown,
    filename,
    metadata,
    processingTimeMs: Date.now() - startTime,
  });
  if (!parsed.metadata) {
    throw new Error('El parser de MinerU no generó los metadatos de extracción esperados.');
  }

  const titleHint = (parsed.suggestedTitle || (typeof metadata?.title === 'string' ? metadata.title : undefined))?.trim();
  const authorHint = (parsed.suggestedAuthor || (typeof metadata?.author === 'string' ? metadata.author : undefined))?.trim();

  // Omitir preliminares (portada, índice, créditos, guía del lector) y folios impresos
  const paginas = cleanAndFilterBookPages(rawPaginas, {
    title: titleHint,
    author: authorHint,
  });

  const omittedCount = rawPaginas.length - paginas.length;
  if (omittedCount > 0) {
    warnings.push(
      `Se omitieron ${omittedCount} páginas preliminares (portada, índice y créditos). La lectura comienza en el inicio del libro.`
    );
  }

  const cleanMarkdown = formatPagesToDocument(paginas);

  return {
    ...parsed,
    rawMarkdown: cleanMarkdown,
    paginas,
    pages: paginas.map(({ numero, texto }) => ({ pageNumber: numero, markdown: texto })),
    pageCount: paginas.length,
    metadata: {
      ...parsed.metadata,
      pageCountEstimate: paginas.length,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'No se ha proporcionado ningún archivo para procesar.' },
        { status: 400 }
      );
    }

    const filename = file.name || 'documento.pdf';
    const isPdf = file.type === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return NextResponse.json(
        { success: false, message: 'MinerU requiere un archivo en formato PDF.' },
        { status: 400 }
      );
    }

    const uint8Array = new Uint8Array(await file.arrayBuffer());
    const pdfDocument = await getDocumentProxy(uint8Array);
    const expectedPageCount = pdfDocument.numPages;
    if (!Number.isInteger(expectedPageCount) || expectedPageCount < 1) {
      throw new Error('No se pudo determinar la cantidad de páginas físicas del PDF.');
    }

    const warnings: string[] = [];
    const mineruServiceUrl = process.env.MINERU_API_URL?.replace(/\/+$/, '');
    const mineruApiKey = process.env.MINERU_API_KEY;
    const isLocalhost =
      mineruServiceUrl?.includes('localhost') || mineruServiceUrl?.includes('127.0.0.1');
    const isCloud = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

    if (mineruServiceUrl && !(isCloud && isLocalhost)) {
      const forwardFormData = new FormData();
      forwardFormData.append('file', file, filename);
      forwardFormData.append('format', 'middle_json');
      forwardFormData.append('pages', 'all');

      const headers: Record<string, string> = {};
      if (mineruApiKey) headers.Authorization = `Bearer ${mineruApiKey}`;

      try {
        const response = await fetch(`${mineruServiceUrl}/api/v1/extract`, {
          method: 'POST',
          headers,
          body: forwardFormData,
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const remoteData: unknown = await response.json();
          const remotePayload =
            isRecord(remoteData) && isRecord(remoteData.data) ? remoteData.data : remoteData;

          if (isRecord(remotePayload)) {
            const middleJson =
              remotePayload.middle_json ??
              remotePayload.middleJson ??
              (Array.isArray(remotePayload.pages) ? remotePayload : undefined);
            if (middleJson !== undefined) {
              try {
                const paginas = buildPaginasFromMiddleJson(middleJson, expectedPageCount);
                const metadata = isRecord(remotePayload.metadata)
                  ? remotePayload.metadata
                  : undefined;
                const validation = validatePaginasCoverage(
                  paginas,
                  expectedPageCount,
                  paginas.reduce((sum, page) => sum + page.conteo_palabras, 0)
                );
                warnings.push(...validation.warnings);
                const scanData = makeScanResult(paginas, filename, metadata, startTime, warnings);
                return NextResponse.json({
                  success: true,
                  data: scanData,
                  engine: 'mineru-remote-middle-json',
                  stats: {
                    totalPages: expectedPageCount,
                    extractedSections: scanData.paginas?.length ?? 0,
                  },
                });
              } catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                warnings.push(`El resultado remoto de MinerU no pudo validarse: ${detail}`);
              }
            } else {
              warnings.push(
                'MinerU remoto no devolvió middle_json; se continuará con extracción local por página.'
              );
            }
          } else {
            warnings.push('MinerU remoto devolvió una respuesta con formato inválido.');
          }
        } else {
          warnings.push(`MinerU remoto respondió con HTTP ${response.status}.`);
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        warnings.push(`No se pudo usar MinerU remoto: ${detail}`);
      }
    }

    const scriptPath = path.join(process.cwd(), 'src', 'lib', 'pdf_extractor.py');
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'babilon-mineru-'));
    let pythonResult: PythonExtractionResult | null = null;

    try {
      const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const tempFilePath = path.join(tempDir, safeFilename || 'documento.pdf');
      const outputDir = path.join(tempDir, 'mineru-output');
      await fs.writeFile(tempFilePath, Buffer.from(uint8Array));
      pythonResult = await tryExtractWithPython(scriptPath, tempFilePath, outputDir);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }

    if (!pythonResult) {
      warnings.push(
        'No se pudo ejecutar una extracción local estructurada; unpdf conservará las páginas físicas, pero no aplica OCR.'
      );
    } else if (pythonResult.engine === 'pymupdf-page-text') {
      warnings.push('Se usó PyMuPDF sin OCR; las páginas escaneadas pueden quedar sin texto.');
    }

    if (pythonResult?.middleJson !== undefined) {
      try {
        const paginas = buildPaginasFromMiddleJson(
          pythonResult.middleJson,
          expectedPageCount
        );
        const validation = validatePaginasCoverage(
          paginas,
          expectedPageCount,
          paginas.reduce((sum, page) => sum + page.conteo_palabras, 0)
        );
        warnings.push(...validation.warnings);
        const scanData = makeScanResult(
          paginas,
          filename,
          { title: pythonResult.title, author: pythonResult.author },
          startTime,
          warnings
        );
        return NextResponse.json({
          success: true,
          data: scanData,
          engine: pythonResult.engine || 'mineru-local-middle-json',
          stats: {
            totalPages: expectedPageCount,
            extractedSections: scanData.paginas?.length ?? 0,
          },
        });
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        warnings.push(`El middle_json local de MinerU no pudo validarse: ${detail}`);
      }
    }

    if (pythonResult?.pages) {
      try {
        if (pythonResult.pageCount !== expectedPageCount) {
          throw new Error(
            `El extractor Python reportó ${pythonResult.pageCount ?? 0} páginas; se esperaban ${expectedPageCount}.`
          );
        }
        const paginas = buildPaginasFromPageTexts(
          pythonResult.pages.map(({ pageNumber, markdown }) => ({
            pageNumber,
            text: markdown,
          })),
          expectedPageCount
        );
        const validation = validatePaginasCoverage(
          paginas,
          expectedPageCount,
          paginas.reduce((sum, page) => sum + page.conteo_palabras, 0)
        );
        warnings.push(...validation.warnings);
        const scanData = makeScanResult(
          paginas,
          filename,
          { title: pythonResult.title, author: pythonResult.author },
          startTime,
          warnings
        );
        return NextResponse.json({
          success: true,
          data: scanData,
          engine: pythonResult.engine || 'mineru-local-python',
          stats: {
            totalPages: expectedPageCount,
            extractedSections: scanData.paginas?.length ?? 0,
          },
        });
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        warnings.push(`La extracción Python no conservó la paginación: ${detail}`);
      }
    }

    const unpdfResult = await extractWithUnpdf(pdfDocument);
    const validation = validatePaginasCoverage(
      unpdfResult.paginas,
      expectedPageCount,
      unpdfResult.paginas.reduce((sum, page) => sum + page.conteo_palabras, 0)
    );
    warnings.push(...validation.warnings);
    const scanData = makeScanResult(
      unpdfResult.paginas,
      filename,
      { title: unpdfResult.title, author: unpdfResult.author },
      startTime,
      warnings
    );
    return NextResponse.json({
      success: true,
      data: scanData,
      engine: 'babilon-native-engine',
      stats: {
        totalPages: expectedPageCount,
        extractedSections: scanData.paginas?.length ?? 0,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en /api/v1/scan/mineru:', error);
    return NextResponse.json(
      { success: false, message: `Error al procesar el PDF: ${errorMsg}` },
      { status: 422 }
    );
  }
}
