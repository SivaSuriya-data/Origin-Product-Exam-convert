import { ProcessedFile } from '../types';

export class DocumentAnalyzerService {
  private worker: Worker | null = null;

  async initialize(): Promise<void> {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('../workers/pyodideWorker.ts', import.meta.url),
        { type: 'module' }
      );
    }
  }

  async analyzeDocuments(files: ProcessedFile[], examCode: string): Promise<ProcessedFile[]> {
    if (!this.worker) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Document analysis timeout'));
      }, 30000);

      this.worker.onmessage = (e) => {
        clearTimeout(timeout);
        const { type, data, error } = e.data;

        if (type === 'error') {
          reject(new Error(error));
        } else if (type === 'result') {
          const updatedFiles = files.map(file => {
            const result = data.find((r: any) => r.id === file.id);
            if (result) {
              return {
                ...file,
                detectedType: result.detectedType,
                newName: result.newName,
                status: 'completed' as const
              };
            }
            return file;
          });
          resolve(updatedFiles);
        }
      };

      this.worker.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      this.worker.postMessage({
        type: 'analyze',
        data: {
          files: files.map(f => ({ id: f.id, name: f.originalName })),
          examCode
        }
      });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}