import { useState, useMemo } from 'react';
import { BookGenre, MinerUScanResult } from '@babilon/shared-types';
import { createBookApi } from '@/services/api';
import { mineruScannerService } from '@/services/mineru.service';
import { splitTextIntoPages, formatPagesToDocument } from '@/lib/pageSplitter';

export interface UseBookUploadOptions {
  onSuccess?: () => void;
}

export function useBookUpload({ onSuccess }: UseBookUploadOptions = {}) {
  const [uploadTab, setUploadTab] = useState<'meta' | 'content'>('meta');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [genre, setGenre] = useState<BookGenre>('Ficción');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [publisher, setPublisher] = useState('Editorial Babilon');
  const [synopsis, setSynopsis] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [fullText, setFullText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<MinerUScanResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploadedFileName(file.name);
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (isPdf) {
      setIsScanning(true);
      setStatusMessage({
        type: 'info',
        text: 'Escaneando PDF con MinerU Engine: extrayendo Markdown y metadatos...',
      });

      try {
        const result = await mineruScannerService.scan(file);
        if (result.success && result.data) {
          const scan = result.data;
          setScanResult(scan);
          setFullText(scan.rawMarkdown || '');

          if (!title && scan.suggestedTitle) setTitle(scan.suggestedTitle);
          if (!author && scan.suggestedAuthor) setAuthor(scan.suggestedAuthor);
          if (!isbn && scan.suggestedIsbn) setIsbn(scan.suggestedIsbn);
          if (!synopsis && scan.suggestedSynopsis) setSynopsis(scan.suggestedSynopsis);

          setStatusMessage({
            type: 'success',
            text: `¡PDF procesado exitosamente con MinerU! Markdown generado y listo para revisión.`,
          });
          // Auto-switch a la pestaña de metadatos para que el usuario vea los campos auto-rellenados
          setUploadTab('meta');
        } else {
          setStatusMessage({
            type: 'error',
            text: result.message || 'No se pudo completar el análisis del PDF con MinerU.',
          });
        }
      } catch {
        setStatusMessage({
          type: 'error',
          text: 'Fallo inesperado al conectar con el motor de escaneo MinerU.',
        });
      } finally {
        setIsScanning(false);
      }
      return;
    }

    // Archivos de texto plano (.txt, .md)
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        // Dividir y estructurar en páginas reales
        const parsedPages = splitTextIntoPages(text);
        const formattedDoc = formatPagesToDocument(parsedPages);
        setFullText(formattedDoc);

        if (!synopsis && parsedPages.length > 0) {
          const firstPageClean = parsedPages[0].texto.slice(0, 260).trim();
          setSynopsis(firstPageClean + (firstPageClean.length >= 260 ? '...' : ''));
        }
      }
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setUploadedFileName(null);
    setFullText('');
    setScanResult(null);
    setStatusMessage(null);
  };

  const submitBook = async () => {
    if (!title.trim() || !author.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor completa al menos el título y el autor de la obra.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // Convertir el texto en páginas estructuradas limpias para MongoDB
      let paginas = undefined;
      let sampleChapterText: string | undefined = undefined;

      if (fullText.trim()) {
        const parsedPages = splitTextIntoPages(fullText);
        paginas = parsedPages.map((p) => ({
          numero: p.numero,
          texto: p.texto,
          conteo_palabras: p.conteo_palabras,
        }));

        // Preparar muestra para vista rápida
        sampleChapterText = formatPagesToDocument(parsedPages.slice(0, 3));
      }

      const isbnVal = isbn.trim() || `ISBN-BAB-${Date.now().toString().slice(-6)}`;

      const res = await createBookApi({
        title: title.trim(),
        isbn: isbnVal,
        author: { name: author.trim() },
        genres: [genre],
        publishedYear: Number(year) || new Date().getFullYear(),
        publisher: publisher.trim() || 'Editorial Babilon',
        synopsis: synopsis.trim() || 'Sin sinopsis registrada.',
        coverUrl: coverUrl.trim() || undefined,
        sampleChapterText,
        fullText: fullText.trim() || undefined,
        paginas,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: '¡Obra y texto preservados exitosamente en el catálogo!',
        });
        if (onSuccess) {
          setTimeout(onSuccess, 800);
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

  const previewEstimatedPages = useMemo(() => {
    if (!fullText.trim()) return 0;
    const pages = splitTextIntoPages(fullText);
    return pages.length;
  }, [fullText]);

  return {
    state: {
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
      scanResult,
      uploadedFileName,
      statusMessage,
      previewEstimatedPages,
    },
    actions: {
      setUploadTab,
      setTitle,
      setAuthor,
      setIsbn,
      setGenre,
      setYear,
      setPublisher,
      setSynopsis,
      setCoverUrl,
      setFullText,
      handleFileUpload,
      submitBook,
      clearFile,
    },
  };
}
