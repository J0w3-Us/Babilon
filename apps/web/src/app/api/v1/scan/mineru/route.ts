import { NextRequest, NextResponse } from 'next/server';
import { processMinerUOutput } from '@/lib/mineruParser';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';
export const maxDuration = 120;

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

    // 1. Si existe un servicio MinerU remoto / microservicio configurado:
    if (mineruServiceUrl) {
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
          });
        }
      } catch (remoteErr) {
        console.warn('MinerU remote endpoint unreachable, attempting local extraction engine:', remoteErr);
      }
    }

    // 2. Motor de extracción real local de PDF a Markdown:
    // Guarda el buffer en un archivo temporal y ejecuta la extracción sobre el PDF subido
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `babilon_pdf_${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    const scriptPath = path.join(process.cwd(), 'src', 'lib', 'pdf_extractor.py');

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(tempFilePath, Buffer.from(arrayBuffer));

    try {
      const extractedJson = await new Promise<string>((resolve, reject) => {
        const pyProcess = spawn('python', [scriptPath, tempFilePath]);
        let stdout = '';
        let stderr = '';

        pyProcess.stdout.on('data', (chunk) => {
          stdout += chunk.toString();
        });

        pyProcess.stderr.on('data', (chunk) => {
          stderr += chunk.toString();
        });

        pyProcess.on('close', (code) => {
          if (code === 0 && stdout.trim()) {
            resolve(stdout);
          } else {
            reject(new Error(stderr || `Python exit code ${code}`));
          }
        });
      });

      const parsedJson = JSON.parse(extractedJson);
      const extractedMarkdown = parsedJson.markdown || '';

      const parsed = processMinerUOutput({
        markdown: extractedMarkdown,
        filename,
        metadata: {
          title: parsedJson.title,
          author: parsedJson.author,
          pageCount: parsedJson.pageCount,
        },
        processingTimeMs: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        data: parsed,
        engine: 'mineru-local-engine',
      });
    } finally {
      // Limpiar archivo temporal
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // Ignorar error al limpiar temporal
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error en /api/v1/scan/mineru:', err);
    return NextResponse.json(
      { success: false, message: `Error al procesar el PDF con MinerU: ${errorMsg}` },
      { status: 500 }
    );
  }
}
