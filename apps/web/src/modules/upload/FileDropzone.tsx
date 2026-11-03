'use client';

import { useRef, useState, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Layers,
} from 'lucide-react';
import { splitTextIntoPages, ParsedPage } from '@/lib/pageSplitter';

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
  const [viewMode, setViewMode] = useState<'preview' | 'editor'>('preview');
  const [pageLayout, setPageLayout] = useState<'carousel' | 'continuous'>('carousel');
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsear texto en páginas reales
  const parsedPages: ParsedPage[] = useMemo(() => {
    return splitTextIntoPages(fullText);
  }, [fullText]);

  // Si cambia la cantidad de páginas y el índice queda fuera de rango, ajustarlo
  const safePageIndex = Math.min(activePageIndex, Math.max(0, parsedPages.length - 1));

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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalPagesCount = parsedPages.length || previewEstimatedPages || 1;

  return (
    <div className="space-y-4">
      {/* ── Zona de Estado / Carga de Archivo ── */}
      {isScanning ? (
        <div className="p-6 border border-dashed border-amber-300 dark:border-amber-700 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 animate-pulse">
              <Loader2 size={26} className="animate-spin" />
            </div>
          </div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
            Escaneando documento y separando páginas…
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
            Preservando estructura de hojas, texto y encabezados
          </p>
        </div>
      ) : uploadedFileName ? (
        <div className="p-4 border border-emerald-200 dark:border-emerald-800 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
            <FileText size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate max-w-xs">
                {uploadedFileName}
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta-800 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800 shrink-0">
                <Sparkles size={10} /> Separación Automática
              </span>
              {fullText && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <CheckCircle2 size={10} /> {parsedPages.length} {parsedPages.length === 1 ? 'página' : 'páginas'}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Hojas identificadas y listas para visualización y archivo
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fullText && (
              <button
                type="button"
                onClick={handleDownloadMd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-xs font-semibold hover:bg-stone-700 dark:hover:bg-white transition-all shadow-sm"
                title="Descargar copia del texto estructurado"
              >
                <Download size={12} /> Exportar .md
              </button>
            )}

            <button
              type="button"
              onClick={onClearFile}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-surface-300 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 dark:hover:bg-rose-950/30 dark:hover:border-rose-800 dark:hover:text-rose-400 transition-all"
              title="Quitar archivo"
            >
              <X size={13} /> Quitar
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 border border-dashed border-stone-300 dark:border-surface-300 rounded-xl bg-stone-50 dark:bg-surface-200 text-center hover:bg-stone-100 dark:hover:bg-surface-300/40 transition-colors">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-surface-300 flex items-center justify-center text-stone-700 dark:text-stone-300">
              <UploadCloud size={26} />
            </div>
          </div>

          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-0.5">
            Cargar documento (PDF, Markdown o Texto)
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Las páginas se separarán fielmente respetando el formato del documento
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
        </div>
      )}

      {/* ── Encabezado de la Sección de Visualización de Páginas ── */}
      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={13} className="text-terracotta-600 dark:text-terracotta-400" />
              <span>Visualizador de Páginas</span>
              {parsedPages.length > 0 && (
                <span className="text-[11px] font-mono font-normal lowercase opacity-75">
                  ({parsedPages.length} {parsedPages.length === 1 ? 'página' : 'páginas'})
                </span>
              )}
            </label>

            {/* Alternador de Modo: Vista de Hojas vs Editor Crudo */}
            <div className="flex items-center bg-stone-200 dark:bg-surface-300 rounded-lg p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                  viewMode === 'preview'
                    ? 'bg-white dark:bg-surface-100 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Eye size={12} /> Hojas Separadas (PDF)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                  viewMode === 'editor'
                    ? 'bg-white dark:bg-surface-100 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Code size={12} /> Editor Markdown
              </button>
            </div>
          </div>

          {/* Controles para la Vista Previa de Hojas */}
          {viewMode === 'preview' && parsedPages.length > 1 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-stone-200 dark:bg-surface-300 rounded p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPageLayout('carousel')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    pageLayout === 'carousel'
                      ? 'bg-white dark:bg-surface-100 text-stone-900 dark:text-stone-100 font-semibold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Página a Página
                </button>
                <button
                  type="button"
                  onClick={() => setPageLayout('continuous')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    pageLayout === 'continuous'
                      ? 'bg-white dark:bg-surface-100 text-stone-900 dark:text-stone-100 font-semibold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Todas las Hojas
                </button>
              </div>

              {pageLayout === 'carousel' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safePageIndex === 0}
                    onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                    className="p-1 rounded border border-stone-200 dark:border-surface-300 bg-stone-50 dark:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-100"
                    title="Página anterior"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-[11px] font-mono px-1 font-semibold text-stone-700 dark:text-stone-300">
                    {safePageIndex + 1} / {parsedPages.length}
                  </span>
                  <button
                    type="button"
                    disabled={safePageIndex >= parsedPages.length - 1}
                    onClick={() => setActivePageIndex((p) => Math.min(parsedPages.length - 1, p + 1))}
                    className="p-1 rounded border border-stone-200 dark:border-surface-300 bg-stone-50 dark:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-100"
                    title="Página siguiente"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── CUERPO PRINCIPAL DEL VISOR ── */}
        {viewMode === 'editor' ? (
          /* Modo Editor Manual */
          <div className="space-y-1">
            <textarea
              rows={11}
              placeholder="El contenido transcrito o extraído se mostrará aquí dividido por '--- Página N ---'..."
              value={fullText}
              onChange={(e) => onTextChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-sm font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-surface-400 focus:bg-white dark:focus:bg-surface-100 transition-colors"
            />
            <p className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
              Tip: Puedes separar páginas manualmente usando <code>--- Página 2 ---</code> o <code>---</code>
            </p>
          </div>
        ) : (
          /* Modo Visualización Real de Hojas / PDF */
          <div className="w-full min-h-[300px] max-h-[460px] overflow-y-auto bg-stone-100 dark:bg-stone-950 p-4 rounded-xl border border-stone-200 dark:border-surface-300 space-y-4">
            {parsedPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-stone-400 dark:text-stone-500 gap-2">
                <FileText size={32} className="opacity-40" />
                <p className="text-xs">No hay páginas para previsualizar. Carga un archivo para comenzar.</p>
              </div>
            ) : pageLayout === 'carousel' ? (
              /* Vista Página por Página (Estilo Hoja Individual con Sombra) */
              <div className="max-w-2xl mx-auto">
                {(() => {
                  const page = parsedPages[safePageIndex] || parsedPages[0];
                  return (
                    <div className="bg-white dark:bg-[#1E1E1E] text-stone-800 dark:text-stone-100 rounded-lg shadow-md border border-stone-200 dark:border-stone-800 p-6 sm:p-8 transition-all">
                      {/* Cabecera de la Hoja */}
                      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2.5 mb-5 text-[11px] font-mono text-stone-400 dark:text-stone-500">
                        <span className="font-semibold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Layers size={12} />
                          Página {page.numero} de {parsedPages.length}
                        </span>
                        <span>{page.conteo_palabras} palabras</span>
                      </div>

                      {/* Cuerpo de la Página (Justificado y limpio) */}
                      <div className="font-serif leading-relaxed text-sm sm:text-base text-justify whitespace-pre-line text-stone-800 dark:text-stone-200 min-h-[180px]">
                        {page.texto}
                      </div>

                      {/* Pie de Hoja */}
                      <div className="border-t border-stone-100 dark:border-stone-800/80 pt-3 mt-6 flex justify-between items-center text-[10px] font-mono text-stone-400">
                        <span>Babilon Digital Reader</span>
                        <span>— {page.numero} —</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Vista Continua de Todas las Hojas Separadas */
              <div className="max-w-2xl mx-auto space-y-6">
                {parsedPages.map((page) => (
                  <div
                    key={page.numero}
                    className="bg-white dark:bg-[#1E1E1E] text-stone-800 dark:text-stone-100 rounded-lg shadow-md border border-stone-200 dark:border-stone-800 p-6 sm:p-8"
                  >
                    <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2.5 mb-5 text-[11px] font-mono text-stone-400 dark:text-stone-500">
                      <span className="font-semibold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers size={12} />
                        Página {page.numero} de {parsedPages.length}
                      </span>
                      <span>{page.conteo_palabras} palabras</span>
                    </div>

                    <div className="font-serif leading-relaxed text-sm sm:text-base text-justify whitespace-pre-line text-stone-800 dark:text-stone-200">
                      {page.texto}
                    </div>

                    <div className="border-t border-stone-100 dark:border-stone-800/80 pt-3 mt-6 flex justify-between items-center text-[10px] font-mono text-stone-400">
                      <span>Babilon Digital Reader</span>
                      <span>— {page.numero} —</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
