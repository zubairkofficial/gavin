import React, { useState, useRef } from "react"
import {
  FileText,
  Upload,
  X,
  FileDown,
  FileCheck,
  Building,
} from "lucide-react"

interface AttachedDocument {
  id: string
  name: string
  type: string
  category: string
  size: string
}

interface DocumentType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  acceptedFormats: string[]
}

const documentTypes: DocumentType[] = [
  {
    id: "Contract Template",
    name: "Contracts & Agreements",
    description: "Employment contracts, NDAs, service agreements",
    icon: <FileCheck className="w-6 h-6" />,
    acceptedFormats: [".pdf", ".doc", ".docx"],
  },
  {
    id: "Statute/Regulation",
    name: "Statute/Regulation",
    description: "Articles of incorporation, bylaws, board resolutions",
    icon: <Building className="w-6 h-6" />,
    acceptedFormats: [".pdf", ".doc", ".docx"],
  },
]

export default function DocumentUploadComponent() {
  const [selectedDocuments, setSelectedDocuments] = useState<AttachedDocument[]>([])
  const [typeSelectionOpen, setTypeSelectionOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null)
  const [tempSelectedDocs, setTempSelectedDocs] = useState<AttachedDocument[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTypeSelection = (type: DocumentType) => {
    setSelectedType(type)
    setTypeSelectionOpen(false)
    setUploadDialogOpen(true)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && selectedType) {
      const remainingSlots = 10 - tempSelectedDocs.length
      const filesToAdd = Math.min(files.length, remainingSlots)

      const newDocs: AttachedDocument[] = Array.from(files)
        .slice(0, filesToAdd)
        .map((file, index) => ({
          id: `${Date.now()}-${index}`,
          name: file.name,
          type: file.type.includes("pdf") ? "PDF" : "Document",
          category: selectedType.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
        }))

      setTempSelectedDocs((prev) => [...prev, ...newDocs])
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeDocument = (id: string) => {
    setTempSelectedDocs((prev) => prev.filter(doc => doc.id !== id))
  }

  const confirmUpload = () => {
    setSelectedDocuments((prev) => [...prev, ...tempSelectedDocs])
    setTempSelectedDocs([])
    setSelectedType(null)
    setUploadDialogOpen(false)
  }

  const cancelUpload = () => {
    setTempSelectedDocs([])
    setSelectedType(null)
    setUploadDialogOpen(false)
  }

  const removeSelectedDocument = (id: string) => {
    setSelectedDocuments((prev) => prev.filter(doc => doc.id !== id))
  }

  const Overlay = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {children}
    </div>
  )

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
          <Upload className="w-5 h-5" />
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
                  <FileText className="text-blue-500 w-5 h-5" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-500">
                      {doc.category} • {doc.type} • {doc.size}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeSelectedDocument(doc.id)} className="hover:bg-gray-100 p-1 rounded">
                  <X className="w-4 h-4" />
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
              <button onClick={() => setTypeSelectionOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => handleTypeSelection(type)}
                  className="border p-4 rounded-lg cursor-pointer hover:shadow transition"
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
              <button onClick={cancelUpload} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 p-6 rounded text-center">
                <FileDown className="mx-auto h-10 w-10 text-gray-500 mb-2" />
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
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.type} • {doc.size}</p>
                        </div>
                      </div>
                      <button onClick={() => removeDocument(doc.id)} className="hover:bg-gray-200 p-1 rounded">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={cancelUpload}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpload}
                  disabled={tempSelectedDocs.length === 0}
                  className={`px-4 py-2 text-white rounded transition ${
                    tempSelectedDocs.length === 0
                      ? "bg-blue-600 opacity-50 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Upload {tempSelectedDocs.length} file{tempSelectedDocs.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}
