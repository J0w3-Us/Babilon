import { MinerUScanResult } from '@babilon/shared-types';

export interface IMinerUScannerService {
  scan(file: File): Promise<{
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

  async scan(file: File): Promise<{
    success: boolean;
    data?: MinerUScanResult;
    message?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(this.endpoint, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          message: json.message || 'Error al procesar el documento con MinerU.',
        };
      }

      return {
        success: true,
        data: json.data as MinerUScanResult,
        message: json.message,
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
