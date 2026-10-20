'use client';

import { useState } from 'react';
import { BookGenre } from '@babilon/shared-types';
import { createBookApi } from '@/services/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface BookUploadWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const GENRES_LIST: BookGenre[] = [
  'Clásicos',
  'Filosofía',
  'Ficción',
  'Ciencia Ficción',
  'Poesía',
  'Historia',
];

export function BookUploadWizard({
  onSuccess,
  onCancel,
  isModal = false,
}: BookUploadWizardProps) {
  const [uploadTab, setUploadTab] = useState<'meta' | 'content'>('meta');
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newGenre, setNewGenre] = useState<BookGenre>('Ficción');
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [newPublisher, setNewPublisher] = useState('Editorial Babilon');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newFullText, setNewFullText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Manejo de lectura de archivo local (.txt, .md)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    if (!newTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setNewFullText(text);
        if (!newSynopsis) {
          setNewSynopsis(text.slice(0, 220).trim() + '...');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor completa al menos el título y el autor de la obra.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const isbnVal =
        newIsbn.trim() || `ISBN-BAB-${Date.now().toString().slice(-6)}`;
      const res = await createBookApi({
        title: newTitle.trim(),
        isbn: isbnVal,
        author: { name: newAuthor.trim() },
        genres: [newGenre],
        publishedYear: Number(newYear) || new Date().getFullYear(),
        publisher: newPublisher.trim() || 'Editorial Babilon',
        synopsis: newSynopsis.trim() || 'Sin sinopsis registrada.',
        coverUrl: newCoverUrl.trim() || undefined,
        fullText: newFullText.trim() || undefined,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: '¡Obra y texto preservados exitosamente en el catálogo!',
        });
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 800);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Error al incorporar la obra en la biblioteca.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Error al conectar con la API de libros de Babilon.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewEstimatedPages = newFullText
    ? Math.max(1, Math.ceil(newFullText.length / 1800))
    : 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-100 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Pestañas de Navegación Editorial */}
      <div className="flex border-b border-stone-200 dark:border-surface-300 bg-stone-50 dark:bg-surface-200 px-6 pt-3">
        <button
          type="button"
          onClick={() => setUploadTab('meta')}
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
          onClick={() => setUploadTab('content')}
          className={`pb-3 px-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            uploadTab === 'content'
              ? 'border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100'
              : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <span>2. Ingesta de Texto</span>
          {newFullText && (
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
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
        {uploadTab === 'meta' ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Título de la Obra *
              </label>
              <input
                type="text"
                required
                placeholder="ej. Ensayos sobre la lectura y la memoria"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-surface-400 focus:bg-white dark:focus:bg-surface-100 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Autor / Escritor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Jorge Luis Borges"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-surface-400 focus:bg-white dark:focus:bg-surface-100 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  ISBN (Identificador de tomo)
                </label>
                <input
                  type="text"
                  placeholder="ej. 978-84-376-0000-0"
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-sm font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-surface-400 focus:bg-white dark:focus:bg-surface-100 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Género / Disciplina
                </label>
                <select
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value as BookGenre)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-surface-400 focus:bg-white dark:focus:bg-surface-100 transition-colors"
                >
                  {GENRES_LIST.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Año de Publicación
                </label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-surface-400 focus:bg-white dark:focus:bg-surface-100 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Editorial / Colección
                </label>
                <input
                  type="text"
                  value={newPublisher}
                  onChange={(e) => setNewPublisher(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-surface-400 focus:bg-white dark:focus:bg-surface-100 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                URL de Portada (opcional)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={newCoverUrl}
                onChange={(e) => setNewCoverUrl(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-surface-400 focus:bg-white dark:focus:bg-surface-100 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Sinopsis o Ficha Crítica
              </label>
              <textarea
                rows={3}
                placeholder="Breve reseña sobre el contenido de la obra..."
                value={newSynopsis}
                onChange={(e) => setNewSynopsis(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-surface-400 focus:bg-white dark:focus:bg-surface-100 transition-colors"
              />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Zona Dropzone de Archivo */}
            <div className="p-6 border border-dashed border-stone-300 dark:border-surface-300 rounded-xl bg-stone-50 dark:bg-surface-200 text-center hover:bg-stone-100 dark:hover:bg-surface-300/40 transition-colors">
              <FileText size={32} className="text-stone-600 dark:text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                {uploadedFileName
                  ? `Archivo listo: ${uploadedFileName}`
                  : 'Cargar archivo de texto digitalizado'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Formatos aceptados: <code className="font-mono text-stone-700 dark:text-stone-300">.txt</code>, <code className="font-mono text-stone-700 dark:text-stone-300">.md</code>
              </p>
              <label className="mt-3 inline-block px-4 py-2 rounded-lg bg-stone-900 dark:bg-surface-300 text-stone-50 dark:text-stone-100 text-xs font-semibold cursor-pointer hover:bg-stone-800 dark:hover:bg-surface-400 transition-all shadow-subtle">
                Seleccionar Archivo Local
                <input
                  type="file"
                  accept=".txt,.md,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Ingesta Directa de Texto */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Cuerpo del Texto
                </label>
                <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                  <span>{newFullText.length} caracteres</span>
                  {previewEstimatedPages > 0 && (
                    <span className="text-stone-700 dark:text-stone-300 font-semibold">
                      ~{previewEstimatedPages} páginas estimadas
                    </span>
                  )}
                </div>
              </div>
              <textarea
                rows={8}
                placeholder="Pega aquí el contenido transcrito del libro, capítulos o páginas completas para que queden disponibles para lectura inmediata..."
                value={newFullText}
                onChange={(e) => setNewFullText(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 rounded-lg text-sm font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-surface-400 focus:bg-white dark:focus:bg-surface-100 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Pie de Acciones */}
        <div className="pt-3 border-t border-stone-200 dark:border-surface-300 flex items-center justify-between">
          {uploadTab === 'meta' ? (
            <button
              type="button"
              onClick={() => setUploadTab('content')}
              className="text-xs text-stone-700 dark:text-stone-300 font-semibold hover:underline cursor-pointer"
            >
              Siguiente: Adjuntar texto del tomo →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setUploadTab('meta')}
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white font-semibold text-xs transition-all shadow-subtle disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Incorporando...</span>
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
