import { useState } from "react";
import { Upload, X, FileText, Image, Loader2, CheckCircle2, Sparkles, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { processReceipt, validateExtractedData, suggestCategory } from "../../services/ocrService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const ReceiptUpload = ({ onUpload, onOCRComplete = null, existingReceipt = null, disabled = false, enableOCR = false }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(existingReceipt);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [showRawText, setShowRawText] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image (JPG, PNG) or PDF file");
      return false;
    }

    if (file.size > maxSize) {
      setError("File size must be less than 5MB");
      return false;
    }

    setError("");
    return true;
  };

  const uploadToBackend = async (file) => {
    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/finance/upload-receipt`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }
      
      if (data.data?.url) {
        return data.data.url;
      } else {
        throw new Error("Upload failed - no URL returned");
      }
    } catch (error) {
      console.error("Receipt upload error:", error);
      throw new Error(error.message || "Failed to upload receipt");
    }
  };

  const handleFiles = async (files) => {
    if (files && files.length > 0) {
      const file = files[0];

      if (!validateFile(file)) {
        return;
      }

      setUploading(true);
      setError("");

      try {
        // Create preview
        const reader = new FileReader();
        reader.onloadend = async () => {
          const previewUrl = reader.result;
          setPreview({
            url: previewUrl,
            type: file.type,
            name: file.name,
            isLocal: true,
          });

          // If OCR is enabled and file is an image, process it
          if (enableOCR && file.type.startsWith('image/')) {
            setOcrProcessing(true);
            try {
              const result = await processReceipt(previewUrl);
              
              if (result.success) {
                setOcrResult(result);
                const validation = validateExtractedData(result.parsedData);
                const suggestedCat = suggestCategory(result.parsedData);
                
                // Notify parent with OCR data
                if (onOCRComplete) {
                  onOCRComplete({
                    ...result.parsedData,
                    suggestedCategory: suggestedCat,
                    confidence: result.confidence,
                    validation
                  });
                }
              }
            } catch (ocrError) {
              console.error('OCR processing error:', ocrError);
              // Don't fail the upload if OCR fails
            } finally {
              setOcrProcessing(false);
            }
          }
        };
        reader.readAsDataURL(file);

        // Upload to backend (which uploads to Cloudinary)
        const url = await uploadToBackend(file);
        
        setPreview({
          url,
          type: file.type,
          name: file.name,
          isLocal: false,
        });

        // Notify parent component
        onUpload(url);
      } catch (error) {
        setError(error.message || "Upload failed. Please try again.");
        setPreview(null);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (disabled) return;

    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = () => {
    setPreview(null);
    setError("");
    setOcrResult(null);
    onUpload(null);
    if (onOCRComplete) {
      onOCRComplete(null);
    }
  };

  const handleManualOCR = async () => {
    if (!preview || !preview.url || !enableOCR) return;
    
    setOcrProcessing(true);
    setError("");
    
    try {
      const result = await processReceipt(preview.url);
      
      if (result.success) {
        setOcrResult(result);
        const validation = validateExtractedData(result.parsedData);
        const suggestedCat = suggestCategory(result.parsedData);
        
        // Notify parent with OCR data
        if (onOCRComplete) {
          onOCRComplete({
            ...result.parsedData,
            suggestedCategory: suggestedCat,
            confidence: result.confidence,
            validation
          });
        }
      } else {
        setError('Failed to extract information from receipt. Please try again.');
      }
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      setError('AI extraction failed. Please check receipt quality and try again.');
    } finally {
      setOcrProcessing(false);
    }
  };

  const getFileIcon = (type) => {
    if (type?.includes("pdf")) {
      return <FileText className="w-12 h-12 text-red-500" />;
    }
    return <Image className="w-12 h-12 text-blue-500" />;
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? "border-lime-500 bg-lime-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleChange}
            disabled={disabled || uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {uploading || ocrProcessing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-lime-500 animate-spin mb-4" />
              <p className="text-gray-700 font-medium">
                {ocrProcessing ? 'Reading receipt with AI...' : 'Uploading receipt...'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {ocrProcessing ? 'Extracting information' : 'Please wait'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-lime-100 rounded-full mb-4">
                {enableOCR ? <Sparkles className="w-8 h-8 text-lime-600" /> : <Upload className="w-8 h-8 text-lime-600" />}
              </div>
              <p className="text-gray-700 font-medium mb-2">
                Drop your receipt here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports: JPG, PNG, PDF (Max 5MB)
              </p>
              {enableOCR && (
                <div className="mt-2 flex items-center gap-1 text-xs text-lime-600 font-medium">
                  <Sparkles size={14} />
                  <span>AI will auto-extract details</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
          {/* Preview Header */}
          <div className="bg-gray-100 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {preview.name || "Receipt uploaded"}
                </p>
                <p className="text-xs text-gray-500">
                  {preview.isLocal ? "Uploading..." : "Ready"}
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              disabled={uploading}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Preview Content */}
          <div className="p-4 bg-white">
            {preview.type?.includes("pdf") ? (
              <div className="flex flex-col items-center py-8">
                {getFileIcon(preview.type)}
                <p className="mt-2 text-sm text-gray-600">PDF Document</p>
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-blue-600 hover:underline text-sm"
                >
                  View PDF
                </a>
              </div>
            ) : (
              <div className="flex justify-center">
                <img
                  src={preview.url}
                  alt="Receipt preview"
                  className="max-h-64 rounded-lg object-contain"
                />
              </div>
            )}

            {/* AI Extraction Button */}
            {enableOCR && !preview.type?.includes("pdf") && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleManualOCR}
                  disabled={ocrProcessing || uploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-lime-500 to-green-500 text-white rounded-lg hover:from-lime-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {ocrProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Extracting with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Extract Details with AI</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OCR Result Display */}
      {ocrResult && ocrResult.parsedData && (
        <div className="mt-3 p-4 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles size={16} className="text-lime-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 mb-2">AI Extracted Information</p>
              <div className="space-y-1 text-xs text-gray-700">
                {ocrResult.parsedData.amount && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Amount:</span>
                    <span className="font-bold text-green-700">₹{ocrResult.parsedData.amount}</span>
                  </div>
                )}
                {ocrResult.parsedData.vendor && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Vendor:</span>
                    <span>{ocrResult.parsedData.vendor}</span>
                  </div>
                )}
                {ocrResult.parsedData.date && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Date:</span>
                    <span>{ocrResult.parsedData.date}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-lime-700 mt-2 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Confidence: {Math.round(ocrResult.confidence)}%
              </p>
              
              {/* Show Raw Text Button */}
              {ocrResult.rawText && (
                <div className="mt-3 pt-3 border-t border-lime-200">
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="flex items-center gap-1 text-xs text-lime-700 hover:text-lime-800 font-medium"
                  >
                    {showRawText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showRawText ? 'Hide' : 'View'} Raw OCR Text
                  </button>
                  
                  {showRawText && (
                    <div className="mt-2 p-2 bg-white border border-lime-200 rounded text-[10px] font-mono text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {ocrResult.rawText}
                    </div>
                  )}
                  
                  <p className="text-[10px] text-gray-500 mt-1 italic">
                    💡 Tip: Ensure receipt is well-lit and text is clear for better results
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-red-600 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Help Text */}
      {!preview && !error && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Receipt is required for expenses over ₹500
        </p>
      )}
    </div>
  );
};

export default ReceiptUpload;
