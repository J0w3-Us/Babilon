'use client';

import { useBookUpload } from './useBookUpload';
import { MetadataFields } from './MetadataFields';
import { FileDropzone } from './FileDropzone';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface BookUploadWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function BookUploadWizard({
  onSuccess,
  onCancel,
  isModal = false,
}: BookUploadWizardProps) {
  const { state, actions } = useBookUpload({ onSuccess });

  const {
    uploadTab,
    title,
    author,
    isbn,
    genre,
    year,
    publisher,
    synopsis,
    coverUrl,
    fullText,
    isSubmitting,
    isScanning,
    uploadedFileName,
    statusMessage,
    previewEstimatedPages,
  } = state;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.submitBook();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-100 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Pestañas de Navegación Editorial */}
      <div className="flex border-b border-stone-200 dark:border-surface-300 bg-stone-50 dark:bg-surface-200 px-6 pt-3">
        <button
          type="button"
          onClick={() => actions.setUploadTab('meta')}
          className={`pb-3 px-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            uploadTab === 'meta'
              ? 'border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100'
              : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          1. Metadatos Bibliográficos
        </button>
        <button
          type="button"
          onClick={() => actions.setUploadTab('content')}
          className={`pb-3 px-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            uploadTab === 'content'
              ? 'border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100'
              : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <span>2. Ingesta & Markdown (MinerU)</span>
          {fullText && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* Alerta de Estado */}
      {statusMessage && (
        <div
          className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2.5 text-xs font-medium border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : statusMessage.type === 'info'
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : statusMessage.type === 'info' ? (
            <Loader2 size={15} className="text-amber-600 dark:text-amber-400 shrink-0 animate-spin" />
          ) : (
            <AlertCircle size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Formulario Modular */}
      <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
        {uploadTab === 'meta' ? (
          <MetadataFields
            title={title}
            onTitleChange={actions.setTitle}
            author={author}
            onAuthorChange={actions.setAuthor}
            isbn={isbn}
            onIsbnChange={actions.setIsbn}
            genre={genre}
            onGenreChange={actions.setGenre}
            year={year}
            onYearChange={actions.setYear}
            publisher={publisher}
            onPublisherChange={actions.setPublisher}
            coverUrl={coverUrl}
            onCoverUrlChange={actions.setCoverUrl}
            synopsis={synopsis}
            onSynopsisChange={actions.setSynopsis}
          />
        ) : (
          <FileDropzone
            isScanning={isScanning}
            uploadedFileName={uploadedFileName}
            fullText={fullText}
            previewEstimatedPages={previewEstimatedPages}
            onFileSelect={actions.handleFileUpload}
            onTextChange={actions.setFullText}
          />
        )}

        {/* Pie de Acciones */}
        <div className="pt-3 border-t border-stone-200 dark:border-surface-300 flex items-center justify-between">
          {uploadTab === 'meta' ? (
            <button
              type="button"
              onClick={() => actions.setUploadTab('content')}
              className="text-xs text-stone-700 dark:text-stone-300 font-semibold hover:underline cursor-pointer"
            >
              Siguiente: Adjuntar texto / Escaneo PDF →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => actions.setUploadTab('meta')}
              className="text-xs text-stone-500 dark:text-stone-400 font-semibold hover:underline cursor-pointer"
            >
              ← Regresar a metadatos
            </button>
          )}

          <div className="flex items-center gap-2.5">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-surface-300 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-surface-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isScanning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white font-semibold text-xs transition-all shadow-subtle disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Incorporando a la base...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  <span>Guardar en Archivo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
