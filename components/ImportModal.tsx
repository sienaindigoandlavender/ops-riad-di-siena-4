"use client";

import { useCallback, useState } from "react";

interface ImportResults {
  added: number;
  updated: number;
  unchanged: number;
  cancelled: number;
  errors: string[];
  changes: string[];
  source?: string;
}

interface ImportModalProps {
  importSource: "booking" | "airbnb";
  onClose: () => void;
  onImportComplete: () => Promise<void>;
}

export default function ImportModal({ importSource, onClose, onImportComplete }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setImportError(null);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : (data.error || "Upload failed");
        setImportError(errorMsg);
        return;
      }

      setImportResults({
        ...data.results,
        source: data.source,
      });

      await onImportComplete();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    const fileName = file?.name.toLowerCase() || "";
    if (file && (fileName.endsWith(".csv") || fileName.endsWith(".xls") || fileName.endsWith(".xlsx"))) {
      uploadFile(file);
    } else {
      setImportError("Please upload a CSV, XLS, or XLSX file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/15 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
      <div className="bg-white shadow-lg w-full max-w-lg mx-4 modal-panel">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-[18px] text-ink-primary">
              Import {importSource === "booking" ? "Booking.com" : "Airbnb"} Export
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-parchment rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? importSource === "booking"
                  ? "border-[#A8BDC8] bg-[#A8BDC8]/10"
                  : "border-[#C9A5A0] bg-[#C9A5A0]/10"
                : "border-border-subtle hover:border-border"
            }`}
          >
            {isUploading ? (
              <div className="text-[13px] text-ink-secondary">Uploading...</div>
            ) : importResults ? (
              <div className="space-y-3">
                <div className="text-[15px] font-medium text-ink-primary">Import Complete</div>
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <div className="text-sage">Added: {importResults.added}</div>
                  <div className="text-gold">Updated: {importResults.updated}</div>
                  <div className="text-ink-secondary">Unchanged: {importResults.unchanged}</div>
                  <div className="text-brick">Cancelled: {importResults.cancelled}</div>
                </div>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-accent text-cream text-[13px] font-medium rounded-lg"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  importSource === "booking" ? "bg-[#A8BDC8]/20" : "bg-[#C9A5A0]/20"
                }`}>
                  <svg className={`w-6 h-6 ${
                    importSource === "booking" ? "text-[#4A5C66]" : "text-[#6B4E3D]"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-[13px] text-ink-secondary mb-2">Drag and drop your file here</p>
                <p className="text-[11px] text-ink-tertiary mb-4">CSV, XLS, or XLSX</p>
                <label className={`inline-block px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer ${
                  importSource === "booking"
                    ? "bg-[#A8BDC8]/20 text-[#4A5C66] hover:bg-[#A8BDC8]/30"
                    : "bg-[#C9A5A0]/20 text-[#6B4E3D] hover:bg-[#C9A5A0]/30"
                }`}>
                  Browse Files
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </>
            )}

            {importError && (
              <div className="mt-4 p-3 bg-brick/10 rounded-lg text-[13px] text-brick">
                {importError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
