import { PyodideWorkerMessage } from '../types';

let pyodide: any = null;

self.onmessage = async function(e: MessageEvent<PyodideWorkerMessage>) {
  const { type, data } = e.data;

  try {
    if (!pyodide) {
      // Initialize Pyodide
      const { loadPyodide } = await import('pyodide');
      pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      });
      
      // Install required packages
      await pyodide.loadPackage(['numpy', 'pillow', 'opencv-python']);
      
      // Load our Python document analyzer
      await pyodide.runPython(`
import re
import base64
from io import BytesIO
from PIL import Image
import cv2
import numpy as np

class DocumentAnalyzer:
    def __init__(self):
        self.document_patterns = {
            'aadhaar': [
                r'aadhaar|आधार',
                r'\d{4}\s*\d{4}\s*\d{4}',
                r'government of india',
                r'unique identification authority'
            ],
            'photo': [
                r'photograph|photo',
                r'passport.*size',
                r'recent.*photo'
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
                r'board.*examination'
            ],
            'certificate': [
                r'certificate',
                r'diploma',
                r'degree',
                r'graduation',
                r'post.*graduation'
            ],
            'caste_certificate': [
                r'caste.*certificate',
                r'community.*certificate',
                r'sc.*certificate|st.*certificate|obc.*certificate',
                r'backward.*class'
            ],
            'income_certificate': [
                r'income.*certificate',
                r'annual.*income',
                r'salary.*certificate'
            ]
        }
    
    def extract_text_from_image(self, image_data):
        """Extract text from image using basic OCR simulation"""
        # In a real implementation, this would use proper OCR
        # For now, we'll simulate based on filename and basic image analysis
        return ""
    
    def analyze_document_type(self, filename, file_data=None):
        """Analyze document type based on filename and content"""
        filename_lower = filename.lower()
        
        # Check filename patterns first
        for doc_type, patterns in self.document_patterns.items():
            for pattern in patterns:
                if re.search(pattern, filename_lower, re.IGNORECASE):
                    return doc_type
        
        # If no pattern matches, try to infer from common naming conventions
        if any(word in filename_lower for word in ['photo', 'pic', 'image', 'passport']):
            return 'photo'
        elif any(word in filename_lower for word in ['sign', 'signature']):
            return 'signature'
        elif any(word in filename_lower for word in ['mark', 'grade', 'result']):
            return 'marksheet'
        elif any(word in filename_lower for word in ['cert', 'certificate']):
            return 'certificate'
        elif any(word in filename_lower for word in ['aadhaar', 'aadhar', 'uid']):
            return 'aadhaar'
        
        return 'document'  # Default type
    
    def generate_new_filename(self, detected_type, exam_code, index=0):
        """Generate standardized filename based on document type"""
        type_mapping = {
            'photo': f'{exam_code}_photograph',
            'signature': f'{exam_code}_signature',
            'aadhaar': f'{exam_code}_aadhaar_card',
            'marksheet': f'{exam_code}_marksheet',
            'certificate': f'{exam_code}_certificate',
            'caste_certificate': f'{exam_code}_caste_certificate',
            'income_certificate': f'{exam_code}_income_certificate',
            'document': f'{exam_code}_document'
        }
        
        base_name = type_mapping.get(detected_type, f'{exam_code}_document')
        if index > 0:
            base_name += f'_{index + 1}'
        
        return base_name

analyzer = DocumentAnalyzer()
      `);
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