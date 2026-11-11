'use client';

import { useState, useEffect } from 'react';
import { Book } from '@babilon/shared-types';
import Swal from 'sweetalert2';
import {
  X,
  BookOpen,
  Calendar,
  Building2,
  Tag,
  Hash,
  BookmarkCheck,
  User,
  Layers,
  Pencil,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useReadingProgress } from './hooks/useReadingProgress';
import { useAuth } from '@/context/AuthContext';
import { deleteBookApi, updateBookApi } from '@/services/api';

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  onRead: (book: Book) => void;
  onBookUpdated?: () => void;
  onBookDeleted?: () => void;
}

export function BookDetailModal({
  book,
  onClose,
  onRead,
  onBookUpdated,
  onBookDeleted,
}: BookDetailModalProps) {
  const { isAdmin, token } = useAuth();
  const [imageError, setImageError] = useState(false);
  const { progress, progressPercent } = useReadingProgress(book.id);

  // Estado de edición (Solo Admin)
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState(book.title);
  const [editAuthor, setEditAuthor] = useState(book.author?.name || '');
  const [editYear, setEditYear] = useState(String(book.publishedYear || ''));
  const [editPublisher, setEditPublisher] = useState(book.publisher || '');
  const [editIsbn, setEditIsbn] = useState(book.isbn || '');
  const [editSynopsis, setEditSynopsis] = useState(book.synopsis || '');

  const primaryGenre = book.genres?.[0] || 'Clásicos';
  const hasCover = Boolean(book.coverUrl && !imageError);

  // Bloquear el scroll del fondo mientras el modal está abierto y cerrar con Escape
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSaveEdit = async () => {
    if (!token) {
      setActionError('Debes iniciar sesión como Administrador.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      const res = await updateBookApi(
        book.id,
        {
          title: editTitle.trim() || book.title,
          authorName: editAuthor.trim() || book.author?.name,
          publishedYear: Number(editYear) || book.publishedYear,
          publisher: editPublisher.trim(),
          isbn: editIsbn.trim(),
          synopsis: editSynopsis.trim(),
        },
        token
      );

      if (!res.success) {
        setActionError(res.message || 'No se pudo actualizar el libro.');
        return;
      }

      setIsEditing(false);
      onBookUpdated?.();
      Swal.fire({
        title: '¡Actualizado!',
        text: 'Los metadatos del libro fueron guardados correctamente.',
        icon: 'success',
        background: '#1c1917',
        color: '#f5f5f4',
        confirmButtonColor: '#C2593F',
        confirmButtonText: 'Aceptar',
        customClass: {
          popup: 'rounded-2xl border border-stone-800 shadow-2xl font-sans',
          title: 'font-serif text-xl font-bold text-stone-100',
          confirmButton: 'rounded-xl text-sm font-semibold px-5 py-2.5 shadow-md cursor-pointer',
        },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!token) {
      setActionError('Debes iniciar sesión como Administrador.');
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar esta obra?',
      html: `
        <div class="space-y-2 text-stone-300">
          <p class="text-sm">¿Estás seguro de que deseas eliminar permanentemente <b class="text-stone-100 font-serif">"${book.title}"</b> de la base de datos?</p>
          <p class="text-xs text-stone-400">Esta acción no se puede deshacer.</p>
        </div>
      `,
      icon: 'warning',
      iconColor: '#C2593F',
      background: '#1c1917',
      color: '#f5f5f4',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#292524',
      confirmButtonText: 'Sí, eliminar obra',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'rounded-3xl border border-stone-800 shadow-2xl p-6 font-sans',
        title: 'font-serif text-2xl font-bold text-stone-100 tracking-tight',
        confirmButton: 'rounded-xl text-xs font-semibold px-5 py-2.5 bg-red-600 hover:bg-red-700 shadow-md cursor-pointer transition-colors',
        cancelButton: 'rounded-xl text-xs font-semibold px-5 py-2.5 border border-stone-700 text-stone-300 hover:bg-stone-800 cursor-pointer transition-colors',
      },
    });

    if (!result.isConfirmed) return;

    setSaving(true);
    setActionError(null);
    try {
      const res = await deleteBookApi(book.id, token);
      if (!res.success) {
        setActionError(res.message || 'No se pudo eliminar el libro.');
        Swal.fire({
          title: 'Error',
          text: res.message || 'No se pudo eliminar el libro.',
          icon: 'error',
          iconColor: '#ef4444',
          background: '#1c1917',
          color: '#f5f5f4',
          confirmButtonColor: '#C2593F',
          confirmButtonText: 'Cerrar',
          customClass: {
            popup: 'rounded-2xl border border-stone-800 shadow-2xl font-sans',
            title: 'font-serif text-xl font-bold text-stone-100',
            confirmButton: 'rounded-xl text-sm font-semibold px-5 py-2.5 cursor-pointer',
          },
        });
        return;
      }

      onBookDeleted?.();
      Swal.fire({
        title: '¡Eliminado!',
        text: 'El libro fue eliminado permanentemente de la base de datos.',
        icon: 'success',
        iconColor: '#C2593F',
        background: '#1c1917',
        color: '#f5f5f4',
        confirmButtonColor: '#C2593F',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'rounded-2xl border border-stone-800 shadow-2xl font-sans',
          title: 'font-serif text-xl font-bold text-stone-100',
          confirmButton: 'rounded-xl text-sm font-semibold px-5 py-2.5 cursor-pointer',
        },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        className="relative w-full max-w-5xl my-auto bg-cream-50 dark:bg-surface-100 rounded-3xl border border-stone-200/90 dark:border-surface-300 shadow-2xl overflow-hidden flex flex-col md:flex-row text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200"
      >
        {/* LADO IZQUIERDO: Portada del Libro y Badges */}
        <div className="relative w-full md:w-5/12 h-72 md:h-auto min-h-[360px] md:min-h-[520px] bg-cream-200 dark:bg-surface-200 border-b md:border-b-0 md:border-r border-stone-200/80 dark:border-surface-300 overflow-hidden flex flex-col justify-between shrink-0">
          {hasCover ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={book.coverUrl}
                alt={`Portada de ${book.title}`}
                onError={() => setImageError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-black" />
          )}

          {/* Badges superiores sobre portada */}
          <div className="relative z-10 p-5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-[11px] font-semibold text-stone-100 tracking-wider uppercase border border-white/10">
              <Tag size={12} className="text-terracotta-400" />
              {primaryGenre}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono text-stone-200 border border-white/10">
              <Layers size={12} />
              {book.pageCount ? `${book.pageCount} págs.` : 'Tomo digital'}
            </span>
          </div>

          {/* Título y Código sobre la portada */}
          <div className="relative z-10 p-6 pt-0">
            <p className="font-mono text-[11px] text-terracotta-300 tracking-widest uppercase mb-1">
              {isEditing ? editIsbn || 'ARCHIVO-BABILON' : book.isbn || 'ARCHIVO-BABILON'}
            </p>
            <h2
              id="book-detail-title"
              className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight drop-shadow-md line-clamp-3"
            >
              {isEditing ? editTitle || book.title : book.title}
            </h2>
            <div className="flex items-center gap-1.5 mt-2 text-stone-200 text-sm font-medium">
              <User size={14} className="text-stone-300 shrink-0" />
              <span className="truncate">
                {isEditing
                  ? editAuthor || 'Autor Desconocido'
                  : book.author?.name || 'Autor Desconocido'}
              </span>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: Ficha bibliográfica, Sinopsis Completa sin scroll interno y Acciones */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 md:p-9">
          <div className="space-y-6">
            {actionError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-surface-300">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-terracotta-700 dark:text-terracotta-400">
                    Editar Metadatos de la Obra (Modo Administrador)
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar modal"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Autor
                    </label>
                    <input
                      type="text"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Editorial
                    </label>
                    <input
                      type="text"
                      value={editPublisher}
                      onChange={(e) => setEditPublisher(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Año
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        ISBN
                      </label>
                      <input
                        type="text"
                        value={editIsbn}
                        onChange={(e) => setEditIsbn(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Sinopsis & Argumento
                  </label>
                  <textarea
                    rows={7}
                    value={editSynopsis}
                    onChange={(e) => setEditSynopsis(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-stone-900 dark:text-stone-100 resize-none min-h-[150px] font-serif leading-relaxed focus:outline-none focus:border-stone-500"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Encabezado derecho: Temáticas, Acciones de Admin y Botón Cerrar (alineados de forma limpia) */}
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-stone-200/60 dark:border-surface-300">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 shrink-0">
                      Temáticas:
                    </span>
                    {book.genres && book.genres.length > 0 ? (
                      book.genres.map((g) => (
                        <span
                          key={g}
                          className="px-2.5 py-0.5 rounded-md bg-cream-200/80 dark:bg-surface-200 text-xs font-medium text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-surface-300 truncate"
                        >
                          {g}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-stone-400">General</span>
                    )}
                  </div>

                  {/* Grupo de Acciones: Editar, Eliminar y Cerrar sin solapamientos */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Pencil size={13} />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={handleDeleteBook}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                          <span>Eliminar</span>
                        </button>
                      </>
                    )}

                    <div className="h-5 w-[1px] bg-stone-200 dark:bg-surface-300 mx-0.5" />

                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Cerrar modal"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Progreso de lectura si existe */}
                {progress && (
                  <div className="p-4 rounded-2xl bg-cream-100/90 dark:bg-surface-200/80 border border-stone-200/80 dark:border-surface-300">
                    <div className="flex items-center justify-between text-xs font-semibold text-terracotta-700 dark:text-terracotta-300">
                      <div className="flex items-center gap-1.5">
                        <BookmarkCheck size={15} />
                        <span>Progreso de lectura</span>
                      </div>
                      <span>
                        Pág. {progress.pageNumber}
                        {progress.totalPages > 0 ? ` de ${progress.totalPages}` : ''}
                        {progressPercent !== null ? ` · ${progressPercent}%` : ''}
                      </span>
                    </div>
                    {progressPercent !== null && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-surface-300">
                        <div
                          className="h-full rounded-full bg-terracotta-600 dark:bg-terracotta-400 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Ficha Bibliográfica en 4 columnas */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
                    Ficha Bibliográfica
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/60 dark:bg-surface-200/50">
                      <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-[11px] mb-0.5">
                        <Calendar size={12} />
                        <span>Año</span>
                      </div>
                      <p className="font-semibold text-xs text-stone-900 dark:text-stone-100 font-mono">
                        {book.publishedYear || 'S/F'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/60 dark:bg-surface-200/50">
                      <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-[11px] mb-0.5">
                        <Building2 size={12} />
                        <span>Editorial</span>
                      </div>
                      <p
                        className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate"
                        title={book.publisher}
                      >
                        {book.publisher || 'Editorial Babilon'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/60 dark:bg-surface-200/50">
                      <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-[11px] mb-0.5">
                        <Layers size={12} />
                        <span>Extensión</span>
                      </div>
                      <p className="font-semibold text-xs text-stone-900 dark:text-stone-100 font-mono">
                        {book.pageCount ? `${book.pageCount} págs.` : 'N/A'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/60 dark:bg-surface-200/50">
                      <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-[11px] mb-0.5">
                        <Hash size={12} />
                        <span>ISBN</span>
                      </div>
                      <p
                        className="font-mono text-xs text-stone-900 dark:text-stone-100 truncate"
                        title={book.isbn}
                      >
                        {book.isbn || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sinopsis & Argumento Ampliada sin barra de scroll interna */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
                    Sinopsis & Argumento
                  </h3>
                  <div className="p-5 rounded-2xl bg-cream-100/60 dark:bg-surface-200/60 border border-stone-200/80 dark:border-surface-300">
                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif whitespace-pre-line">
                      {book.synopsis && book.synopsis.trim()
                        ? book.synopsis
                        : 'Sin sinopsis registrada para esta obra en el archivo.'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Botones de acción inferiores */}
          <div className="pt-6 mt-6 border-t border-stone-200/80 dark:border-surface-300 flex items-center justify-between gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl border border-stone-200/90 dark:border-surface-300 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-cream-200 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  <span>Guardar Cambios</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-stone-200/90 dark:border-surface-300 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-cream-200 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                >
                  Volver al catálogo
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRead(book);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-cream-50 text-xs font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <BookOpen size={15} />
                  <span>Leer Obra Completa</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
