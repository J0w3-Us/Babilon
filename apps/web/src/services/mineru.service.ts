import { MinerUScanResult } from '@babilon/shared-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMinerUScanResult(value: unknown): value is MinerUScanResult {
  if (!isRecord(value) || value.engine !== 'mineru' || value.success !== true) return false;
  if (typeof value.rawMarkdown !== 'string') return false;
  if (!Array.isArray(value.paginas) || typeof value.pageCount !== 'number') return false;
  if (value.pageCount !== value.paginas.length) return false;

  return value.paginas.every(
    (page, index) =>
      isRecord(page) &&
      page.numero === index + 1 &&
      typeof page.texto === 'string' &&
      typeof page.conteo_palabras === 'number'
  );
}

export interface IMinerUScannerService {
  scan(file: File, onUploadProgress?: (loaded: number, total: number) => void): Promise<{
    success: boolean;
    data?: MinerUScanResult;
    message?: string;
  }>;
}

export class MinerUHttpScannerService implements IMinerUScannerService {
  private readonly endpoint: string;

  constructor(endpoint: string = '/api/v1/scan/mineru') {
    this.endpoint = endpoint;
  }

  async scan(
    file: File,
    onUploadProgress?: (loaded: number, total: number) => void
  ): Promise<{
    success: boolean;
    data?: MinerUScanResult;
    message?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const responseBody = await new Promise<unknown>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', this.endpoint);
        request.responseType = 'json';
        request.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) onUploadProgress?.(event.loaded, event.total);
        });
        request.upload.addEventListener('load', () => {
          onUploadProgress?.(file.size, file.size);
        });
        request.addEventListener('load', () => {
          if (request.status >= 200 && request.status < 300) {
            resolve(request.response);
            return;
          }
          resolve({
            success: false,
            message: isRecord(request.response) && typeof request.response.message === 'string'
              ? request.response.message
              : `Error al procesar el documento (HTTP ${request.status}).`,
          });
        });
        request.addEventListener('error', () => reject(new Error('Error de red durante el escaneo.')));
        request.addEventListener('abort', () => reject(new Error('La petición de escaneo fue cancelada.')));
        request.send(formData);
      });

      if (!isRecord(responseBody)) {
        return {
          success: false,
          message: 'El servicio de escaneo devolvió una respuesta con formato inválido.',
        };
      }

      if (responseBody.success !== true) {
        return {
          success: false,
          message:
            typeof responseBody.message === 'string'
              ? responseBody.message
              : 'Error al procesar el documento con MinerU.',
        };
      }

      if (!isMinerUScanResult(responseBody.data)) {
        return {
          success: false,
          message: 'MinerU no devolvió páginas estructuradas válidas.',
        };
      }

      return {
        success: true,
        data: responseBody.data,
        message: typeof responseBody.message === 'string' ? responseBody.message : undefined,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error en la petición de escaneo';
      return {
        success: false,
        message: `No se pudo comunicar con el servicio MinerU: ${errorMsg}`,
      };
    }
  }
}

export const mineruScannerService = new MinerUHttpScannerService();
