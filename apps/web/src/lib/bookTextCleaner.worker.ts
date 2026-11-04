import { cleanAndStructureBookDocument } from './bookTextCleaner';
import type { BookTextMetadata, CleanBookDocumentResult } from './bookTextCleaner';

interface CleanWorkerRequest {
  markdown: string;
  metadata: BookTextMetadata;
}

type CleanWorkerResponse =
  | { type: 'success'; result: CleanBookDocumentResult }
  | { type: 'error'; message: string };

self.onmessage = (event: MessageEvent<CleanWorkerRequest>) => {
  try {
    const result = cleanAndStructureBookDocument(
      event.data.markdown,
      event.data.metadata
    );
    const response: CleanWorkerResponse = { type: 'success', result };
    self.postMessage(response);
  } catch (error: unknown) {
    const response: CleanWorkerResponse = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Error al limpiar el documento.',
    };
    self.postMessage(response);
  }
};
