'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
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
  File,
} from 'lucide-react';
import { splitTextIntoPages, ParsedPage } from '@/lib/pageSplitter';
import { StructuredBookDocument } from '@/lib/bookTextCleaner';

interface FileDropzoneProps {
  isScanning: boolean;
  uploadedFileName: string | null;
  fullText: string;
  structuredDocument: StructuredBookDocument | null;
  title: string;
  author: string;
  previewEstimatedPages: number;
  onFileSelect: (file: File) => void;
  onTextChange: (text: string) => void;
  onClearFile?: () => void;
}

export function FileDropzone({
  isScanning,
  uploadedFileName,
  fullText,
  structuredDocument,
  title,
  author,
  previewEstimatedPages,
  onFileSelect,
  onTextChange,
  onClearFile,
}: FileDropzoneProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'editor'>('preview');
  const [pageLayout, setPageLayout] = useState<'carousel' | 'continuous'>('carousel');
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [documentSection, setDocumentSection] = useState<'body' | 'cover' | 'extras'>('body');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDocumentSection('body');
    setActivePageIndex(0);
  }, [structuredDocument]);

  const bodyText = structuredDocument?.body ?? fullText;
  const parsedPages: ParsedPage[] = useMemo(() => {
    return splitTextIntoPages(bodyText);
  }, [bodyText]);

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onFileSelect(f);
    },
    [onFileSelect]
  );

  const totalPagesCount = parsedPages.length || previewEstimatedPages || 1;

  return (
    <div className="space-y-5">
      {/* ── Zona de Estado / Carga de Archivo ── */}
      {isScanning ? (
        <div className="p-7 border-2 border-dashed border-amber-300/70 dark:border-amber-700/50 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          </div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            El servicio externo está procesando el documento…
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-1.5">
            Al terminar podrás revisar el texto y los metadatos detectados
          </p>
        </div>
      ) : uploadedFileName ? (
        /* ── Archivo cargado exitosamente ── */
        <div className="p-5 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/15 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5">
            <FileText size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate max-w-xs">
                {uploadedFileName}
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-terracotta-50 dark:bg-terracotta-900/30 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200/60 dark:border-terracotta-800/40 shrink-0">
                <Sparkles size={10} /> Separación Automática
              </span>
              {fullText && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
                  <CheckCircle2 size={10} /> {parsedPages.length} {parsedPages.length === 1 ? 'página' : 'páginas'}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Hojas identificadas y listas para visualización y archivo
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fullText && (
              <button
                type="button"
                onClick={handleDownloadMd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-cream-100 text-cream-50 dark:text-stone-900 text-xs font-semibold hover:bg-stone-700 dark:hover:bg-cream-50 transition-all shadow-sm"
                title="Descargar copia del texto estructurado"
              >
                <Download size={12} /> Exportar .md
              </button>
            )}

            <button
              type="button"
              onClick={onClearFile}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-surface-300 text-xs font-medium text-stone-500 dark:text-stone-400 hover:bg-rose-50/80 hover:border-rose-200 hover:text-rose-700 dark:hover:bg-rose-950/20 dark:hover:border-rose-800/40 dark:hover:text-rose-400 transition-all"
              title="Quitar archivo"
            >
              <X size={13} /> Quitar
            </button>
          </div>
        </div>
      ) : (
        /* ── Dropzone vacía — zona de arrastre y selección ── */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative p-8 border-2 border-dashed rounded-2xl text-center transition-all duration-200 ${
            isDragOver
              ? 'border-terracotta-400 bg-terracotta-50/40 dark:bg-terracotta-950/15 dark:border-terracotta-600/50 scale-[1.01]'
              : 'border-stone-300/80 dark:border-surface-300 bg-cream-100/50 dark:bg-surface-200/50 hover:bg-cream-200/40 dark:hover:bg-surface-300/30 hover:border-stone-400/60 dark:hover:border-surface-400/50'
          }`}
        >
          {/* Icono central */}
          <div className="flex justify-center mb-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                isDragOver
                  ? 'bg-terracotta-100 dark:bg-terracotta-900/30 text-terracotta-600 dark:text-terracotta-400'
                  : 'bg-stone-100 dark:bg-surface-300 text-stone-500 dark:text-stone-400'
              }`}
            >
              {isDragOver ? (
                <File size={30} className="animate-pulse" />
              ) : (
                <UploadCloud size={30} />
              )}
            </div>
          </div>

          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-1">
            {isDragOver ? 'Suelta el archivo aquí' : 'Arrastra un documento o selecciona uno'}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-5 max-w-sm mx-auto">
            Las páginas se separarán fielmente respetando el formato del documento. Soporta PDF, Markdown y texto plano.
          </p>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-cream-100 text-cream-50 dark:text-stone-900 text-xs font-semibold cursor-pointer hover:bg-stone-700 dark:hover:bg-cream-50 transition-all shadow-sm">
            <UploadCloud size={14} />
            <span>Seleccionar Archivo</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <p className="mt-3 text-[11px] text-stone-400 dark:text-stone-500 font-mono">
            PDF · TXT · MD
          </p>
        </div>
      )}

      {/* ── Encabezado de la Sección de Visualización de Páginas ── */}
      {structuredDocument && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Secciones del documento procesado"
        >
          <button
            type="button"
            aria-pressed={documentSection === 'body'}
            onClick={() => setDocumentSection('body')}
            className={`min-h-10 rounded-lg px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta-600 ${
              documentSection === 'body'
                ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900'
                : 'border border-stone-200 text-stone-600 dark:border-surface-300 dark:text-stone-300'
            }`}
          >
            Cuerpo · {parsedPages.length} págs.
          </button>
          <button
            type="button"
            aria-pressed={documentSection === 'cover'}
            onClick={() => setDocumentSection('cover')}
            className={`min-h-10 rounded-lg px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta-600 ${
              documentSection === 'cover'
                ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900'
                : 'border border-stone-200 text-stone-600 dark:border-surface-300 dark:text-stone-300'
            }`}
          >
            Portada
          </button>
          <button
            type="button"
            aria-pressed={documentSection === 'extras'}
            onClick={() => setDocumentSection('extras')}
            className={`min-h-10 rounded-lg px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta-600 ${
              documentSection === 'extras'
                ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900'
                : 'border border-stone-200 text-stone-600 dark:border-surface-300 dark:text-stone-300'
            }`}
          >
            Material extra · {structuredDocument.extras.length}
          </button>
        </div>
      )}

      <div hidden={documentSection !== 'body'}>
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={13} className="text-terracotta-600 dark:text-terracotta-400" />
              <span>Visualizador de Páginas</span>
              {parsedPages.length > 0 && (
                <span className="text-[11px] font-mono font-normal lowercase opacity-70">
                  ({parsedPages.length} {parsedPages.length === 1 ? 'página' : 'páginas'})
                </span>
              )}
            </label>

            {/* Alternador de Modo: Vista de Hojas vs Editor Crudo */}
            <div className="flex items-center bg-stone-100 dark:bg-surface-300 rounded-lg p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                  viewMode === 'preview'
                    ? 'bg-cream-50 dark:bg-surface-100 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Eye size={12} /> Hojas Separadas (PDF)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                  viewMode === 'editor'
                    ? 'bg-cream-50 dark:bg-surface-100 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Code size={12} /> Editor Markdown
              </button>
            </div>
          </div>

          {/* Controles para la Vista Previa de Hojas */}
          {viewMode === 'preview' && parsedPages.length > 1 && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center bg-stone-100 dark:bg-surface-300 rounded-lg p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPageLayout('carousel')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    pageLayout === 'carousel'
                      ? 'bg-cream-50 dark:bg-surface-100 text-stone-900 dark:text-stone-100 font-semibold shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Página a Página
                </button>
                <button
                  type="button"
                  onClick={() => setPageLayout('continuous')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    pageLayout === 'continuous'
                      ? 'bg-cream-50 dark:bg-surface-100 text-stone-900 dark:text-stone-100 font-semibold shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Todas las Hojas
                </button>
              </div>

              {pageLayout === 'carousel' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePageIndex === 0}
                    onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-surface-300 bg-cream-50 dark:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cream-200 dark:hover:bg-surface-300 transition-colors"
                    title="Página anterior"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-[11px] font-mono px-1.5 font-semibold text-stone-600 dark:text-stone-300 tabular-nums">
                    {safePageIndex + 1} / {parsedPages.length}
                  </span>
                  <button
                    type="button"
                    disabled={safePageIndex >= parsedPages.length - 1}
                    onClick={() => setActivePageIndex((p) => Math.min(parsedPages.length - 1, p + 1))}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-surface-300 bg-cream-50 dark:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cream-200 dark:hover:bg-surface-300 transition-colors"
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
          <div className="space-y-1.5">
            <textarea
              rows={11}
              placeholder="El contenido transcrito o extraído se mostrará aquí dividido por '--- Página N ---'..."
              value={fullText}
              onChange={(e) => onTextChange(e.target.value)}
              className="w-full px-4 py-3 bg-cream-100 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-xl text-sm font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400/70 focus:outline-none focus:border-terracotta-300/60 dark:focus:border-surface-400 focus:bg-cream-50 dark:focus:bg-surface-100 focus:ring-2 focus:ring-terracotta-100/40 dark:focus:ring-surface-400/20 transition-all"
            />
            <p className="text-[11px] text-stone-400 dark:text-stone-500 font-mono px-1">
              Tip: Puedes separar páginas manualmente usando <code className="px-1 py-0.5 bg-stone-100 dark:bg-surface-300 rounded">--- Página 2 ---</code> o <code className="px-1 py-0.5 bg-stone-100 dark:bg-surface-300 rounded">---</code>
            </p>
          </div>
        ) : (
          /* Modo Visualización Real de Hojas / PDF */
          <div className="w-full min-h-[300px] max-h-[460px] overflow-y-auto bg-cream-200/50 dark:bg-stone-950 p-5 rounded-2xl border border-stone-200/80 dark:border-surface-300 space-y-5">
            {parsedPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-stone-400 dark:text-stone-500 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-surface-300 flex items-center justify-center">
                  <FileText size={28} className="opacity-40" />
                </div>
                <p className="text-xs text-center max-w-xs">No hay páginas para previsualizar. Carga un archivo para comenzar.</p>
              </div>
            ) : pageLayout === 'carousel' ? (
              /* Vista Página por Página (Estilo Hoja Individual con Sombra) */
              <div className="max-w-2xl mx-auto">
                {(() => {
                  const page = parsedPages[safePageIndex] || parsedPages[0];
                  return (
                    <div className="bg-cream-50 dark:bg-surface-100 text-stone-800 dark:text-stone-100 rounded-xl shadow-card dark:shadow-dark-card border border-stone-200/60 dark:border-surface-300 p-7 sm:p-9 transition-all">
                      {/* Cabecera de la Hoja */}
                      <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-surface-300 pb-3 mb-6 text-[11px] font-mono text-stone-400 dark:text-stone-500">
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
                      <div className="border-t border-stone-100 dark:border-surface-300 pt-3 mt-7 flex justify-between items-center text-[10px] font-mono text-stone-400 dark:text-stone-500">
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
                    className="bg-cream-50 dark:bg-surface-100 text-stone-800 dark:text-stone-100 rounded-xl shadow-card dark:shadow-dark-card border border-stone-200/60 dark:border-surface-300 p-7 sm:p-9"
                  >
                    <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-surface-300 pb-3 mb-6 text-[11px] font-mono text-stone-400 dark:text-stone-500">
                      <span className="font-semibold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers size={12} />
                        Página {page.numero} de {parsedPages.length}
                      </span>
                      <span>{page.conteo_palabras} palabras</span>
                    </div>

                    <div className="font-serif leading-relaxed text-sm sm:text-base text-justify whitespace-pre-line text-stone-800 dark:text-stone-200">
                      {page.texto}
                    </div>

                    <div className="border-t border-stone-100 dark:border-surface-300 pt-3 mt-7 flex justify-between items-center text-[10px] font-mono text-stone-400 dark:text-stone-500">
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

      {documentSection === 'cover' && structuredDocument && (
        <section
          className="rounded-2xl border border-stone-200 bg-cream-50 p-6 dark:border-surface-300 dark:bg-surface-100"
          aria-labelledby="book-cover-preview-title"
        >
          <p className="text-[11px] font-mono uppercase tracking-widest text-terracotta-700 dark:text-terracotta-300">
            Presentación
          </p>
          <h3
            id="book-cover-preview-title"
            className="mt-2 font-serif text-2xl font-bold text-stone-900 dark:text-stone-100"
          >
            {title || structuredDocument.cover.title || 'Portada de la obra'}
          </h3>
          {(author || structuredDocument.cover.author) && (
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              {author || structuredDocument.cover.author}
            </p>
          )}
          {structuredDocument.cover.text ? (
            <p className="mt-5 max-w-prose whitespace-pre-line font-serif leading-relaxed text-stone-700 dark:text-stone-300">
              {structuredDocument.cover.text}
            </p>
          ) : (
            <p className="mt-5 text-xs text-stone-500 dark:text-stone-400">
              La API no devolvió texto preliminar para la portada. El título y el autor editables se muestran arriba.
            </p>
          )}
        </section>
      )}

      {documentSection === 'extras' && structuredDocument && (
        <section
          className="space-y-4"
          aria-label="Material extra y preliminares"
        >
          {structuredDocument.extras.length > 0 ? (
            structuredDocument.extras.map((section, index) => (
              <article
                key={`${section.title}-${index}`}
                className="rounded-xl border border-stone-200 bg-cream-50 p-5 dark:border-surface-300 dark:bg-surface-100"
              >
                <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                  {section.title}
                </h3>
                <p className="mt-3 whitespace-pre-line font-serif leading-relaxed text-stone-700 dark:text-stone-300">
                  {section.content}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-stone-300 px-5 py-8 text-center text-sm text-stone-500 dark:border-surface-300 dark:text-stone-400">
              No se detectaron anexos ni preliminares en el documento.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
