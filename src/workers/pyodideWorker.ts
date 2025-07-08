import { PyodideWorkerMessage } from '../types';

let pyodide: any = null;
let isInitialized = false;

self.onmessage = async function(e: MessageEvent<PyodideWorkerMessage>) {
  const { type, data } = e.data;

  try {
    if (type === 'init') {
      if (!isInitialized) {
        await initializePyodide();
      }
      self.postMessage({ type: 'ready' });
      return;
    }

    if (!pyodide) {
      await initializePyodide();
    }
  }
}
import re

class DocumentAnalyzer:
    def __init__(self):
        self.document_patterns = {
            'aadhaar': [
                r'aadhaar|आधार',
                r'\\d{4}\\s*\\d{4}\\s*\\d{4}',
                r'government of india',
                r'unique identification authority'
            ],
            'photo': [
                r'photograph|photo',
                r'passport.*size',
                r'recent.*photo',
                r'headshot|portrait'
            ],
            'signature': [
                r'signature|sign',
                r'specimen.*signature',
                r'thumb.*impression'
            ],
            'marksheet': [
                r'mark.*sheet|marksheet',
                r'grade.*sheet|gradesheet',
                r'transcript',
                r'examination.*result',
                r'board.*examination',
                r'semester.*result',
                r'class.*10|class.*12',
                r'10th|12th'
            ],
            'certificate': [
                r'certificate',
                r'diploma',
                r'degree',
                r'graduation',
                r'post.*graduation',
                r'bachelor|master|phd'
            ],
            'caste_certificate': [
                r'caste.*certificate',
                r'community.*certificate',
                r'sc.*certificate|st.*certificate|obc.*certificate',
                r'backward.*class',
                r'reservation.*certificate'
            ],
            'income_certificate': [
                r'income.*certificate',
                r'annual.*income',
                r'salary.*certificate',
                r'earnings.*certificate'
            ],
            'domicile': [
                r'domicile.*certificate',
                r'residence.*certificate',
                r'permanent.*resident'
            ],
            'migration': [
                r'migration.*certificate',
                r'transfer.*certificate',
                r'tc|t\\.c\\.',
                r'school.*leaving'
            ]
        }
        
        # Exam-specific document requirements
        self.exam_requirements = {
            'upsc': ['photo', 'signature', 'aadhaar', 'marksheet', 'certificate', 'caste_certificate'],
            'neet': ['photo', 'signature', 'class10_marksheet', 'class12_marksheet', 'aadhaar'],
            'jee': ['photo', 'signature', 'class10_certificate', 'class12_certificate', 'aadhaar'],
            'cat': ['photo', 'signature', 'graduation_certificate', 'aadhaar', 'category_certificate'],
            'gate': ['photo', 'signature', 'graduation_certificate', 'aadhaar']
        }
    
    def analyze_document_type(self, filename):
        """Analyze document type based on filename and content"""
        filename_lower = filename.lower()
        
        # Remove common file extensions for better matching
        name_without_ext = filename_lower.rsplit('.', 1)[0]
        
        # Check filename patterns first
        for doc_type, patterns in self.document_patterns.items():
            for pattern in patterns:
                if re.search(pattern, name_without_ext, re.IGNORECASE):
                    return doc_type
        
        # Fallback to common naming conventions
        if any(word in name_without_ext for word in ['photo', 'pic', 'image', 'passport', 'headshot']):
            return 'photo'
        elif any(word in name_without_ext for word in ['sign', 'signature', 'autograph']):
            return 'signature'
        elif any(word in name_without_ext for word in ['mark', 'grade', 'result', 'transcript']):
            return 'marksheet'
        elif any(word in name_without_ext for word in ['cert', 'certificate', 'diploma', 'degree']):
            return 'certificate'
        elif any(word in name_without_ext for word in ['aadhaar', 'aadhar', 'uid']):
            return 'aadhaar'
        elif any(word in name_without_ext for word in ['caste', 'community', 'sc', 'st', 'obc']):
            return 'caste_certificate'
        elif any(word in name_without_ext for word in ['income', 'salary', 'earnings']):
            return 'income_certificate'
        
        return 'document'  # Default type
    
    def generate_new_filename(self, detected_type, exam_code, index=0):
        """Generate standardized filename based on document type and exam"""
        type_mapping = {
            'photo': f'{exam_code}_photograph',
            'signature': f'{exam_code}_signature',
            'aadhaar': f'{exam_code}_aadhaar_card',
            'marksheet': f'{exam_code}_marksheet',
            'certificate': f'{exam_code}_certificate',
            'caste_certificate': f'{exam_code}_caste_certificate',
            'income_certificate': f'{exam_code}_income_certificate',
            'domicile': f'{exam_code}_domicile_certificate',
            'migration': f'{exam_code}_migration_certificate',
            'document': f'{exam_code}_document'
        }
        
        base_name = type_mapping.get(detected_type, f'{exam_code}_document')
        
        # Add index if multiple files of same type
        if index > 0:
            base_name += f'_{index + 1}'
        
        return base_name
    
    def validate_document_for_exam(self, detected_type, exam_code):
        """Validate if document type is required for the specific exam"""
        required_docs = self.exam_requirements.get(exam_code, [])
        
        if detected_type in required_docs:
            return True, f"Document type '{detected_type}' is required for {exam_code.upper()}"
        else:
            return False, f"Document type '{detected_type}' may not be required for {exam_code.upper()}"

analyzer = DocumentAnalyzer()
    `);
    
    isInitialized = true;
    console.log('Pyodide initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize Pyodide:', error);
    throw error;
  }
}

    if (type === 'analyze') {
      const { files, examCode } = data;
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Analyze document type
        const detectedType = pyodide.runPython(`
analyzer.analyze_document_type("${file.name}")
        `);
        
        // Generate new filename
        const newName = pyodide.runPython(`
analyzer.generate_new_filename("${detectedType}", "${examCode}", ${i})
        `);
        
        results.push({
          id: file.id,
          originalName: file.name,
          detectedType,
          newName: newName + '.' + file.name.split('.').pop()
        });
      }
      
      self.postMessage({
        type: 'result',
        data: results
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
};
async function initializePyodide() {
  if (isInitialized) return;
  
  try {
    // Initialize Pyodide
    const { loadPyodide } = await import('pyodide');
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
    });
    
    // Install required packages (minimal set for faster loading)
    await pyodide.loadPackage(['micropip']);
    
    // Load our Python document analyzer
    await pyodide.runPython(`