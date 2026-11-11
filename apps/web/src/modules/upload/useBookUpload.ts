import { useEffect, useRef, useState } from 'react';
import { Book, BookGenre, MinerUScanResult } from '@babilon/shared-types';
import { createBookApi, requestUploadSecurityToken } from '@/services/api';
import { mineruScannerService } from '@/services/mineru.service';
import { parseSeparatedPages, splitTextIntoPages } from '@/lib/pageSplitter';
import { cleanAndFilterBookPages } from '@/lib/bookPageCleaner';
import { formatBookDocumentForUpload, formatPageTextStructure } from '@/lib/bookTextCleaner';
import type { StructuredBookDocument } from '@/lib/bookTextCleaner';
import { cleanAndStructureBookDocumentAsync } from '@/lib/bookTextCleanerAsync';
import { GENRES_LIST } from './bookUploadOptions';
import type { PageItem } from './PageManager';

export interface UseBookUploadOptions {
  onSuccess?: () => void;
}

type MinerUScanWithBookDraft = MinerUScanResult & {
  suggestedBookDraft?: Partial<Book>;
};

export type UploadProgressStage =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'cleaning'
  | 'complete'
  | 'error';

export interface UploadProgressState {
  stage: UploadProgressStage;
  percent: number;
  elapsedSeconds: number;
}

function generateBookIsbn(): string {
  return `ISBN-BAB-${Date.now().toString().slice(-6)}`;
}

