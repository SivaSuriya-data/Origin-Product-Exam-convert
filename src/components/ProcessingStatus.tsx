import React from 'react';
import { Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { ProcessedFile } from '../types';

interface ProcessingStatusProps {
  files: ProcessedFile[];
  isProcessing: boolean;
  currentStep: string;
  onDownload: () => void;
  canDownload: boolean;
}

export default function ProcessingStatus({ 
  files, 
  isProcessing, 
  currentStep, 
  onDownload, 
  canDownload 
}: ProcessingStatusProps) {
  const completedFiles = files.filter(f => f.status === 'completed');
  const errorFiles = files.filter(f => f.status === 'error');
  const processingFiles = files.filter(f => f.status === 'processing');

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Processing Status</h3>
        
        {/* Current Step */}
        {isProcessing && (
          <div className="flex items-center space-x-3 mb-6 p-4 bg-blue-50 rounded-lg">
            <Loader2 className="text-blue-600 animate-spin" size={24} />
            <div>
              <p className="font-semibold text-blue-800">Processing...</p>
              <p className="text-blue-600 text-sm">{currentStep}</p>
            </div>
          </div>
        )}

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="font-semibold text-green-800">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {completedFiles.length}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className={`text-blue-600 ${processingFiles.length > 0 ? 'animate-spin' : ''}`} size={20} />
              <span className="font-semibold text-blue-800">Processing</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {processingFiles.length}
            </p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="text-red-600" size={20} />
              <span className="font-semibold text-red-800">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {errorFiles.length}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round((completedFiles.length / files.length) * 100)}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(completedFiles.length / files.length) * 100}%` }}
            />
          </div>
        </div>

        {/* File Details */}
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-800 truncate">{file.originalName}</p>
                {file.newName && (
                  <p className="text-sm text-gray-600">→ {file.newName}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {file.status === 'completed' && <CheckCircle className="text-green-500" size={16} />}
                {file.status === 'processing' && <Loader2 className="text-blue-500 animate-spin" size={16} />}
                {file.status === 'error' && <AlertCircle className="text-red-500" size={16} />}
                <span className="text-sm text-gray-500 capitalize">{file.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Download Button */}
        {canDownload && (
          <div className="text-center">
            <button
              onClick={onDownload}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Download size={20} />
              <span>Download All Files ({completedFiles.length} files)</span>
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Files will be downloaded as a ZIP archive
            </p>
          </div>
        )}

        {/* Error Summary */}
        {errorFiles.length > 0 && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">Failed Files:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {errorFiles.map((file) => (
                <li key={file.id}>
                  {file.originalName}: {file.error || 'Unknown error'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}