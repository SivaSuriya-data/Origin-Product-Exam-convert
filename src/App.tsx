import React, { useState, useCallback } from "react";
import "./App.css";
import ExamSelector from "./components/ExamSelector";
import FileUploader from "./components/FileUploader";
import ProcessingStatus from "./components/ProcessingStatus";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ProcessedFile, ConversionResult } from "./types";
import { EXAM_CONFIGS } from "./config/examConfigs";
import { DocumentAnalyzerService } from "./services/documentAnalyzer";
import { RustFormatterService } from "./services/rustFormatter";
import { ZipService } from "./services/zipService";

function App() {
  const [selectedExam, setSelectedExam] = useState("upsc");
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [servicesReady, setServicesReady] = useState(false);

  // Services
  const [documentAnalyzer] = useState(() => new DocumentAnalyzerService());
  const [rustFormatter] = useState(() => new RustFormatterService());
  const [zipService] = useState(() => new ZipService());

  const examConfig = EXAM_CONFIGS[selectedExam];

  // Initialize services when exam changes
  const initializeServices = useCallback(async (examCode: string) => {
    setIsInitializing(true);
    try {
      // Initialize Python analyzer
      await documentAnalyzer.initialize();
      
      // Initialize Rust formatter with exam config
      await rustFormatter.initialize();
      await rustFormatter.setExamConfig(EXAM_CONFIGS[examCode]);
      
      setServicesReady(true);
    } catch (error) {
      console.error('Failed to initialize services:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [documentAnalyzer, rustFormatter]);
  const handleExamChange = useCallback((examCode: string) => {
    setSelectedExam(examCode);
    // Clear files when exam changes
    setFiles([]);
    setZipBlob(null);
    setServicesReady(false);
    initializeServices(examCode);
  }, [initializeServices]);

  // Initialize services on first load
  React.useEffect(() => {
    initializeServices(selectedExam);
  }, [initializeServices, selectedExam]);
  const handleFilesChange = useCallback((newFiles: ProcessedFile[]) => {
    setFiles(newFiles);
    setZipBlob(null); // Clear previous zip when files change
  }, []);

  const processDocuments = async () => {
    if (files.length === 0 || !servicesReady) return;

    setIsProcessing(true);
    setZipBlob(null);

    try {
      // Step 1: Analyze documents with Python WASM
      setCurrentStep("Analyzing document types...");
      setFiles(prev => prev.map(f => ({ ...f, status: 'processing', progress: 25 })));

      const analyzedFiles = await documentAnalyzer.analyzeDocuments(files, selectedExam);
      setFiles(analyzedFiles);

      // Step 2: Format documents with Rust WASM
      setCurrentStep("Formatting documents...");
      setFiles(prev => prev.map(f => ({ ...f, progress: 50 })));

      const formattedFiles = await rustFormatter.formatDocuments(
        analyzedFiles,
        examConfig,
        (progress) => {
          setFiles(prev => prev.map(f => ({ ...f, progress: 50 + (progress * 0.4) })));
        }
      );
      setFiles(formattedFiles);

      // Step 3: Create ZIP file
      setCurrentStep("Creating download package...");
      setFiles(prev => prev.map(f => ({ ...f, progress: 90 })));

      const zipBlob = await zipService.createZipFromFiles(formattedFiles, selectedExam);
      setZipBlob(zipBlob);

      // Complete
      setFiles(prev => prev.map(f => ({ ...f, progress: 100 })));
      setCurrentStep("Processing complete!");

    } catch (error) {
      console.error('Processing error:', error);
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Processing failed' 
      })));
    } finally {
      setIsProcessing(false);
      setTimeout(() => setCurrentStep(""), 3000);
    }
  };

  const downloadZip = () => {
    if (!zipBlob) return;

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExam.toUpperCase()}_documents_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canProcess = files.length > 0 && !isProcessing && servicesReady;
  const canDownload = zipBlob !== null && files.some(f => f.status === 'completed');

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner message="Initializing WebAssembly modules..." />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-center">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              getConvertedExams.io
            </span>
          </h1>
          <p className="text-xl text-gray-600 text-center mt-2">
            AI-Powered Document Converter for Competitive Exams
          </p>
          <div className="text-center mt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              servicesReady 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {servicesReady ? '✓ WebAssembly Ready' : '⏳ Loading WebAssembly...'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Exam Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <ExamSelector 
                selectedExam={selectedExam} 
                onExamChange={handleExamChange} 
                disabled={isInitializing || isProcessing}
              />
              
              {/* Exam Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">
                  {examConfig.name} Requirements
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Max file size: {examConfig.maxFileSize}KB</li>
                  <li>• Photo: {examConfig.formats.photo.width}×{examConfig.formats.photo.height}px</li>
                  <li>• Signature: {examConfig.formats.signature.width}×{examConfig.formats.signature.height}px</li>
                  <li>• Documents: {examConfig.formats.documents.format} format</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* File Upload */}
            <div className="bg-white rounded-2xl shadow-xl">
              <FileUploader
                files={files}
                onFilesChange={handleFilesChange}
                maxFileSize={examConfig.maxFileSize}
                allowedFormats={examConfig.allowedFormats}
                isProcessing={isProcessing || isInitializing}
                disabled={!servicesReady}
              />
            </div>

            {/* Convert Button */}
            {files.length > 0 && (
              <div className="text-center">
                <button
                  onClick={processDocuments}
                  disabled={!canProcess}
                  className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                    canProcess
                      ? "bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isProcessing ? "Processing..." : `Convert ${files.length} Files`}
                </button>
                {!servicesReady && (
                  <p className="text-sm text-gray-500 mt-2">
                    Please wait for WebAssembly modules to load...
                  </p>
                )}
              </div>
            )}

            {/* Processing Status */}
            <ProcessingStatus
              files={files}
              isProcessing={isProcessing}
              currentStep={currentStep}
              onDownload={downloadZip}
              canDownload={canDownload}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Powered by WebAssembly • Python + Rust + TypeScript
            </p>
            <p className="text-sm">
              All processing happens in your browser. Your documents never leave your device.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;