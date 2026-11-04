import { cleanAndStructureBookDocument } from './bookTextCleaner';
import type { BookTextMetadata, CleanBookDocumentResult } from './bookTextCleaner';

type CleanWorkerResponse =
  | { type: 'success'; result: CleanBookDocumentResult }
  | { type: 'error'; message: string };

export async function cleanAndStructureBookDocumentAsync(
  markdown: string,
  metadata: BookTextMetadata = {}
): Promise<CleanBookDocumentResult> {
  if (markdown.length < 80_000) {
    return cleanAndStructureBookDocument(markdown, metadata);
  }
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    throw new Error('Este navegador no permite limpiar documentos grandes en segundo plano.');
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./bookTextCleaner.worker.ts', import.meta.url), {
      type: 'module',
    });
    const timeoutId = window.setTimeout(() => {
      worker.terminate();
      reject(new Error('La limpieza del documento tardó demasiado.'));
    }, 60_000);

    const finish = () => {
      window.clearTimeout(timeoutId);
      worker.terminate();
    };

    worker.onmessage = (event: MessageEvent<CleanWorkerResponse>) => {
      finish();
      if (event.data.type === 'error') {
        reject(new Error(event.data.message));
        return;
      }
      resolve(event.data.result);
    };
    worker.onerror = (event) => {
      finish();
      reject(new Error(event.message || 'No se pudo limpiar el documento.'));
    };
    worker.postMessage({ markdown, metadata });
  });
}
