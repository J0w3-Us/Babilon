import { useState } from 'react';
import { BookGenre, MinerUScanResult } from '@babilon/shared-types';
import { createBookApi } from '@/services/api';
import { mineruScannerService } from '@/services/mineru.service';

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
        setFullText(text);
        if (!synopsis) {
          setSynopsis(text.slice(0, 220).trim() + '...');
        }
      }
    };
    reader.readAsText(file);
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
      // Convertir el Markdown o texto dividido por páginas en la estructura 'paginas' de MongoDB
      let paginas = undefined;
      if (fullText.trim()) {
        const rawPages = fullText.split(/\n\s*---\s*\n/);
        paginas = rawPages.map((pageContent, idx) => ({
          numero: idx + 1,
          texto: pageContent.trim(),
          conteo_palabras: pageContent.trim().split(/\s+/).filter(Boolean).length,
        }));
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

  const previewEstimatedPages = fullText
    ? Math.max(1, Math.ceil(fullText.length / 1800))
    : 0;

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
    },
  };
}
