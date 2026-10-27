'use client';

import { useState } from 'react';
import { UploadCloud, Loader2, Sparkles, FileScan, Eye, Code, Download } from 'lucide-react';

interface FileDropzoneProps {
  isScanning: boolean;
  uploadedFileName: string | null;
  fullText: string;
  previewEstimatedPages: number;
  onFileSelect: (file: File) => void;
  onTextChange: (text: string) => void;
}

export function FileDropzone({
  isScanning,
  uploadedFileName,
  fullText,
  previewEstimatedPages,
  onFileSelect,
  onTextChange,
}: FileDropzoneProps) {
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  const handleDownloadMd = () => {
    if (!fullText) return;
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(uploadedFileName || 'libro').replace(/\.[^/.]+$/, '')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Zona Dropzone de Archivo */}
      <div className="p-6 border border-dashed border-stone-300 dark:border-surface-300 rounded-xl bg-stone-50 dark:bg-surface-200 text-center hover:bg-stone-100 dark:hover:bg-surface-300/40 transition-colors relative overflow-hidden">
        <div className="flex justify-center mb-2">
          {isScanning ? (
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 animate-pulse">
              <Loader2 size={26} className="animate-spin" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-surface-300 flex items-center justify-center text-stone-700 dark:text-stone-300">
              <FileScan size={26} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            {isScanning
              ? 'Escaneando con MinerU...'
              : uploadedFileName
              ? `Archivo cargado: ${uploadedFileName}`
              : 'Cargar libro en PDF o archivo de texto'}
          </p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta-800 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800">
            <Sparkles size={11} /> MinerU OCR
          </span>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Formatos compatibles: <code className="font-mono font-bold text-stone-800 dark:text-stone-200">.pdf</code>, <code className="font-mono text-stone-700 dark:text-stone-300">.txt</code>, <code className="font-mono text-stone-700 dark:text-stone-300">.md</code>
        </p>

        <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 dark:bg-surface-300 text-stone-50 dark:text-stone-100 text-xs font-semibold cursor-pointer hover:bg-stone-800 dark:hover:bg-surface-400 transition-all shadow-subtle disabled:opacity-50">
          {isScanning ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Extrayendo Markdown del PDF...</span>
            </>
          ) : (
            <>
              <UploadCloud size={14} />
              <span>Seleccionar Archivo (PDF / TXT / MD)</span>
            </>
          )}
          <input
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileSelect(f);
            }}
            disabled={isScanning}
            className="hidden"
          />
        </label>
      </div>

      {/* Ingesta Directa y Previsualizador de Markdown */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Markdown del Tomo ({fullText.length} caracteres)
            </label>
            {fullText && (
              <div className="flex items-center bg-stone-200 dark:bg-surface-300 rounded p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setViewMode('editor')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 font-medium transition-all ${
                    viewMode === 'editor'
                      ? 'bg-white dark:bg-surface-100 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <Code size={11} /> Editor
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 font-medium transition-all ${
                    viewMode === 'preview'
                      ? 'bg-white dark:bg-surface-100 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <Eye size={11} /> Vista Previa
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500 dark:text-stone-400">
            {previewEstimatedPages > 0 && (
              <span className="text-stone-700 dark:text-stone-300 font-semibold">
                ~{previewEstimatedPages} páginas
              </span>
            )}
            {fullText && (
              <button
                type="button"
                onClick={handleDownloadMd}
                className="inline-flex items-center gap-1 text-terracotta-600 dark:text-terracotta-400 hover:underline cursor-pointer"
                title="Descargar copia local del Markdown generado"
              >
                <Download size={11} /> Exportar .md
              </button>
            )}
          </div>
        </div>

        {viewMode === 'editor' ? (
          <textarea
            rows={9}
            placeholder="El contenido transcrito o extraído por MinerU se mostrará aquí en Markdown para que puedas revisarlo antes de guardarlo en la base de datos..."
            value={fullText}
            onChange={(e) => onTextChange(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-sm font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-surface-400 focus:bg-white dark:focus:bg-surface-100 transition-colors"
          />
        ) : (
          <div className="w-full h-56 p-4 overflow-y-auto bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-xs leading-relaxed text-stone-800 dark:text-stone-200 prose prose-stone dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
            {fullText || 'No hay contenido para previsualizar.'}
          </div>
        )}
      </div>
    </div>
  );
}
