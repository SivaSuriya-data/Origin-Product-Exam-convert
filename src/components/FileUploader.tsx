import React, { useState, useRef } from "react";
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { ProcessedFile } from "../types";

interface FileUploaderProps {
  files: ProcessedFile[];
  onFilesChange: (files: ProcessedFile[]) => void;
  maxFileSize: number;
  allowedFormats: string[];
  isProcessing: boolean;
  disabled?: boolean;
}

export default function FileUploader({ 
  files, 
  onFilesChange, 
  maxFileSize, 
  allowedFormats,
  isProcessing,
  disabled = false
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  };

  const processFiles = (newFiles: File[]) => {
    if (disabled) return;
    
    const validFiles = newFiles.filter((file) => {
      const maxSizeBytes = maxFileSize * 1024; // Convert KB to bytes
      return allowedFormats.includes(file.type) && file.size <= maxSizeBytes;
    });

    const invalidFiles = newFiles.filter((file) => {
      const maxSizeBytes = maxFileSize * 1024;
      return !allowedFormats.includes(file.type) || file.size > maxSizeBytes;
    });

    if (invalidFiles.length > 0) {
      alert(`${invalidFiles.length} files were rejected due to invalid format or size. Please check the requirements.`);
    }
    const fileObjects: ProcessedFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      originalName: file.name,
      detectedType: '',
      newName: '',
      file,
      status: 'pending',
      progress: 0,
    }));

    onFilesChange([...files, ...fileObjects]);
  };

  const removeFile = (id: string) => {
    if (disabled || isProcessing) return;
    onFilesChange(files.filter((file) => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word")) return "📝";
    if (type.includes("image")) return "🖼️";
    return "📎";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'processing':
        return <Loader2 className="text-blue-500 animate-spin" size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Upload Documents
      </h2>

      {/* File format info */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Supported Formats:</h4>
        <p className="text-blue-700 text-sm">
          {allowedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')} 
          • Max size: {maxFileSize}KB per file
        </p>
      </div>

      {/* Drag and Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragOver
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-gray-400"
        } ${isProcessing || disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && !disabled && fileInputRef.current?.click()}
      >
        <Upload
          className={`mx-auto mb-4 ${
            isDragOver ? "text-blue-500" : "text-gray-400"
          }`}
          size={48}
        />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {isProcessing ? 'Processing...' : disabled ? 'Loading...' : 'Drop files here or click to browse'}
        </h3>
        <p className="text-gray-500 mb-4">
          Upload your documents for conversion
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept={allowedFormats.join(',')}
          disabled={isProcessing || disabled}
        />

        {!isProcessing && !disabled && (
          <button
            type="button"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Select Files
          </button>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Files ({files.length})
            </h3>
          </div>

          <div className="space-y-3">
            {files.map((fileObj) => (
              <div
                key={fileObj.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">
                      {getFileIcon(fileObj.file.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileObj.originalName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(fileObj.file.size)}
                      </p>
                      {fileObj.detectedType && (
                        <p className="text-xs text-blue-600 mt-1">
                          Detected: {fileObj.detectedType}
                        </p>
                      )}
                      {fileObj.newName && (
                        <p className="text-xs text-green-600 mt-1">
                          New name: {fileObj.newName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(fileObj.status)}
                    {fileObj.status !== 'processing' && !isProcessing && (
                      <button
                        onClick={() => removeFile(fileObj.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {fileObj.status === 'processing' && (
                  <div className="mt-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileObj.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {fileObj.progress}% processed
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {fileObj.status === 'error' && fileObj.error && (
                  <p className="text-sm text-red-600 mt-2">
                    ❌ {fileObj.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Summary */}
      {files.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-semibold">Total Files:</span> {files.length}
            </div>
            <div>
              <span className="font-semibold text-green-600">Completed:</span>{' '}
              {files.filter((f) => f.status === 'completed').length}
            </div>
            <div>
              <span className="font-semibold text-blue-600">Processing:</span>{' '}
              {files.filter((f) => f.status === 'processing').length}
            </div>
            <div>
              <span className="font-semibold text-red-600">Failed:</span>{' '}
              {files.filter((f) => f.status === 'error').length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}