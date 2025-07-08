import { ProcessedFile, ExamConfig } from '../types';

export class RustFormatterService {
  private wasmModule: any = null;
  private formatter: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!this.wasmModule && !this.isInitialized) {
      // Load the WASM module
      try {
        const wasmModule = await import('../../rust-formatter/pkg');
        await wasmModule.default();
        this.wasmModule = wasmModule;
        this.formatter = new wasmModule.DocumentFormatter();
        this.isInitialized = true;
        console.log('Rust WASM module initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Rust WASM module:', error);
        throw new Error('Failed to load document formatter. Please refresh the page.');
      }
    }
  }

  async setExamConfig(examConfig: ExamConfig): Promise<void> {
    if (!this.formatter) {
      await wasmModule.default();
    }
    
    try {
      this.formatter.set_config(examConfig);
      console.log(`Exam configuration set for: ${examConfig.name}`);
    } catch (error) {
      console.error('Failed to set exam configuration:', error);
      throw new Error('Failed to configure document formatter');
    }
  }

  async formatDocuments(
    files: ProcessedFile[],
    examConfig: ExamConfig,
    onProgress?: (progress: number) => void
  ): Promise<ProcessedFile[]> {
    if (!this.formatter || !this.isInitialized) {
      await this.initialize();
      await this.setExamConfig(examConfig);
    }


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
        const outputFormat = this.getOutputMimeType(file.detectedType, examConfig);
        const fileExtension = this.getFileExtension(file.detectedType, examConfig);
        const formattedBlob = new Blob([formattedData], {
          type: outputFormat
        });

        // Update filename with correct extension
        const finalName = file.newName.includes('.') 
          ? file.newName 
          : `${file.newName}.${fileExtension}`;
        formattedFiles.push({
          ...file,
          newName: finalName,
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