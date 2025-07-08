import { ProcessedFile } from '../types';

export class DocumentAnalyzerService {
  private worker: Worker | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!this.worker && !this.isInitialized) {
      this.worker = new Worker(
        new URL('../workers/pyodideWorker.ts', import.meta.url),
        { type: 'module' }
      );
      
      // Wait for worker to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Worker initialization timeout'));
        }, 30000);

        this.worker!.onmessage = (e) => {
          if (e.data.type === 'ready') {
            clearTimeout(timeout);
            this.isInitialized = true;
            resolve();
          }
        };

        this.worker!.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };

        // Send initialization message
        this.worker!.postMessage({ type: 'init' });
      });
    }
  }

  async analyzeDocuments(files: ProcessedFile[], examCode: string): Promise<ProcessedFile[]> {
    if (!this.worker || !this.isInitialized) {
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
                status: 'processing' as const
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
      this.isInitialized = false;
    }
  }
}