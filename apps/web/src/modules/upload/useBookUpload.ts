import { useState, useEffect } from 'react';
import { Book, BookGenre, MinerUScanResult } from '@babilon/shared-types';
import { createBookApi } from '@/services/api';
import { mineruScannerService } from '@/services/mineru.service';
import { splitTextIntoPages } from '@/lib/pageSplitter';
import { formatBookDocumentForUpload,} from '@/lib/bookTextCleaner';
import type { StructuredBookDocument } from '@/lib/bookTextCleaner';
import { cleanAndStructureBookDocumentAsync } from '@/lib/bookTextCleanerAsync';
import { GENRES_LIST } from './bookUploadOptions';

export interface UseBookUploadOptions {
  onSuccess?: () => void;
}

type MinerUScanWithBookDraft = MinerUScanResult & {
  suggestedBookDraft?: Partial<Book>;
  coverUrl?: string;
};

function isHttpCoverUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function generateBookIsbn(): string {
  return `ISBN-BAB-${Date.now().toString().slice(-6)}`;
}

export function useBookUpload({ onSuccess }: UseBookUploadOptions = {}) {
  const [uploadTab, setUploadTab] = useState<'meta' | 'content'>('content');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [genre, setGenre] = useState<BookGenre | ''>('');
  const [year, setYear] = useState<number | ''>('');
  const [publisher, setPublisher] = useState('Editorial Babilon');
  const [synopsis, setSynopsis] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [extractedCoverPreviewUrl, setExtractedCoverPreviewUrl] = useState('');
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);
  const [customCoverPreviewUrl, setCustomCoverPreviewUrl] = useState('');
  const [fullText, setFullText] = useState('');
  const [cleanedDocument, setCleanedDocument] = useState<StructuredBookDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<MinerUScanResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!customCoverFile) {
      setCustomCoverPreviewUrl('');
      return;
    }

    const previewUrl = URL.createObjectURL(customCoverFile);
    setCustomCoverPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [customCoverFile]);

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
    setIsbn(generateBookIsbn());
    setFullText('');
    setCleanedDocument(null);
    setScanResult(null);
    setExtractedCoverPreviewUrl('');

    if (isPdf) {
      setIsScanning(true);
      setStatusMessage({
        type: 'info',
        text: 'Procesando el PDF con el servicio externo de digitalización...',
      });

      try {
        const result = await mineruScannerService.scan(file);
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
          const detectedCover = draft?.coverUrl || scanWithBookDraft.coverUrl;
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
            text: 'PDF recibido. Limpiando texto y separando capítulos del material extra...',
          });
          const cleanedResult = await cleanAndStructureBookDocumentAsync(
            sourceMarkdown,
            { title: documentTitle, author: documentAuthor }
          );

          setScanResult({ ...scan, rawMarkdown: cleanedResult.cleanedMarkdown });
          setCleanedDocument(cleanedResult.structure);
          setFullText(formatBookDocumentForUpload(cleanedResult.structure));

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
          if (detectedCover?.startsWith('data:image/')) {
            setExtractedCoverPreviewUrl(detectedCover);
          } else if (detectedCover && isHttpCoverUrl(detectedCover)) {
            setCoverUrl((current) => current.trim() || detectedCover);
          }
          const detectedPublisher = draft?.publisher;
          if (detectedPublisher) {
            setPublisher((current) =>
              current === 'Editorial Babilon' ? detectedPublisher : current
            );
          }

          setStatusMessage({
            type: 'success',
            text: cleanedResult.structure.body
              ? 'Texto limpio y estructurado. Revisa el cuerpo y el material extra antes de guardar.'
              : 'No se detectó cuerpo principal. Revisa el archivo antes de guardarlo.',
          });
          setUploadTab('meta');
        } else {
          setUploadedFileName(null);
          setIsbn('');
          setCleanedDocument(null);
          setFullText('');
          setStatusMessage({
            type: 'error',
            text: result.message || 'El servicio externo no pudo procesar el PDF.',
          });
        }
      } catch (error: unknown) {
        setUploadedFileName(null);
        setIsbn('');
        setCleanedDocument(null);
        setFullText('');
        setStatusMessage({
          type: 'error',
          text: error instanceof Error
            ? `No se pudo procesar el PDF: ${error.message}`
            : 'No se pudo procesar el PDF con el servicio externo.',
        });
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
        setStatusMessage({
          type: 'info',
          text: 'Limpiando texto y separando el cuerpo del material extra...',
        });

        try {
          const cleanedResult = await cleanAndStructureBookDocumentAsync(text, {
            title: documentTitle,
            author: documentAuthor,
          });
          const bodyPages = splitTextIntoPages(cleanedResult.structure.body);
          setTitle((current) => current.trim() || cleanName);
          setCleanedDocument(cleanedResult.structure);
          setFullText(formatBookDocumentForUpload(cleanedResult.structure));
          if (!synopsis && bodyPages.length > 0) {
            const firstPageClean = bodyPages[0].texto.slice(0, 260).trim();
            setSynopsis(firstPageClean + (firstPageClean.length >= 260 ? '...' : ''));
          }
          setStatusMessage({
            type: 'success',
            text: cleanedResult.structure.body
              ? 'Texto limpio y organizado para su revisión.'
              : 'No se detectó cuerpo principal. Revisa el archivo antes de guardarlo.',
          });
          setUploadTab('meta');
        } catch (error: unknown) {
          setUploadedFileName(null);
          setIsbn('');
          setCleanedDocument(null);
          setFullText('');
          setStatusMessage({
            type: 'error',
            text: error instanceof Error
              ? `No se pudo limpiar el documento: ${error.message}`
              : 'No se pudo limpiar el documento.',
          });
        } finally {
          setIsScanning(false);
        }
      } else {
        setUploadedFileName(null);
        setIsbn('');
        setStatusMessage({
          type: 'error',
          text: 'El archivo no contiene texto legible.',
        });
      }
    };
    reader.onerror = () => {
      setUploadedFileName(null);
      setIsbn('');
      setStatusMessage({
        type: 'error',
        text: 'No se pudo leer el archivo seleccionado.',
      });
    };
    reader.readAsText(file);
  };

  const selectCustomCover = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Selecciona un archivo de imagen válido.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'La imagen de portada debe pesar menos de 5 MB.' });
      return;
    }

    setCustomCoverFile(file);
    setStatusMessage(null);
  };

  const clearFile = () => {
    setUploadedFileName(null);
    setIsbn('');
    setFullText('');
    setCleanedDocument(null);
    setScanResult(null);
    setExtractedCoverPreviewUrl('');
    setStatusMessage(null);
  };

  const handleTextChange = (text: string) => {
    setFullText(text);
    setCleanedDocument(null);
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
      setUploadTab('meta');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // Convertir el texto en páginas estructuradas limpias para MongoDB
      let uploadText = fullText;
      let documentForUpload = cleanedDocument;
      if (fullText.trim() && !cleanedDocument) {
        const cleanedResult = await cleanAndStructureBookDocumentAsync(fullText, {
          title: title.trim(),
          author: author.trim(),
        });
        documentForUpload = cleanedResult.structure;
        setCleanedDocument(cleanedResult.structure);
        uploadText = formatBookDocumentForUpload(cleanedResult.structure);
        setFullText(uploadText);
      }

      const bodyText = documentForUpload?.body ?? uploadText;
      if (fullText.trim() && !bodyText.trim()) {
        setStatusMessage({
          type: 'error',
          text: 'No se identificó un cuerpo principal para la obra. Revisa el documento antes de guardarlo.',
        });
        return;
      }

      // Versión 2: respetar la estructura física que trae MinerU (page_idx) y no volver a dividir
      // el texto por caracteres o por longitud. Solo se usa splitTextIntoPages cuando el contenido
      // llega sin una paginación explícita (TXT/MD manual), donde no existe una fuente de verdad.
      const paginas = scanResult?.paginas?.length
        ? scanResult.paginas.map((page) => ({
            numero: page.numero,
            texto: page.texto,
            conteo_palabras: page.conteo_palabras ?? 0,
          }))
        : uploadText.trim()
          ? splitTextIntoPages(uploadText).map((page) => ({
              numero: page.numero,
              texto: page.texto,
              conteo_palabras: page.conteo_palabras,
            }))
          : [];

      const isbnVal = isbn.trim() || generateBookIsbn();

      const savedBook = await createBookApi({
        title: title.trim(),
        isbn: isbnVal,
        author: { name: author.trim() },
        genres: [genre],
        publishedYear: year,
        publisher: publisher.trim() || 'Editorial Babilon',
        synopsis: synopsis.trim() || 'Sin sinopsis registrada.',
        pageCount: paginas.length,
        coverUrl: coverUrl.trim() || undefined,
        paginas,
      });

      if (!savedBook.success) {
        setStatusMessage({
          type: 'error',
          text: savedBook.message || 'No se pudo guardar la obra en el catálogo.',
        });
        return;
      }

      setStatusMessage({
        type: 'success',
        text: '¡Obra y páginas preservadas exitosamente en el catálogo!',
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
      uploadTab,
      title,
      author,
      isbn,
      genre,
      year,
      publisher,
      coverPreviewUrl: customCoverPreviewUrl || coverUrl || extractedCoverPreviewUrl,
      hasCustomCover: customCoverFile !== null,
      fullText,
      cleanedDocument,
      isSubmitting,
      isScanning,
      scanResult,
      uploadedFileName,
      statusMessage,
    },
    actions: {
      setUploadTab,
      setTitle,
      setAuthor,
      setGenre,
      setYear,
      setPublisher,
      selectCustomCover,
      removeCustomCover: () => setCustomCoverFile(null),
      setFullText: handleTextChange,
      handleFileUpload,
      submitBook,
      clearFile,
    },
  };
}