export function useBookUpload({ onSuccess }: UseBookUploadOptions = {}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [genre, setGenre] = useState<BookGenre | ''>('');
  const [year, setYear] = useState<number | ''>('');
  const [publisher, setPublisher] = useState('Editorial Babilon');
  const [synopsis, setSynopsis] = useState('');
  const [fullText, setFullText] = useState('');
  const [cleanedDocument, setCleanedDocument] = useState<StructuredBookDocument | null>(null);
  const [pagesList, setPagesList] = useState<PageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({
    stage: 'idle',
    percent: 0,
    elapsedSeconds: 0,
  });
  const progressStartedAt = useRef<number | null>(null);
  const [scanResult, setScanResult] = useState<MinerUScanResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isScanning || progressStartedAt.current === null) return;
    const timer = window.setInterval(() => {
      const startedAt = progressStartedAt.current;
      if (startedAt !== null) {
        setUploadProgress((current) => ({
          ...current,
          elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
        }));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isScanning]);

  const startProgress = (stage: UploadProgressStage) => {
    progressStartedAt.current = Date.now();
    setUploadProgress({ stage, percent: 0, elapsedSeconds: 0 });
  };

  const finishProgress = (stage: 'complete' | 'error') => {
    const startedAt = progressStartedAt.current;
    setUploadProgress((current) => ({
      ...current,
      stage,
      percent: stage === 'complete' ? 100 : current.percent,
      elapsedSeconds: startedAt === null
        ? current.elapsedSeconds
        : Math.floor((Date.now() - startedAt) / 1000),
    }));
    progressStartedAt.current = null;
  };

  const togglePageExcluded = (id: string) => {
    setPagesList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, eliminada: !p.eliminada } : p))
    );
  };

  const restoreAllPages = () => {
    setPagesList((prev) => prev.map((p) => ({ ...p, eliminada: false })));
  };

  const handleFileUpload = async (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isTextFile = /\.(txt|md)$/i.test(file.name) || file.type === 'text/plain';

    if (!isPdf && !isTextFile) {
      setStatusMessage({
        type: 'error',
        text: 'Formato no compatible. Selecciona un PDF, TXT o MD.',
      });
      return;
    }

    setUploadedFileName(file.name);
    setTitle('');
    setAuthor('');
    setSynopsis('');
    setGenre('');
    setYear('');
    setIsbn(generateBookIsbn());
    setFullText('');
    setCleanedDocument(null);
    setScanResult(null);
    setPagesList([]);
    setUploadProgress({ stage: 'idle', percent: 0, elapsedSeconds: 0 });

    if (isPdf) {
      setIsScanning(true);
      startProgress('uploading');
      setStatusMessage({
        type: 'info',
        text: 'Procesando el PDF con el servicio de digitalización...',
      });

      try {
        const result = await mineruScannerService.scan(file, (loaded, total) => {
          const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
          setUploadProgress((current) => ({
            ...current,
            stage: percent >= 100 ? 'extracting' : 'uploading',
            percent,
          }));
        });
        if (result.success && result.data?.success !== false && result.data) {
          const scan = result.data;
          const scanWithBookDraft = scan as MinerUScanWithBookDraft;
          const draft = scanWithBookDraft.suggestedBookDraft;
          const extractedMetadata = scan.metadata;
          const detectedTitle = scan.suggestedTitle || draft?.title || extractedMetadata?.title;
          const detectedAuthor = scan.suggestedAuthor || draft?.author?.name || extractedMetadata?.author;
          const detectedIsbn = scan.suggestedIsbn || draft?.isbn || extractedMetadata?.isbn;
          const detectedSynopsis = scan.suggestedSynopsis || draft?.synopsis || extractedMetadata?.synopsis;
          const detectedGenre = draft?.genres?.[0] || extractedMetadata?.genres?.[0];
          const detectedYear = draft?.publishedYear ?? extractedMetadata?.publishedYear;
          const sourceMarkdown = scan.pages?.length
            ? [...scan.pages]
                .sort((left, right) => left.pageNumber - right.pageNumber)
                .map((page) => `--- Página ${page.pageNumber} ---\n${page.markdown}`)
                .join('\n\n')
            : scan.rawMarkdown || '';
          const documentTitle = title.trim() || detectedTitle || '';
          const documentAuthor = author.trim() || detectedAuthor || '';

          setStatusMessage({
            type: 'info',
            text: 'PDF recibido. Limpiando texto y separando páginas...',
          });
          setUploadProgress((current) => ({ ...current, stage: 'cleaning', percent: 0 }));
          const cleanedResult = await cleanAndStructureBookDocumentAsync(
            sourceMarkdown,
            { title: documentTitle, author: documentAuthor }
          );

          setScanResult({ ...scan, rawMarkdown: cleanedResult.cleanedMarkdown });
          setCleanedDocument(cleanedResult.structure);
          const formattedText = formatBookDocumentForUpload(cleanedResult.structure);
          setFullText(formattedText);

          // Construir lista interactiva de páginas con formato de párrafos y títulos
          let extractedPages: PageItem[] = [];
          if (scan.pages && scan.pages.length > 0) {
            extractedPages = [...scan.pages]
              .sort((a, b) => a.pageNumber - b.pageNumber)
              .map((p, idx) => {
                const formatted = formatPageTextStructure(p.markdown || '');
                return {
                  id: `page-${idx + 1}-${Date.now()}`,
                  originalIndex: p.pageNumber || idx + 1,
                  texto: formatted,
                  conteo_palabras: formatted.trim().split(/\s+/).filter(Boolean).length,
                  eliminada: false,
                };
              });
          } else {
            const rawParsed = parseSeparatedPages(formattedText) || splitTextIntoPages(formattedText);
            extractedPages = rawParsed.map((p, idx) => {
              const formatted = formatPageTextStructure(p.texto || '');
              return {
                id: `page-${idx + 1}-${Date.now()}`,
                originalIndex: p.numero || idx + 1,
                texto: formatted,
                conteo_palabras: p.conteo_palabras || formatted.trim().split(/\s+/).filter(Boolean).length,
                eliminada: false,
              };
            });
          }
          setPagesList(extractedPages);

          if (detectedTitle) setTitle((current) => current.trim() || detectedTitle);
          if (detectedAuthor) setAuthor((current) => current.trim() || detectedAuthor);
          if (detectedIsbn) setIsbn(detectedIsbn);
          if (detectedSynopsis) setSynopsis((current) => current.trim() || detectedSynopsis);
          if (detectedGenre && GENRES_LIST.includes(detectedGenre)) {
            setGenre((current) => current || detectedGenre);
          }
          if (typeof detectedYear === 'number' && Number.isInteger(detectedYear)) {
            setYear((current) => current === '' ? detectedYear : current);
          }
          const detectedPublisher = draft?.publisher;
          if (detectedPublisher) {
            setPublisher((current) =>
              current === 'Editorial Babilon' ? detectedPublisher : current
            );
          }

          setStatusMessage({
            type: 'success',
            text: `Documento procesado exitosamente (${extractedPages.length} páginas detectadas). Puedes revisar y excluir páginas si lo deseas.`,
          });
          finishProgress('complete');
        } else {
          setUploadedFileName(null);
          setIsbn('');
          setCleanedDocument(null);
          setFullText('');
          setPagesList([]);
          setStatusMessage({
            type: 'error',
            text: result.message || 'El servicio externo no pudo procesar el PDF.',
          });
          finishProgress('error');
        }
      } catch (error: unknown) {
        setUploadedFileName(null);
        setIsbn('');
        setCleanedDocument(null);
        setFullText('');
        setPagesList([]);
        setStatusMessage({
          type: 'error',
          text: error instanceof Error
            ? `No se pudo procesar el PDF: ${error.message}`
            : 'No se pudo procesar el PDF con el servicio externo.',
        });
        finishProgress('error');
      } finally {
        setIsScanning(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      if (typeof text === 'string' && text.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const documentTitle = title.trim() || cleanName;
        const documentAuthor = author.trim();
        setIsScanning(true);
        startProgress('cleaning');
        setStatusMessage({
          type: 'info',
          text: 'Limpiando texto y separando páginas...',
        });

        try {
          const cleanedResult = await cleanAndStructureBookDocumentAsync(text, {
            title: documentTitle,
            author: documentAuthor,
          });
          const formattedText = formatBookDocumentForUpload(cleanedResult.structure);
          const rawParsed = parseSeparatedPages(formattedText) || splitTextIntoPages(formattedText);
          const extractedPages: PageItem[] = rawParsed.map((p, idx) => ({
            id: `page-${idx + 1}-${Date.now()}`,
            originalIndex: p.numero || idx + 1,
            texto: p.texto || '',
            conteo_palabras: p.conteo_palabras || (p.texto || '').trim().split(/\s+/).filter(Boolean).length,
            eliminada: false,
          }));

          setTitle((current) => current.trim() || cleanName);
          setCleanedDocument(cleanedResult.structure);
          setFullText(formattedText);
          setPagesList(extractedPages);

          setStatusMessage({
            type: 'success',
            text: `Texto procesado con ${extractedPages.length} páginas. Puedes revisar y excluir páginas si lo deseas.`,
          });
          finishProgress('complete');
        } catch (error: unknown) {
          setUploadedFileName(null);
          setIsbn('');
          setCleanedDocument(null);
          setFullText('');
          setPagesList([]);
          setStatusMessage({
            type: 'error',
            text: error instanceof Error
              ? `No se pudo limpiar el documento: ${error.message}`
              : 'No se pudo limpiar el documento.',
          });
          finishProgress('error');
        } finally {
          setIsScanning(false);
        }
      } else {
        setUploadedFileName(null);
        setIsbn('');
        setPagesList([]);
        setStatusMessage({
          type: 'error',
          text: 'El archivo no contiene texto legible.',
        });
        setUploadProgress({ stage: 'error', percent: 0, elapsedSeconds: 0 });
      }
    };
    reader.onerror = () => {
      setUploadedFileName(null);
      setIsbn('');
      setPagesList([]);
      setStatusMessage({
        type: 'error',
        text: 'No se pudo leer el archivo seleccionado.',
      });
      setUploadProgress({ stage: 'error', percent: 0, elapsedSeconds: 0 });
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setUploadedFileName(null);
    setIsbn('');
    setFullText('');
    setCleanedDocument(null);
    setScanResult(null);
    setPagesList([]);
    setStatusMessage(null);
    setUploadProgress({ stage: 'idle', percent: 0, elapsedSeconds: 0 });
    progressStartedAt.current = null;
  };

  const handleTextChange = (text: string) => {
    setFullText(text);
    setCleanedDocument(null);
    setScanResult(null);
    const parsed = parseSeparatedPages(text) || splitTextIntoPages(text);
    setPagesList(
      parsed.map((p, idx) => ({
        id: `page-${idx + 1}-${Date.now()}`,
        originalIndex: p.numero || idx + 1,
        texto: p.texto || '',
        conteo_palabras: (p.texto || '').trim().split(/\s+/).filter(Boolean).length,
        eliminada: false,
      }))
    );
  };

  const submitBook = async () => {
    const currentYear = new Date().getFullYear();
    if (
      !title.trim() ||
      !author.trim() ||
      !genre ||
      year === '' ||
      !Number.isInteger(year) ||
      year < -3000 ||
      year > currentYear + 2
    ) {
      setStatusMessage({
        type: 'error',
        text: 'Completa título, autor, género y año con valores válidos.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // 1. Obtener páginas elegidas por el usuario (excluyendo las que quitó)
      const paginasConservadas = pagesList.filter((p) => !p.eliminada);

      if (pagesList.length > 0 && paginasConservadas.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'Has excluido todas las páginas. Debes conservar al menos una página para guardar la obra.',
        });
        return;
      }

      let paginasFinales: Array<{ numero: number; texto: string; conteo_palabras?: number }> = [];

      if (paginasConservadas.length > 0) {
        paginasFinales = paginasConservadas.map((p, idx) => {
          const formatted = formatPageTextStructure(p.texto);
          return {
            numero: idx + 1,
            texto: formatted,
            conteo_palabras: formatted.split(/\s+/u).filter(Boolean).length,
          };
        });
      } else {
        // Respaldo de páginas en texto si no vino por lista
        const uploadText = fullText.trim();
        const rawPaginas = uploadText
          ? parseSeparatedPages(uploadText) ?? [{
              numero: 1,
              texto: uploadText,
              conteo_palabras: uploadText.split(/\s+/u).filter(Boolean).length,
            }]
          : [];
        paginasFinales = cleanAndFilterBookPages(rawPaginas, {
          title: title.trim(),
          author: author.trim(),
        });
      }

      if (paginasFinales.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'No hay páginas de contenido para guardar.',
        });
        return;
      }

      const isbnVal = isbn.trim() || generateBookIsbn();

      setStatusMessage({
        type: 'info',
        text: 'Verificando disponibilidad de la base de datos y autorizando con JWT...',
      });

      const securityCheck = await requestUploadSecurityToken();
      if (!securityCheck.success || !securityCheck.token) {
        setStatusMessage({
          type: 'error',
          text:
            securityCheck.message ||
            'No se pudo validar la autorización de seguridad JWT.',
        });
        return;
      }

      setStatusMessage({
        type: 'info',
        text: `Guardando obra y ${paginasFinales.length} páginas en la base de datos...`,
      });

      const savedBook = await createBookApi(
        {
          title: title.trim(),
          isbn: isbnVal,
          author: { name: author.trim() },
          genres: [genre],
          publishedYear: year,
          publisher: publisher.trim() || 'Editorial Babilon',
          synopsis: synopsis.trim() || 'Sin sinopsis registrada.',
          pageCount: paginasFinales.length,
          paginas: paginasFinales,
        },
        securityCheck.token
      );

      if (!savedBook.success) {
        setStatusMessage({
          type: 'error',
          text: savedBook.message || 'No se pudo guardar la obra en el catálogo.',
        });
        return;
      }

      setStatusMessage({
        type: 'success',
        text: `¡Obra preservada exitosamente con ${paginasFinales.length} páginas!`,
      });
      if (onSuccess) setTimeout(onSuccess, 800);
    } catch (error: unknown) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado al guardar el libro.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    state: {
      title,
      author,
      isbn,
      genre,
      year,
      publisher,
      synopsis,
      fullText,
      cleanedDocument,
      pagesList,
      isSubmitting,
      isScanning,
      uploadProgress,
      scanResult,
      uploadedFileName,
      statusMessage,
    },
    actions: {
      setTitle,
      setAuthor,
      setGenre,
      setYear,
      setPublisher,
      setSynopsis,
      setFullText: handleTextChange,
      handleFileUpload,
      togglePageExcluded,
      restoreAllPages,
      submitBook,
      clearFile,
    },
  };
}
