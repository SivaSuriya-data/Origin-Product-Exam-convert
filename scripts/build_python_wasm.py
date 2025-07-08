#!/usr/bin/env python3
"""
Build script for Python WASM components
This script prepares Python modules for use with Pyodide
"""

import os
import shutil
from pathlib import Path

def create_python_package():
    """Create a Python package for document analysis"""
    
    # Create the package directory
    package_dir = Path("src/python_modules")
    package_dir.mkdir(exist_ok=True)
    
    # Document analyzer module
    analyzer_code = '''
import re
from typing import Dict, List, Tuple, Optional, Any

class DocumentAnalyzer:
    """Advanced document type detection and analysis"""
    
    def __init__(self):
        self.document_patterns = {
            'aadhaar': [
                r'aadhaar|आधार|aadhar',
                r'\\d{4}\\s*\\d{4}\\s*\\d{4}',
                r'government of india',
                r'unique identification authority',
                r'uid|uidai'
            ],
            'photo': [
                r'photograph|photo|pic',
                r'passport.*size',
                r'recent.*photo',
                r'headshot',
                r'portrait',
                r'image.*photo',
                r'profile.*pic'
            ],
            'signature': [
                r'signature|sign',
                r'specimen.*signature',
                r'thumb.*impression',
                r'autograph',
                r'hand.*sign'
            ],
            'marksheet': [
                r'mark.*sheet|marksheet',
                r'grade.*sheet|gradesheet',
                r'transcript',
                r'examination.*result',
                r'board.*examination',
                r'semester.*result',
                r'annual.*result',
                r'class.*10|class.*12',
                r'10th|12th|tenth|twelfth',
                r'ssc|hsc|cbse|icse'
            ],
            'certificate': [
                r'certificate',
                r'diploma',
                r'degree',
                r'graduation',
                r'post.*graduation',
                r'bachelor',
                r'master',
                r'phd|doctorate',
                r'b\\.?tech|m\\.?tech',
                r'b\\.?sc|m\\.?sc',
                r'b\\.?com|m\\.?com',
                r'b\\.?a|m\\.?a'
            ],
            'caste_certificate': [
                r'caste.*certificate',
                r'community.*certificate',
                r'sc.*certificate|st.*certificate|obc.*certificate',
                r'backward.*class',
                r'reservation.*certificate',
                r'tribal.*certificate',
                r'category.*certificate'
            ],
            'income_certificate': [
                r'income.*certificate',
                r'annual.*income',
                r'salary.*certificate',
                r'earnings.*certificate',
                r'financial.*status',
                r'family.*income'
            ],
            'domicile': [
                r'domicile.*certificate',
                r'residence.*certificate',
                r'permanent.*resident',
                r'native.*certificate',
                r'residential.*proof'
            ],
            'migration': [
                r'migration.*certificate',
                r'transfer.*certificate',
                r'tc|t\\.c\\.',
                r'school.*leaving',
                r'college.*leaving'
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
        
        # Document type priorities for better detection
        self.type_priorities = {
            'photo': 10,
            'signature': 9,
            'aadhaar': 8,
            'marksheet': 7,
            'certificate': 6,
            'caste_certificate': 5,
            'income_certificate': 4,
            'domicile': 3,
            'migration': 2,
            'document': 1
        }
    
    def analyze_document_type(self, filename: str, file_content: Optional[bytes] = None) -> str:
        """
        Analyze document type based on filename and optionally file content
        
        Args:
            filename: Name of the file
            file_content: Optional file content for deeper analysis
            
        Returns:
            Detected document type
        """
        filename_lower = filename.lower()
        
        # Remove common file extensions for better matching
        name_without_ext = filename_lower.rsplit('.', 1)[0]
        
        # Clean up common separators and numbers
        cleaned_name = re.sub(r'[_\-\s]+', ' ', name_without_ext)
        cleaned_name = re.sub(r'\d+', '', cleaned_name).strip()
        
        detected_types = []
        
        # Check filename patterns and collect all matches with priorities
        for doc_type, patterns in self.document_patterns.items():
            for pattern in patterns:
                if re.search(pattern, cleaned_name, re.IGNORECASE):
                    priority = self.type_priorities.get(doc_type, 1)
                    detected_types.append((doc_type, priority))
                    break
        
        # Return the highest priority match
        if detected_types:
            detected_types.sort(key=lambda x: x[1], reverse=True)
            return detected_types[0][0]
        
        # Fallback to common naming conventions
        if any(word in cleaned_name for word in ['photo', 'pic', 'image', 'passport', 'headshot']):
            return 'photo'
        elif any(word in cleaned_name for word in ['sign', 'signature', 'autograph']):
            return 'signature'
        elif any(word in cleaned_name for word in ['mark', 'grade', 'result', 'transcript']):
            return 'marksheet'
        elif any(word in cleaned_name for word in ['cert', 'certificate', 'diploma', 'degree']):
            return 'certificate'
        elif any(word in cleaned_name for word in ['aadhaar', 'aadhar', 'uid']):
            return 'aadhaar'
        elif any(word in cleaned_name for word in ['caste', 'community', 'sc', 'st', 'obc']):
            return 'caste_certificate'
        elif any(word in cleaned_name for word in ['income', 'salary', 'earnings']):
            return 'income_certificate'
        
        return 'document'  # Default type
    
    def generate_new_filename(self, detected_type: str, exam_code: str, index: int = 0) -> str:
        """
        Generate standardized filename based on document type and exam
        
        Args:
            detected_type: The detected document type
            exam_code: The exam code (upsc, neet, etc.)
            index: Index for handling multiple files of same type
            
        Returns:
            Standardized filename without extension
        """
        # Exam-specific naming conventions
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
    
    def validate_document_for_exam(self, detected_type: str, exam_code: str) -> Tuple[bool, str]:
        """
        Validate if document type is required for the specific exam
        
        Args:
            detected_type: The detected document type
            exam_code: The exam code
            
        Returns:
            Tuple of (is_valid, message)
        """
        required_docs = self.exam_requirements.get(exam_code, [])
        
        if detected_type in required_docs:
            return True, f"Document type '{detected_type}' is required for {exam_code.upper()}"
        else:
            return False, f"Document type '{detected_type}' may not be required for {exam_code.upper()}"
    
    def get_exam_requirements(self, exam_code: str) -> List[str]:
        """Get list of required document types for an exam"""
        return self.exam_requirements.get(exam_code, [])
    
    def analyze_batch(self, files_info: List[Dict[str, Any]], exam_code: str) -> List[Dict[str, Any]]:
        """
        Analyze a batch of files
        
        Args:
            files_info: List of file information dictionaries
            exam_code: The exam code
            
        Returns:
            List of analysis results
        """
        results = []
        type_counts = {}
        
        for i, file_info in enumerate(files_info):
            filename = file_info.get('name', '')
            file_id = file_info.get('id', '')
            
            # Detect document type
            detected_type = self.analyze_document_type(filename)
            
            # Count occurrences of each type for indexing
            type_counts[detected_type] = type_counts.get(detected_type, 0)
            current_index = type_counts[detected_type]
            type_counts[detected_type] += 1
            
            # Generate new filename
            new_name = self.generate_new_filename(detected_type, exam_code, current_index)
            
            # Validate for exam
            is_valid, validation_message = self.validate_document_for_exam(detected_type, exam_code)
            
            results.append({
                'id': file_id,
                'original_name': filename,
                'detected_type': detected_type,
                'new_name': new_name,
                'is_valid': is_valid,
                'validation_message': validation_message,
                'index': current_index
            })
        
        return results

# Create global instance
analyzer = DocumentAnalyzer()
'''
    
    # Write the analyzer module
    with open(package_dir / "document_analyzer.py", "w") as f:
        f.write(analyzer_code)
    
    # Create __init__.py
    with open(package_dir / "__init__.py", "w") as f:
        f.write("from .document_analyzer import DocumentAnalyzer, analyzer\n")
    
    print("Python WASM package created successfully!")
    print(f"Package location: {package_dir.absolute()}")

if __name__ == "__main__":
    create_python_package()