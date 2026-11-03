'use client';

import { useRef, useState } from 'react';
import {
  UploadCloud,
  Loader2,
  Sparkles,
  FileText,
  Eye,
  Code,
  Download,
  X,
  CheckCircle2,
} from 'lucide-react';

interface FileDropzoneProps {
  isScanning: boolean;
  uploadedFileName: string | null;
  fullText: string;
  previewEstimatedPages: number;
  onFileSelect: (file: File) => void;
  onTextChange: (text: string) => void;
  onClearFile?: () => void;
}

export function FileDropzone({
  isScanning,
  uploadedFileName,
  fullText,
  previewEstimatedPages,
  onFileSelect,
  onTextChange,
  onClearFile,
}: FileDropzoneProps) {
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileSelect(f);
    // Reset input so the same file can be re-selected after clearing
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* ── Zona de archivo ── */}
      {isScanning ? (
        /* Estado: escaneando */
        <div className="p-6 border border-dashed border-amber-300 dark:border-amber-700 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 animate-pulse">
              <Loader2 size={26} className="animate-spin" />
            </div>
          </div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
            Escaneando con MinerU Engine…
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
            Extrayendo Markdown y metadatos del PDF
          </p>
        </div>
      ) : uploadedFileName ? (
        /* Estado: archivo cargado */
        <div className="p-5 border border-emerald-200 dark:border-emerald-800 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
            <FileText size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate max-w-xs">
                {uploadedFileName}
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta-800 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800 shrink-0">
                <Sparkles size={10} /> MinerU OCR
              </span>
              {fullText && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <CheckCircle2 size={10} /> Procesado
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Formatos compatibles:{' '}
              <code className="font-mono font-bold text-stone-700 dark:text-stone-300">.pdf</code>
              ,{' '}
              <code className="font-mono text-stone-600 dark:text-stone-400">.txt</code>
              ,{' '}
              <code className="font-mono text-stone-600 dark:text-stone-400">.md</code>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Botón Exportar .md – prominente */}
            {fullText && (
              <button
                type="button"
                onClick={handleDownloadMd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-xs font-semibold hover:bg-stone-700 dark:hover:bg-white transition-all shadow-sm"
                title="Descargar copia local del Markdown generado"
              >
                <Download size={12} /> Exportar .md
              </button>
            )}

            {/* Botón Quitar archivo */}
            <button
              type="button"
              onClick={onClearFile}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-surface-300 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 dark:hover:bg-rose-950/30 dark:hover:border-rose-800 dark:hover:text-rose-400 transition-all"
              title="Quitar el archivo y empezar de nuevo"
            >
              <X size={12} /> Quitar archivo
            </button>

            {/* Seleccionar otro */}
            <label className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer underline underline-offset-2 transition-colors">
              <UploadCloud size={11} /> Seleccionar otro
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : (
        /* Estado: sin archivo */
        <div className="p-6 border border-dashed border-stone-300 dark:border-surface-300 rounded-xl bg-stone-50 dark:bg-surface-200 text-center hover:bg-stone-100 dark:hover:bg-surface-300/40 transition-colors">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-surface-300 flex items-center justify-center text-stone-700 dark:text-stone-300">
              <UploadCloud size={26} />
            </div>
          </div>

          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-0.5">
            Cargar libro en PDF o archivo de texto
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Formatos compatibles:{' '}
            <code className="font-mono font-bold text-stone-800 dark:text-stone-200">.pdf</code>
            ,{' '}
            <code className="font-mono text-stone-700 dark:text-stone-300">.txt</code>
            ,{' '}
            <code className="font-mono text-stone-700 dark:text-stone-300">.md</code>
          </p>

          <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 dark:bg-surface-300 text-stone-50 dark:text-stone-100 text-xs font-semibold cursor-pointer hover:bg-stone-800 dark:hover:bg-surface-400 transition-all shadow-subtle">
            <UploadCloud size={14} />
            <span>Seleccionar Archivo (PDF / TXT / MD)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta-800 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800">
            <Sparkles size={10} /> MinerU OCR activo
          </div>
        </div>
      )}

      {/* ── Markdown Editor / Vista Previa ── */}
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

          {previewEstimatedPages > 0 && (
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 font-semibold">
              ~{previewEstimatedPages} páginas
            </span>
          )}
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
