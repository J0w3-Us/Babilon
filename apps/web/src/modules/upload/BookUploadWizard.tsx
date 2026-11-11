'use client';

import { useBookUpload, type UploadProgressStage } from './useBookUpload';
import { MetadataFields } from './MetadataFields';
import { FileDropzone } from './FileDropzone';
import { PageManager } from './PageManager';
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
    title,
    author,
    isbn,
    genre,
    year,
    publisher,
    synopsis,
    pagesList,
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
  const progressCircumference = 2 * Math.PI * 18;
  const progressOffset = progressCircumference * (1 - uploadProgress.percent / 100);
  const isReadyForMetadata = Boolean(uploadedFileName) && uploadProgress.stage === 'complete';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.submitBook();
  };

  return (
    <div className="flex flex-col h-full bg-cream-50 dark:bg-surface-100 text-stone-900 dark:text-stone-100 transition-colors duration-200">
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

      {uploadProgress.stage !== 'idle' && (
        <section
          className="mx-6 mt-4 flex items-center gap-4 rounded-xl border border-stone-200/80 bg-white/60 p-4 dark:border-surface-300 dark:bg-surface-200/60"
          aria-label="Progreso de carga y extracción"
          aria-live="polite"
        >
          <div
            className="relative h-14 w-14 shrink-0"
            role="progressbar"
            aria-label={progressLabels[uploadProgress.stage]}
            aria-valuemin={progressIsDeterminate ? 0 : undefined}
            aria-valuemax={progressIsDeterminate ? 100 : undefined}
            aria-valuenow={progressIsDeterminate ? uploadProgress.percent : undefined}
            aria-valuetext={progressIsDeterminate ? `${uploadProgress.percent}%` : 'En curso'}
          >
            <svg
              viewBox="0 0 44 44"
              className={`h-full w-full -rotate-90 ${!progressIsDeterminate && uploadProgress.stage !== 'error' ? 'animate-spin' : ''}`}
              aria-hidden="true"
            >
              <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-stone-200 dark:text-surface-300" />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={progressIsDeterminate ? progressCircumference : `${progressCircumference * 0.28} ${progressCircumference}`}
                strokeDashoffset={progressIsDeterminate ? progressOffset : 0}
                className={uploadProgress.stage === 'error' ? 'text-rose-500' : uploadProgress.stage === 'complete' ? 'text-emerald-500' : 'text-terracotta-500'}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-stone-700 dark:text-stone-200">
              {progressIsDeterminate ? `${uploadProgress.percent}%` : uploadProgress.stage === 'error' ? '!' : '…'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-100">
                {progressLabels[uploadProgress.stage]}
              </p>
              <p className="font-mono text-xs font-semibold tabular-nums text-stone-700 dark:text-stone-200">
                {uploadProgress.stage === 'complete' ? 'Total ' : ''}{elapsedLabel}
              </p>
            </div>
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
              {uploadProgress.stage === 'uploading'
                ? 'Transferencia del archivo'
                : uploadProgress.stage === 'extracting'
                  ? 'Extracción de páginas en el servidor.'
                  : uploadProgress.stage === 'cleaning'
                    ? 'Preparando el texto para que puedas revisarlo.'
                    : uploadProgress.stage === 'complete'
                      ? 'El contenido está listo para revisión.'
                      : 'Revisa el mensaje de error para conocer el motivo.'}
            </p>
          </div>
        </section>
      )}

      {/* Formulario Modular */}
      <form onSubmit={handleSubmit} noValidate className="p-6 overflow-y-auto space-y-4 flex-1">
        {uploadedFileName && (
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
                    : 'Completa o revisa estos datos y guarda la obra para terminar la carga.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gestor y visor de páginas cargadas para revisión y exclusión */}
        {isReadyForMetadata && pagesList.length > 0 && (
          <PageManager
            pages={pagesList}
            onTogglePage={actions.togglePageExcluded}
            onRestoreAll={actions.restoreAllPages}
          />
        )}

        {!uploadedFileName && (
          <FileDropzone
            isScanning={isScanning}
            onFileSelect={actions.handleFileUpload}
          />
        )}

        {isReadyForMetadata && (
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
        )}

        {/* Pie de Acciones */}
        {(isReadyForMetadata || onCancel) && (
          <div className="pt-3 border-t border-stone-200/80 dark:border-surface-300 flex items-center justify-end">
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

              {isReadyForMetadata && (
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
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
