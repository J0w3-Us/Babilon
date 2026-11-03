import { NextRequest, NextResponse } from 'next/server';
import { processMinerUOutput } from '@/lib/mineruParser';
import { extractText, getDocumentProxy } from 'unpdf';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function extractWithUnpdf(uint8Array: Uint8Array) {
  const doc = await getDocumentProxy(uint8Array);
  const metadata = await doc.getMetadata();
  const info = metadata?.info as Record<string, unknown> | undefined;

  const { totalPages, text } = await extractText(doc, { mergePages: false });

  let fullMarkdown = '';
  if (Array.isArray(text) && text.length > 0) {
    fullMarkdown = text
      .map((pageText, idx) => {
        const lines = pageText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        return `## Página ${idx + 1}\n\n${lines.join('\n\n')}`;
      })
      .join('\n\n---\n\n');
  } else {
    fullMarkdown = Array.isArray(text) ? text.join('\n\n') : String(text || '');
  }

  const title = (info?.Title as string) || '';
  const author = (info?.Author as string) || '';

  return {
    markdown: fullMarkdown,
    title,
    author,
    pageCount: totalPages || (Array.isArray(text) ? text.length : 1),
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

      // Evita que Node lance 'Uncaught Exception' si python no está en el servidor
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

    // 1. Si existe un servicio MinerU remoto configurado (no localhost en la nube)
    const isLocalhost = mineruServiceUrl?.includes('localhost') || mineruServiceUrl?.includes('127.0.0.1');
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
          signal: AbortSignal.timeout(10000), // Timeout de 10s para evitar congelamientos de 120s
        });

        if (response.ok) {
          const remoteData = await response.json();
          const extractedMarkdown =
            remoteData.markdown ||
            remoteData.text ||
            (Array.isArray(remoteData.pages)
              ? remoteData.pages.map((p: { markdown?: string }) => p.markdown || '').join('\n\n---\n\n')
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
        console.warn('MinerU remote endpoint unreachable, attempting local extraction engine:', remoteErr);
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 2. Intentar extracción con Python solo si está disponible en la máquina
    const scriptPath = path.join(process.cwd(), 'src', 'lib', 'pdf_extractor.py');
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `babilon_pdf_${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`);

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
      // Ignorar fallo al preparar temporal
    } finally {
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // Ignorar fallo al limpiar temporal
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

    // 3. Motor nativo de extracción serverless (unpdf, sin dependencias de Python ni canvas)
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
        engine: 'unpdf-serverless',
      });
    } catch (parseErr) {
      console.error('Error en extracción nativa:', parseErr);
      return NextResponse.json(
        {
          success: false,
          message: 'No se pudo extraer el texto del PDF. Puedes ingresar los datos y el contenido manualmente.',
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
