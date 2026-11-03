import { NextRequest, NextResponse } from 'next/server';
import { processMinerUOutput } from '@/lib/mineruParser';
import { extractText, getDocumentProxy } from 'unpdf';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Extrae el texto del PDF con unpdf y genera un Markdown estructurado
 * donde cada página real del PDF se convierte en una sección separada por ---.
 *
 * Estrategia de división:
 * 1. Cada página PDF → una sección `## Página N`.
 * 2. Si el texto de una página contiene encabezados H1/H2 claros de capítulo
 *    (e.g. "# Capítulo 1", "## Introducción"), esos se preservan como divisores
 *    de capítulo adicionalmente.
 * 3. Las páginas vacías o con menos de 30 chars se fusionan con la siguiente.
 */
async function extractWithUnpdf(uint8Array: Uint8Array) {
  const doc = await getDocumentProxy(uint8Array);
  const metadata = await doc.getMetadata();
  const info = metadata?.info as Record<string, unknown> | undefined;

  const { totalPages, text } = await extractText(doc, { mergePages: false });

  const pages: Array<{ pageNum: number; content: string }> = [];

  if (Array.isArray(text) && text.length > 0) {
    let pendingBuffer = '';
    let pendingNum = 0;

    for (let i = 0; i < text.length; i++) {
      const raw = text[i].trim();

      // Limpiar espacios excesivos / líneas vacías múltiples
      const cleaned = raw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join('\n');

      if (!cleaned || cleaned.length < 30) {
        // Página casi vacía: acumular en buffer
        pendingBuffer += (pendingBuffer ? '\n' : '') + cleaned;
        if (!pendingNum) pendingNum = i + 1;
        continue;
      }

      // Si hay buffer acumulado, prefijarlo a esta página
      const fullContent = pendingBuffer
        ? `${pendingBuffer}\n${cleaned}`
        : cleaned;

      pages.push({
        pageNum: pendingNum || i + 1,
        content: fullContent,
      });

      pendingBuffer = '';
      pendingNum = 0;
    }

    // Volcar buffer restante como última página si tiene contenido
    if (pendingBuffer.trim()) {
      pages.push({
        pageNum: pendingNum || text.length,
        content: pendingBuffer.trim(),
      });
    }
  }

  // Construir Markdown final: cada página como sección separada por ---
  // Esto permite que `submitBook` en el frontend lo divida correctamente
  // haciendo split por /\n\s*---\s*\n/
  const fullMarkdown = pages
    .map(({ pageNum, content }) => {
      // Formatear líneas de la página preservando su estructura
      const lines = content
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const body = lines.join('\n\n');
      return `## Página ${pageNum}\n\n${body}`;
    })
    .join('\n\n---\n\n');

  const title = (info?.Title as string)?.trim() || '';
  const author = (info?.Author as string)?.trim() || '';

  return {
    markdown: fullMarkdown,
    title,
    author,
    pageCount: pages.length || totalPages || 1,
    pages, // Pasamos las páginas directamente para que el parser tenga más contexto
    engine: 'unpdf-serverless',
  };
}

async function tryExtractWithPython(scriptPath: string, filePath: string): Promise<{
  markdown?: string;
  title?: string;
  author?: string;
  pageCount?: number;
  engine?: string;
} | null> {
  return new Promise((resolve) => {
    try {
      const pyProcess = spawn('python', [scriptPath, filePath]);
      let stdout = '';
      let stderr = '';

      pyProcess.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      pyProcess.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      pyProcess.on('error', (err) => {
        console.warn('Python no disponible en este entorno:', err.message);
        resolve(null);
      });

      pyProcess.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            resolve(JSON.parse(stdout));
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    } catch {
      resolve(null);
    }
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
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

    const mineruServiceUrl = process.env.MINERU_API_URL?.replace(/\/+$/, '');
    const mineruApiKey = process.env.MINERU_API_KEY;

    // 1. Servicio MinerU remoto (si no apunta a localhost desde la nube)
    const isLocalhost =
      mineruServiceUrl?.includes('localhost') || mineruServiceUrl?.includes('127.0.0.1');
    const isCloud = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

    if (mineruServiceUrl && !(isCloud && isLocalhost)) {
      const forwardFormData = new FormData();
      forwardFormData.append('file', file, filename);

      const headers: Record<string, string> = {};
      if (mineruApiKey) {
        headers['Authorization'] = `Bearer ${mineruApiKey}`;
      }

      try {
        const response = await fetch(`${mineruServiceUrl}/api/v1/extract`, {
          method: 'POST',
          headers,
          body: forwardFormData,
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const remoteData = await response.json();
          const extractedMarkdown =
            remoteData.markdown ||
            remoteData.text ||
            (Array.isArray(remoteData.pages)
              ? remoteData.pages
                  .map(
                    (p: { markdown?: string; pageNumber?: number }, idx: number) =>
                      `## Página ${p.pageNumber || idx + 1}\n\n${p.markdown || ''}`
                  )
                  .join('\n\n---\n\n')
              : '');

          const parsed = processMinerUOutput({
            markdown: extractedMarkdown,
            filename,
            metadata: remoteData.metadata,
            processingTimeMs: Date.now() - startTime,
          });

          return NextResponse.json({
            success: true,
            data: parsed,
            engine: 'mineru-remote-api',
          });
        }
      } catch (remoteErr) {
        console.warn('MinerU remote endpoint unreachable, using local engine:', remoteErr);
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 2. Intentar extracción con Python (local/dev, no disponible en Vercel)
    const scriptPath = path.join(process.cwd(), 'src', 'lib', 'pdf_extractor.py');
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(
      tempDir,
      `babilon_pdf_${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    );

    let pythonResult: {
      markdown?: string;
      title?: string;
      author?: string;
      pageCount?: number;
      engine?: string;
    } | null = null;

    try {
      await fs.writeFile(tempFilePath, Buffer.from(arrayBuffer));
      pythonResult = await tryExtractWithPython(scriptPath, tempFilePath);
    } catch {
      // Ignorar
    } finally {
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // Ignorar
      }
    }

    if (pythonResult && pythonResult.markdown) {
      const parsed = processMinerUOutput({
        markdown: pythonResult.markdown,
        filename,
        metadata: {
          title: pythonResult.title,
          author: pythonResult.author,
          pageCount: pythonResult.pageCount,
        },
        processingTimeMs: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        data: parsed,
        engine: pythonResult.engine || 'mineru-local-python',
      });
    }

    // 3. Motor nativo serverless: unpdf (100% Node.js, compatible con Vercel)
    try {
      const unpdfResult = await extractWithUnpdf(uint8Array);

      const parsed = processMinerUOutput({
        markdown: unpdfResult.markdown,
        filename,
        metadata: {
          title: unpdfResult.title,
          author: unpdfResult.author,
          pageCount: unpdfResult.pageCount,
        },
        processingTimeMs: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        data: parsed,
        engine: 'babilon-native-engine',
        stats: {
          totalPages: unpdfResult.pageCount,
          extractedSections: unpdfResult.pages?.length || 0,
        },
      });
    } catch (parseErr) {
      console.error('Error en extracción nativa:', parseErr);
      return NextResponse.json(
        {
          success: false,
          message:
            'No se pudo extraer el texto del PDF. Puedes ingresar los datos y el contenido manualmente.',
        },
        { status: 422 }
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error en /api/v1/scan/mineru:', err);
    return NextResponse.json(
      { success: false, message: `Error al procesar el PDF: ${errorMsg}` },
      { status: 500 }
    );
  }
}
