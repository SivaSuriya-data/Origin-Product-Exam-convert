import { useState, useRef } from "react";
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function DragAndDropFile() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      // Accept common document formats
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/gif",
      ];

      const maxSize = 10 * 1024 * 1024; // 10MB

      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    const fileObjects = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending", // pending, processing, success, error
      progress: 0,
      detectedType: "",
      processedData: null,
    }));

    setFiles((prev) => [...prev, ...fileObjects]);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const analyzeDocumentType = (filename) => {
    const name = filename.toLowerCase();
    
    // Document type detection patterns
    if (name.includes('photo') || name.includes('pic') || name.includes('passport')) {
      return 'photo';
    } else if (name.includes('sign') || name.includes('signature')) {
      return 'signature';
    } else if (name.includes('aadhaar') || name.includes('aadhar')) {
      return 'aadhaar';
    } else if (name.includes('mark') || name.includes('grade') || name.includes('result')) {
      return 'marksheet';
    } else if (name.includes('cert') || name.includes('certificate')) {
      return 'certificate';
    } else if (name.includes('caste') || name.includes('community')) {
      return 'caste_certificate';
    } else if (name.includes('income') || name.includes('salary')) {
      return 'income_certificate';
    }
    
    return 'document';
  };

  const generateNewFilename = (detectedType, examType = 'upsc', index = 0) => {
    const typeMapping = {
      'photo': `${examType}_photograph`,
      'signature': `${examType}_signature`,
      'aadhaar': `${examType}_aadhaar_card`,
      'marksheet': `${examType}_marksheet`,
      'certificate': `${examType}_certificate`,
      'caste_certificate': `${examType}_caste_certificate`,
      'income_certificate': `${examType}_income_certificate`,
      'document': `${examType}_document`
    };
    
    let baseName = typeMapping[detectedType] || `${examType}_document`;
    if (index > 0) {
      baseName += `_${index + 1}`;
    }
    
    return baseName;
  };

  const processDocument = async (fileObj) => {
    try {
      // Step 1: Analyze document type
      const detectedType = analyzeDocumentType(fileObj.name);
      const newName = generateNewFilename(detectedType);
      
      // Update file with detected type
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { ...f, detectedType, progress: 25 }
          : f
      ));

      // Step 2: Simulate document processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { ...f, progress: 50 }
          : f
      ));

      // Step 3: Create processed file data
      const reader = new FileReader();
      const fileData = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsArrayBuffer(fileObj.file);
      });

      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { ...f, progress: 75 }
          : f
      ));

      // Step 4: Simulate format conversion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a processed blob (in real implementation, this would be the formatted document)
      const processedBlob = new Blob([fileData], { type: fileObj.file.type });
      
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { 
              ...f, 
              status: 'success', 
              progress: 100,
              processedData: processedBlob,
              newName: newName + '.' + fileObj.name.split('.').pop()
            }
          : f
      ));

    } catch (error) {
      console.error('Processing error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
    }
  };

  const uploadFiles = async () => {
    setUploading(true);

    // Update all pending files to processing status
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    setFiles(prev =>
      prev.map((file) =>
        file.status === "pending" ? { ...file, status: "processing" } : file
      )
    );

    // Process each file
    for (const fileObj of pendingFiles) {
      await processDocument(fileObj);
    }

    setUploading(false);
  };

  const downloadProcessedFiles = () => {
    const successfulFiles = files.filter(f => f.status === 'success' && f.processedData);
    
    if (successfulFiles.length === 0) {
      alert('No processed files available for download');
      return;
    }

    // Create and download each file
    successfulFiles.forEach(file => {
      const url = URL.createObjectURL(file.processedData);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.newName || file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word")) return "📝";
    if (type.includes("image")) return "🖼️";
    return "📎";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'processing':
        return <Loader2 className="text-blue-500 animate-spin" size={20} />;
      default:
        return null;
    }
  };

  const successfulFiles = files.filter(f => f.status === 'success');
  const processingFiles = files.filter(f => f.status === 'processing');
  const errorFiles = files.filter(f => f.status === 'error');

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Upload Documents
      </h2>

      {/* Drag and Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragOver
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-gray-400"
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <Upload
          className={`mx-auto mb-4 ${
            isDragOver ? "text-blue-500" : "text-gray-400"
          }`}
          size={48}
        />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {uploading ? 'Processing documents...' : 'Drop files here or click to browse'}
        </h3>
        <p className="text-gray-500 mb-4">
          Support for PDF, Images up to 10MB each
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
          disabled={uploading}
        />

        {!uploading && (
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
              Selected Files ({files.length})
            </h3>
            <div className="flex space-x-2">
              {files.some((f) => f.status === "pending") && (
                <button
                  onClick={uploadFiles}
                  disabled={uploading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Process All</span>
                  )}
                </button>
              )}
              {successfulFiles.length > 0 && (
                <button
                  onClick={downloadProcessedFiles}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Download All ({successfulFiles.length})
                </button>
              )}
            </div>
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
                      {getFileIcon(fileObj.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileObj.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(fileObj.size)}
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
                    {fileObj.status !== 'processing' && !uploading && (
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
                {fileObj.status === "processing" && (
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

                {/* Status Messages */}
                {fileObj.status === "success" && (
                  <p className="text-sm text-green-600 mt-2">
                    ✅ Processing successful - Ready for download
                  </p>
                )}
                {fileObj.status === "error" && (
                  <p className="text-sm text-red-600 mt-2">
                    ❌ Processing failed: {fileObj.error || 'Unknown error'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {files.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-semibold">Total Files:</span> {files.length}
            </div>
            <div>
              <span className="font-semibold text-green-600">Processed:</span>{' '}
              {successfulFiles.length}
            </div>
            <div>
              <span className="font-semibold text-blue-600">Processing:</span>{' '}
              {processingFiles.length}
            </div>
            <div>
              <span className="font-semibold text-red-600">Failed:</span>{' '}
              {errorFiles.length}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span>Total Size: {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}</span>
          </div>
        </div>
      )}

      {/* Processing Instructions */}
      {files.length > 0 && files.some(f => f.status === 'pending') && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Click "Process All" to analyze and format your documents</li>
            <li>2. Documents will be automatically detected and renamed</li>
            <li>3. Files will be formatted according to UPSC specifications</li>
            <li>4. Download processed files when complete</li>
          </ol>
        </div>
      )}
    </div>
  );
}