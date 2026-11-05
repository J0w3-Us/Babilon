'use client';

import { useCallback, useState } from 'react';
import { File, Loader2, UploadCloud } from 'lucide-react';

interface FileDropzoneProps {
  isScanning: boolean;
  onFileSelect: (file: File) => void;
}

export function FileDropzone({ isScanning, onFileSelect }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    event.target.value = '';
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isScanning) setIsDragOver(true);
  }, [isScanning]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    if (isScanning) return;

    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  }, [isScanning, onFileSelect]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
        isDragOver
          ? 'scale-[1.01] border-terracotta-400 bg-terracotta-50/40 dark:border-terracotta-600/50 dark:bg-terracotta-950/15'
          : 'border-stone-300/80 bg-cream-100/50 hover:border-stone-400/60 hover:bg-cream-200/40 dark:border-surface-300 dark:bg-surface-200/50 dark:hover:border-surface-400/50 dark:hover:bg-surface-300/30'
      }`}
    >
      <div className="mb-4 flex justify-center">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
            isDragOver
              ? 'bg-terracotta-100 text-terracotta-600 dark:bg-terracotta-900/30 dark:text-terracotta-400'
              : 'bg-stone-100 text-stone-500 dark:bg-surface-300 dark:text-stone-400'
          }`}
        >
          {isScanning ? (
            <Loader2 size={30} className="animate-spin" />
          ) : isDragOver ? (
            <File size={30} className="animate-pulse" />
          ) : (
            <UploadCloud size={30} />
          )}
        </div>
      </div>

      <p className="mb-1 text-sm font-semibold text-stone-800 dark:text-stone-100">
        {isScanning
          ? 'Procesando documento…'
          : isDragOver
            ? 'Suelta el archivo aquí'
            : 'Arrastra un documento o selecciona uno'}
      </p>
      <p className="mx-auto mb-5 max-w-sm text-xs text-stone-500 dark:text-stone-400">
        Soporta archivos PDF, Markdown y texto plano.
      </p>

      <label
        className={`inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-cream-50 shadow-sm transition-all dark:bg-cream-100 dark:text-stone-900 ${
          isScanning
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:bg-stone-700 dark:hover:bg-cream-50'
        }`}
      >
        <UploadCloud size={14} />
        <span>Seleccionar archivo</span>
        <input
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain"
          onChange={handleFileChange}
          disabled={isScanning}
          className="sr-only"
        />
      </label>

      <p className="mt-3 font-mono text-[11px] text-stone-400 dark:text-stone-500">
        PDF · TXT · MD
      </p>
    </div>
  );
}
