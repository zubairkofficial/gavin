import React, { useState, useRef } from "react";

interface AttachedDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  size: string;
  title: string;
  file?: File; // Made optional since it's removed after upload
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  acceptedFormats: string[];
}

const documentTypes: DocumentType[] = [
  {
    id: "Contract Template",
    name: "Contracts & Agreements",
    description: "Employment contracts, NDAs, service agreements",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    acceptedFormats: [".pdf", ".doc", ".docx"],
  },
  {
    id: "Statute/Regulation",
    name: "Statute/Regulation",
    description: "Articles of incorporation, bylaws, board resolutions",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    acceptedFormats: [".pdf", ".doc", ".docx"],
  },
];

interface OverlayProps {
  children: React.ReactNode;
}

const Overlay: React.FC<OverlayProps> = ({ children }) => (
  <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    {children}
  </div>
);

const DocumentUploadComponent: React.FC = () => {
  const [selectedDocuments, setSelectedDocuments] = useState<AttachedDocument[]>([]);
  const [typeSelectionOpen, setTypeSelectionOpen] = useState<boolean>(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [tempSelectedDocs, setTempSelectedDocs] = useState<AttachedDocument[]>([]);
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTypeSelection = (type: DocumentType): void => {
    setSelectedType(type);
    setTypeSelectionOpen(false);
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (files && selectedType) {
      const remainingSlots = 10 - tempSelectedDocs.length;
      const filesToAdd = Math.min(files.length, remainingSlots);

      const newDocs: AttachedDocument[] = Array.from(files)
        .slice(0, filesToAdd)
        .map((file, index) => ({
          id: `${Date.now()}-${index}`,
          name: file.name,
          type: file.type.includes("pdf") ? "PDF" : "Document",
          category: selectedType.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          title: "",
          file: file,
        }));

      setTempSelectedDocs((prev) => [...prev, ...newDocs]);
      
      // Clear the input so user can select the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeDocument = (id: string): void => {
    setTempSelectedDocs((prev) => prev.filter(doc => doc.id !== id));
  };

  const uploadToBackend = async (documents: AttachedDocument[]): Promise<void> => {
    if (!selectedType || !documentTitle.trim() || documents.length === 0) {
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload each file separately or handle multiple files as needed
      for (const doc of documents) {
        if (!doc.file) {
          throw new Error(`File object missing for document: ${doc.name}`);
        }

        const formData = new FormData();
        
        // Validate file size (10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
        if (doc.file.size > MAX_FILE_SIZE) {
          throw new Error(`File exceeding 10MB: ${doc.file.name}`);
        }

        // Add file and metadata according to backend requirements
        formData.append('file', doc.file);
        formData.append('title', documentTitle.trim());
        formData.append('type', selectedType.id);
        
        console.log('Sending to backend:', {
          title: documentTitle.trim(),
          type: selectedType.id,
          fileName: doc.file.name
        });

        const response = await fetch('http://localhost:8080/api/v1/documents/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${doc.file.name}: ${response.statusText}`);
        }
      }

      // Success - update the selected documents
      setSelectedDocuments((prev) => [
        ...prev,
        ...tempSelectedDocs.map(doc => ({
          ...doc,
          // Remove the file object from the displayed documents to save memory
          file: undefined,
        }))
      ]);
      
      // Clear temporary state
      setTempSelectedDocs([]);
      setDocumentTitle("");
      setSelectedType(null);
      setUploadDialogOpen(false);
      
      alert('Documents uploaded successfully!');
      
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during upload.";
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const confirmUpload = (): void => {
    if (!documentTitle.trim()) {
      alert('Please enter a document title');
      return;
    }
    
    if (tempSelectedDocs.length === 0) {
      alert('Please select at least one document');
      return;
    }

    uploadToBackend(tempSelectedDocs);
  };

  const cancelUpload = (): void => {
    setTempSelectedDocs([]);
    setDocumentTitle("");
    setSelectedType(null);
    setUploadDialogOpen(false);
  };

  const removeSelectedDocument = (id: string): void => {
    setSelectedDocuments((prev) => prev.filter(doc => doc.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Document Upload Center</h1>
        <p className="text-gray-600">Select document type first, then upload your files for analysis</p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setTypeSelectionOpen(true)}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="text-left">
            <span className="font-medium">Upload Documents</span>
            <p className="text-xs text-gray-500">Choose document type first</p>
          </div>
        </button>
      </div>

      {selectedDocuments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Uploaded Documents</h3>
          <div className="grid gap-3">
            {selectedDocuments.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <svg className="text-blue-500 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-gray-500">
                      {doc.name} • {doc.category} • {doc.type} • {doc.size}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeSelectedDocument(doc.id)} 
                  className="hover:bg-gray-100 p-1 rounded"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {typeSelectionOpen && (
        <Overlay>
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Select Document Type</h2>
                <p className="text-gray-600">Choose the category that best describes your documents</p>
              </div>
              <button 
                onClick={() => setTypeSelectionOpen(false)} 
                className="p-1 hover:bg-gray-100 rounded"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => handleTypeSelection(type)}
                  className="border p-4 rounded-lg cursor-pointer hover:shadow transition"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleTypeSelection(type);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600">{type.icon}</div>
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Accepts: {type.acceptedFormats.join(", ")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {uploadDialogOpen && (
        <Overlay>
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Upload {selectedType?.name}</h2>
                <p className="text-gray-600 text-sm">
                  Upload your {selectedType?.name.toLowerCase()} (Max 10 files, 10MB each)
                </p>
              </div>
              <button 
                onClick={cancelUpload} 
                className="p-1 hover:bg-gray-100 rounded"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="documentTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Title *
                </label>
                <textarea
                  id="documentTitle"
                  value={documentTitle}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    console.log('Title changing to:', e.target.value);
                    setDocumentTitle(e.target.value);
                  }}
                  onFocus={() => console.log('Title focused')}
                  onBlur={() => console.log('Title blurred')}
                  placeholder="Enter document title (you can write multiple lines for longer titles)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[80px]"
                  rows={3}
                  required
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can write a detailed title or description across multiple lines
                </p>
                <p className="text-xs text-blue-500">Debug: Current title length: {documentTitle.length}</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 p-6 rounded text-center">
                <svg className="mx-auto h-10 w-10 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-600">Drag and drop files here</p>
                <p className="text-xs text-gray-400 mb-2">Or</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={selectedType?.acceptedFormats.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={tempSelectedDocs.length >= 10}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-sm transition disabled:opacity-50"
                  disabled={tempSelectedDocs.length >= 10}
                  type="button"
                >
                  Browse Files
                </button>
              </div>

              {tempSelectedDocs.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Selected Files</h4>
                    <span className="text-xs text-gray-500">{tempSelectedDocs.length}/10</span>
                  </div>
                  {tempSelectedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.type} • {doc.size}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeDocument(doc.id)} 
                        className="hover:bg-gray-200 p-1 rounded"
                        type="button"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={cancelUpload}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                  disabled={isUploading}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpload}
                  disabled={tempSelectedDocs.length === 0 || !documentTitle.trim() || isUploading}
                  className={`px-4 py-2 text-white rounded transition ${
                    tempSelectedDocs.length === 0 || !documentTitle.trim() || isUploading
                      ? "bg-blue-600 opacity-50 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  type="button"
                >
                  {isUploading ? 'Uploading...' : `Upload ${tempSelectedDocs.length} file${tempSelectedDocs.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
};

export default DocumentUploadComponent;