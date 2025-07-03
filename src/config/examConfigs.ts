import { ExamConfig } from '../types';

export const EXAM_CONFIGS: Record<string, ExamConfig> = {
  upsc: {
    name: 'UPSC',
    code: 'upsc',
    formats: {
      photo: {
        width: 300,
        height: 400,
        dpi: 300,
        format: 'JPEG',
        quality: 85,
        maxSize: 200
      },
      signature: {
        width: 300,
        height: 100,
        dpi: 300,
        format: 'JPEG',
        quality: 85,
        maxSize: 50
      },
      documents: {
        width: 800,
        height: 1200,
        dpi: 200,
        format: 'PDF',
        quality: 80,
        maxSize: 500
      }
    },
    maxFileSize: 2048,
    allowedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    documentTypes: ['photo', 'signature', 'aadhaar', 'marksheet', 'certificate', 'caste_certificate']
  },
  neet: {
    name: 'NEET',
    code: 'neet',
    formats: {
      photo: {
        width: 200,
        height: 230,
        dpi: 200,
        format: 'JPEG',
        quality: 80,
        maxSize: 100
      },
      signature: {
        width: 200,
        height: 80,
        dpi: 200,
        format: 'JPEG',
        quality: 80,
        maxSize: 30
      },
      documents: {
        width: 600,
        height: 800,
        dpi: 150,
        format: 'JPEG',
        quality: 75,
        maxSize: 300
      }
    },
    maxFileSize: 1024,
    allowedFormats: ['image/jpeg', 'image/png'],
    documentTypes: ['photo', 'signature', 'class10_marksheet', 'class12_marksheet', 'aadhaar']
  },
  jee: {
    name: 'JEE',
    code: 'jee',
    formats: {
      photo: {
        width: 240,
        height: 320,
        dpi: 200,
        format: 'JPEG',
        quality: 80,
        maxSize: 150
      },
      signature: {
        width: 240,
        height: 80,
        dpi: 200,
        format: 'JPEG',
        quality: 80,
        maxSize: 40
      },
      documents: {
        width: 600,
        height: 800,
        dpi: 150,
        format: 'JPEG',
        quality: 75,
        maxSize: 400
      }
    },
    maxFileSize: 1536,
    allowedFormats: ['image/jpeg', 'image/png'],
    documentTypes: ['photo', 'signature', 'class10_certificate', 'class12_certificate', 'aadhaar']
  },
  cat: {
    name: 'CAT',
    code: 'cat',
    formats: {
      photo: {
        width: 200,
        height: 240,
        dpi: 200,
        format: 'JPEG',
        quality: 85,
        maxSize: 120
      },
      signature: {
        width: 200,
        height: 60,
        dpi: 200,
        format: 'JPEG',
        quality: 85,
        maxSize: 25
      },
      documents: {
        width: 700,
        height: 900,
        dpi: 200,
        format: 'PDF',
        quality: 80,
        maxSize: 600
      }
    },
    maxFileSize: 2048,
    allowedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    documentTypes: ['photo', 'signature', 'graduation_certificate', 'aadhaar', 'category_certificate']
  },
  gate: {
    name: 'GATE',
    code: 'gate',
    formats: {
      photo: {
        width: 240,
        height: 320,
        dpi: 200,
        format: 'JPEG',
        quality: 80,
        maxSize: 100
      },
      signature: {
        width: 240,
        height: 80,
        dpi: 200,
        format: 'JPEG',
        quality: 80,
        maxSize: 30
      },
      documents: {
        width: 600,
        height: 800,
        dpi: 150,
        format: 'JPEG',
        quality: 75,
        maxSize: 350
      }
    },
    maxFileSize: 1024,
    allowedFormats: ['image/jpeg', 'image/png'],
    documentTypes: ['photo', 'signature', 'graduation_certificate', 'aadhaar']
  }
};