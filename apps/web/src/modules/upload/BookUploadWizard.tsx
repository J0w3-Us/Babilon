'use client';

import { useBookUpload, type UploadProgressStage } from './useBookUpload';
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
    fullText,
    isSubmitting,
    isScanning,
    uploadedFileName,
    uploadProgress,
    statusMessage,
  } = state;

  const progressLabels: Record<Exclude<UploadProgressStage, 'idle'>, string> = {
    uploading: 'Enviando el PDF',
    extracting: 'Extrayendo y filtrando páginas',
    cleaning: 'Limpiando y organizando el texto',
    complete: 'Proceso completado',
    error: 'El proceso se detuvo',
  };
  const elapsedLabel = `${Math.floor(uploadProgress.elapsedSeconds / 60)
    .toString().padStart(2, '0')}:${(uploadProgress.elapsedSeconds % 60).toString().padStart(2, '0')}`;
  const progressIsDeterminate = uploadProgress.stage === 'uploading' || uploadProgress.stage === 'complete';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.submitBook();
  };

  return (
    <div className="flex flex-col h-full bg-cream-50 dark:bg-surface-100 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Pasos progresivos de carga y revisión */}
      <div className="flex border-b border-stone-200/80 dark:border-surface-300 bg-cream-100/60 dark:bg-surface-200 px-6 pt-3">
        <button
          type="button"
          onClick={() => actions.setUploadTab('content')}
          aria-current={uploadTab === 'content' ? 'step' : undefined}
          className={`pb-3 px-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            uploadTab === 'content'
              ? 'border-stone-900 text-stone-900 dark:border-cream-100 dark:text-stone-100'
              : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          1. Carga del documento
        </button>
        <button
          type="button"
          onClick={() => actions.setUploadTab('meta')}
          aria-current={uploadTab === 'meta' ? 'step' : undefined}
          className={`pb-3 px-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            uploadTab === 'content'
              ? 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              : 'border-stone-900 text-stone-900 dark:border-cream-100 dark:text-stone-100'
          }`}
        >
          <span>2. Edición y revisión</span>
          {fullText && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* Alerta de Estado */}
      {statusMessage && (
        <div
          className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
              : statusMessage.type === 'info'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
              : 'bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-200/80 dark:border-rose-800'
          }`}
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          aria-live={statusMessage.type === 'error' ? 'assertive' : 'polite'}
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

      {uploadTab === 'content' && uploadProgress.stage !== 'idle' && (
        <section
          className="mx-6 mt-4 rounded-xl border border-stone-200/80 bg-white/60 p-4 dark:border-surface-300 dark:bg-surface-200/60"
          aria-label="Progreso de carga y extracción"
          aria-live="polite"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-100">
                {progressLabels[uploadProgress.stage]}
              </p>
              <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                {uploadProgress.stage === 'uploading'
                  ? 'Transferencia del archivo'
                  : uploadProgress.stage === 'extracting'
                    ? 'La extracción continúa en el servidor; se muestra el tiempo transcurrido.'
                    : uploadProgress.stage === 'cleaning'
                      ? 'Preparando el texto para que puedas revisarlo.'
                      : uploadProgress.stage === 'complete'
                        ? 'El contenido está listo para revisión.'
                        : 'Revisa el mensaje de error para conocer el motivo.'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-sm font-semibold tabular-nums text-stone-700 dark:text-stone-200">
                {elapsedLabel}
              </p>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                {uploadProgress.stage === 'complete' ? 'tiempo total' : 'transcurrido'}
              </p>
            </div>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-surface-300"
            role="progressbar"
            aria-label={progressLabels[uploadProgress.stage]}
            aria-valuemin={progressIsDeterminate ? 0 : undefined}
            aria-valuemax={progressIsDeterminate ? 100 : undefined}
            aria-valuenow={progressIsDeterminate ? uploadProgress.percent : undefined}
            aria-valuetext={progressIsDeterminate ? `${uploadProgress.percent}%` : 'En curso'}
          >
            {progressIsDeterminate ? (
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${uploadProgress.stage === 'error' ? 'bg-rose-500' : 'bg-terracotta-500'}`}
                style={{ width: `${uploadProgress.percent}%` }}
              />
            ) : (
              <div className={`h-full w-1/3 rounded-full ${uploadProgress.stage === 'error' ? 'bg-rose-500' : 'bg-terracotta-500 animate-progress-indeterminate'}`} />
            )}
          </div>
          {uploadProgress.stage === 'uploading' && (
            <p className="mt-1.5 text-right text-[10px] font-medium tabular-nums text-stone-500 dark:text-stone-400">
              {uploadProgress.percent}%
            </p>
          )}
        </section>
      )}

      {/* Formulario Modular */}
      <form onSubmit={handleSubmit} noValidate className="p-6 overflow-y-auto space-y-4 flex-1">
        {uploadTab === 'meta' ? (
          <MetadataFields
            title={title}
            onTitleChange={actions.setTitle}
            author={author}
            onAuthorChange={actions.setAuthor}
            genre={genre}
            onGenreChange={actions.setGenre}
            year={year}
            onYearChange={actions.setYear}
            publisher={publisher}
            onPublisherChange={actions.setPublisher}
            isbn={isbn}
            synopsis={synopsis}
            onSynopsisChange={actions.setSynopsis}
          />
        ) : (
          uploadedFileName ? (
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                    Documento seleccionado
                  </p>
                  <p className="mt-1 break-all text-xs text-stone-600 dark:text-stone-300">
                    {uploadedFileName}
                  </p>
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                    {isScanning
                      ? 'El documento se está procesando.'
                      : 'Termina la revisión y guarda la obra para completar la carga.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <FileDropzone
              isScanning={isScanning}
              onFileSelect={actions.handleFileUpload}
            />
          )
        )}

        {/* Pie de Acciones */}
        <div className="pt-3 border-t border-stone-200/80 dark:border-surface-300 flex items-center justify-between">
          {uploadTab === 'content' ? (
            <button
              type="button"
              onClick={() => actions.setUploadTab('meta')}
              className="text-xs text-stone-700 dark:text-stone-300 font-semibold hover:underline cursor-pointer"
            >
              Continuar a edición de metadatos →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => actions.setUploadTab('content')}
              className="text-xs text-stone-500 dark:text-stone-400 font-semibold hover:underline cursor-pointer"
            >
              ← Regresar a la carga
            </button>
          )}

          <div className="flex items-center gap-2.5">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-surface-300 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-surface-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isScanning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-cream-50 hover:bg-stone-800 dark:bg-cream-100 dark:text-stone-900 dark:hover:bg-cream-50 font-semibold text-xs transition-all shadow-subtle disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Guardando obra y contenido...</span>
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
