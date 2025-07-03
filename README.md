# getConvertedExams.io - AI-Powered Document Converter

A comprehensive browser-based web application that converts and formats documents for competitive exam applications using WebAssembly (WASM) technology.

## 🚀 Features

- **Multi-Exam Support**: UPSC, NEET, JEE, CAT, GATE with exam-specific formatting rules
- **AI Document Detection**: Automatically identifies document types (Aadhaar, Marksheet, Photo, etc.)
- **Smart Formatting**: Resizes, compresses, and formats documents according to exam requirements
- **Browser-Based Processing**: All processing happens locally using WebAssembly - no server uploads
- **Batch Processing**: Handle multiple documents simultaneously
- **ZIP Download**: Get all formatted documents in a single ZIP file

## 🛠 Tech Stack

- **Frontend**: TypeScript + React + Vite + Tailwind CSS
- **Document Analysis**: Python compiled to WASM using Pyodide
- **Document Formatting**: Rust compiled to WASM using wasm-pack
- **File Processing**: JSZip, PDF-lib, Tesseract.js
- **Deployment**: Docker + Nginx

## 🏗 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TypeScript    │    │   Python WASM    │    │   Rust WASM     │
│   Frontend      │───▶│   Document       │───▶│   Document      │
│   (React/Vite)  │    │   Analyzer       │    │   Formatter     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         └───────────────────┐                         │
                             ▼                         ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   ZIP Service   │    │   File Download │
                    │   (JSZip)       │    │   (Browser API) │
                    └─────────────────┘    └─────────────────┘
```

## 📋 Supported Exams & Formats

### UPSC
- **Photo**: 300×400px, JPEG, ≤200KB
- **Signature**: 300×100px, JPEG, ≤50KB
- **Documents**: 800×1200px, PDF, ≤500KB

### NEET
- **Photo**: 200×230px, JPEG, ≤100KB
- **Signature**: 200×80px, JPEG, ≤30KB
- **Documents**: 600×800px, JPEG, ≤300KB

### JEE
- **Photo**: 240×320px, JPEG, ≤150KB
- **Signature**: 240×80px, JPEG, ≤40KB
- **Documents**: 600×800px, JPEG, ≤400KB

### CAT
- **Photo**: 200×240px, JPEG, ≤120KB
- **Signature**: 200×60px, JPEG, ≤25KB
- **Documents**: 700×900px, PDF, ≤600KB

### GATE
- **Photo**: 240×320px, JPEG, ≤100KB
- **Signature**: 240×80px, JPEG, ≤30KB
- **Documents**: 600×800px, JPEG, ≤350KB

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Docker (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd get-converted-exams
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build Rust WASM module**
   ```bash
   npm run build:wasm
   ```

4. **Build Python WASM components**
   ```bash
   npm run build:python
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t get-converted-exams .
   ```

2. **Run the container**
   ```bash
   docker run -p 80:80 get-converted-exams
   ```

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ExamSelector.tsx
│   │   ├── FileUploader.tsx
│   │   └── ProcessingStatus.tsx
│   ├── services/           # Service classes
│   │   ├── documentAnalyzer.ts
│   │   ├── rustFormatter.ts
│   │   └── zipService.ts
│   ├── workers/            # Web Workers
│   │   └── pyodideWorker.ts
│   ├── config/             # Configuration
│   │   └── examConfigs.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   └── App.tsx
├── rust-formatter/         # Rust WASM module
│   ├── src/
│   │   └── lib.rs
│   └── Cargo.toml
├── scripts/               # Build scripts
│   └── build_python_wasm.py
├── Dockerfile
├── nginx.conf
└── package.json
```

## 🔧 Configuration

### Adding New Exams

1. **Update exam configuration** in `src/config/examConfigs.ts`
2. **Add Rust formatter** in `rust-formatter/src/lib.rs`
3. **Update Python analyzer** patterns if needed

### Customizing Document Types

Modify the `document_patterns` in the Python analyzer to add new document type detection patterns.

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔒 Security Features

- **Client-side Processing**: No documents are uploaded to servers
- **CORS Headers**: Proper security headers for WASM execution
- **Content Security Policy**: Secure execution environment
- **Input Validation**: File type and size validation

## 🌐 Browser Compatibility

- Chrome 88+
- Firefox 89+
- Safari 15+
- Edge 88+

*Requires SharedArrayBuffer support for optimal performance*

## 📝 API Reference

### DocumentAnalyzer (Python WASM)
```python
analyzer.analyze_document_type(filename: str) -> str
analyzer.generate_new_filename(detected_type: str, exam_code: str, index: int) -> str
```

### DocumentFormatter (Rust WASM)
```rust
formatter.format_document(file_data: &[u8], document_type: &str, original_name: &str) -> Vec<u8>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the configuration examples

## 🚧 Roadmap

- [ ] OCR integration for better document analysis
- [ ] More exam formats (State PSCs, Banking exams)
- [ ] Batch processing optimization
- [ ] Progressive Web App (PWA) support
- [ ] Advanced image enhancement features
- [ ] Multi-language support

---

**Built with ❤️ using WebAssembly, TypeScript, Python, and Rust**