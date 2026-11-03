import { NextRequest, NextResponse } from 'next/server';
import { processMinerUOutput } from '@/lib/mineruParser';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Polyfills para compatibilidad de pdfjs-dist en entornos serverless puros de Node.js (Vercel)
if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {};
}
if (typeof (globalThis as any).ImageData === 'undefined') {
  (globalThis as any).ImageData = class ImageData {};
}
if (typeof (globalThis as any).Path2D === 'undefined') {
  (globalThis as any).Path2D = class Path2D {};
}

export const runtime = 'nodejs';
export const maxDuration = 60;

async function extractWithPdfParse(buffer: Buffer) {
  // Import dinámico para asegurar que los polyfills ya existan en globalThis
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();

    let fullMarkdown = '';
    if (textResult.pages && textResult.pages.length > 0) {
      fullMarkdown = textResult.pages
        .map((p) => {
          const lines = p.text
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
          return `## Página ${p.num}\n\n${lines.join('\n\n')}`;
        })
        .join('\n\n---\n\n');
    } else {
      fullMarkdown = textResult.text || '';
    }

    const title = (infoResult.info?.Title as string) || '';
    const author = (infoResult.info?.Author as string) || '';

    return {
      markdown: fullMarkdown,
      title,
      author,
      pageCount: textResult.total || textResult.pages?.length || 1,
      engine: 'pdf-parse-js',
    };
  } finally {
    try {
      await parser.destroy();
    } catch {
      // Ignorar error al destruir parser
    }
  }
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

      // Manejador crítico: evita que Node lance 'Uncaught Exception' si python no existe (como en Vercel)
      pyProcess.on('error', (err) => {
        console.warn('Python no disponible en este entorno de ejecución:', err.message);
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

    // 1. Si existe un servicio MinerU remoto / microservicio configurado (no localhost en la nube)
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
    const fileBuffer = Buffer.from(arrayBuffer);

    // 2. Intentar extracción con Python solo si está disponible en el entorno
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
      await fs.writeFile(tempFilePath, fileBuffer);
      pythonResult = await tryExtractWithPython(scriptPath, tempFilePath);
    } catch {
      // Ignorar fallo al preparar archivo temporal
    } finally {
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // Ignorar fallo al eliminar temporal
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

    // 3. Motor nativo de extracción en Node.js (100% compatible con Vercel Serverless, sin Python)
    try {
      const jsResult = await extractWithPdfParse(fileBuffer);
      const parsed = processMinerUOutput({
        markdown: jsResult.markdown,
        filename,
        metadata: {
          title: jsResult.title,
          author: jsResult.author,
          pageCount: jsResult.pageCount,
        },
        processingTimeMs: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        data: parsed,
        engine: 'babilon-native-engine',
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
