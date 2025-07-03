export interface ExamConfig {
  name: string;
  code: string;
  formats: {
    photo: DocumentFormat;
    signature: DocumentFormat;
    documents: DocumentFormat;
  };
  maxFileSize: number; // in KB
  allowedFormats: string[];
  documentTypes: string[];
}

export interface DocumentFormat {
  width: number;
  height: number;
  dpi: number;
  format: 'JPEG' | 'PNG' | 'PDF';
  quality: number;
  maxSize: number; // in KB
}

export interface ProcessedFile {
  id: string;
  originalName: string;
  detectedType: string;
  newName: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  formattedFile?: Blob;
  error?: string;
}

export interface ConversionResult {
  success: boolean;
  files: ProcessedFile[];
  zipBlob?: Blob;
  error?: string;
}

export interface PyodideWorkerMessage {
  type: 'analyze' | 'result' | 'error';
  data?: any;
  error?: string;
}

export interface RustFormatterMessage {
  type: 'format' | 'result' | 'error';
  data?: any;
  error?: string;
}