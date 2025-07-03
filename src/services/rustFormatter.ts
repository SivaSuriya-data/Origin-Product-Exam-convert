import { ProcessedFile, ExamConfig } from '../types';

export class RustFormatterService {
  private wasmModule: any = null;
  private formatter: any = null;

  async initialize(): Promise<void> {
    if (!this.wasmModule) {
      // Load the WASM module
      const wasmModule = await import('../../rust-formatter/pkg');
      await wasmModule.default();
      this.wasmModule = wasmModule;
      this.formatter = new wasmModule.DocumentFormatter();
    }
  }

  async formatDocuments(
    files: ProcessedFile[],
    examConfig: ExamConfig,
    onProgress?: (progress: number) => void
  ): Promise<ProcessedFile[]> {
    if (!this.formatter) {
      await this.initialize();
    }

    // Set the configuration
    this.formatter.set_config(examConfig);

    const formattedFiles: ProcessedFile[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Update progress
        if (onProgress) {
          onProgress((i / total) * 100);
        }

        // Convert file to array buffer
        const arrayBuffer = await file.file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Format the document using Rust WASM
        const formattedData = await this.formatter.format_document(
          uint8Array,
          file.detectedType,
          file.originalName
        );

        // Create a new blob from the formatted data
        const formattedBlob = new Blob([formattedData], {
          type: this.getOutputMimeType(file.detectedType, examConfig)
        });

        formattedFiles.push({
          ...file,
          status: 'completed',
          progress: 100,
          formattedFile: formattedBlob
        });

      } catch (error) {
        console.error(`Error formatting file ${file.originalName}:`, error);
        formattedFiles.push({
          ...file,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (onProgress) {
      onProgress(100);
    }

    return formattedFiles;
  }

  private getOutputMimeType(documentType: string, examConfig: ExamConfig): string {
    const format = documentType === 'photo' 
      ? examConfig.formats.photo.format
      : documentType === 'signature'
      ? examConfig.formats.signature.format
      : examConfig.formats.documents.format;

    switch (format) {
      case 'JPEG':
        return 'image/jpeg';
      case 'PNG':
        return 'image/png';
      case 'PDF':
        return 'application/pdf';
      default:
        return 'image/jpeg';
    }
  }

  private getFileExtension(documentType: string, examConfig: ExamConfig): string {
    const format = documentType === 'photo' 
      ? examConfig.formats.photo.format
      : documentType === 'signature'
      ? examConfig.formats.signature.format
      : examConfig.formats.documents.format;

    switch (format) {
      case 'JPEG':
        return 'jpg';
      case 'PNG':
        return 'png';
      case 'PDF':
        return 'pdf';
      default:
        return 'jpg';
    }
  }
}