import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import API from "@/lib/api";

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
    id: "Contract",
    name: "Contracts",
    description: "Employment contracts, NDAs, service agreements",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    acceptedFormats: [".pdf", ".doc", ".docx", ".txt"],
  },
  {
    id: "Regulation",
    name: "Regulations",
    description: "Articles of incorporation, bylaws, board resolutions",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    acceptedFormats: [".pdf", ".doc", ".docx", ".txt"],
  },
  {
    id: "Statute",
    name: "Statutes",
    description:
      "Legislative acts, laws, regulations, codes, and statutory texts",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2"
        />
      </svg>
    ),
    acceptedFormats: [".pdf", ".doc", ".docx", ".txt", ".rtf"],
  },
];

interface Jurisdiction {
  id: number;
  jurisdiction: string;
  created_at: string;
}

interface OverlayProps {
  children: React.ReactNode;
}

const Overlay: React.FC<OverlayProps> = ({ children }) => (
  <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50 p-4 ">
    {children}
  </div>
);

const DocumentUploadComponent = () => {
  const [typeSelectionOpen, setTypeSelectionOpen] = useState<boolean>(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [tempSelectedDocs, setTempSelectedDocs] = useState<AttachedDocument[]>(
    []
  );
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] =
    useState<Jurisdiction | null>(null);
  const [jurisdictionOpen, setJurisdictionOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch jurisdictions when component mounts
  useEffect(() => {
    const fetchJurisdictions = async () => {
      try {
        const response = await API.get("/jurisdictions");
        setJurisdictions(response.data);
      } catch (error) {
        toast.error("Failed to load jurisdictions");
      }
    };

    fetchJurisdictions();
  }, []);

  const handleTypeSelection = (type: DocumentType): void => {
    setSelectedType(type);
    setTypeSelectionOpen(false);
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const files = event.target.files;
    if (files && selectedType) {
      const newDocs: AttachedDocument[] = [];

      Array.from(files).forEach((file, index) => {
        const newDoc: AttachedDocument = {
          id: `${Date.now()}-${index}`,
          name: file.name,
          type: file.type.includes("pdf") ? "PDF" : "Document",
          category: selectedType.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          title: "",
          file: file,
        };
        newDocs.push(newDoc);
      });

      setTempSelectedDocs((prev) => [...prev, ...newDocs]);

      // Clear the input so user can select more files
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeDocument = (docId: string): void => {
    setTempSelectedDocs((prev) => prev.filter((doc) => doc.id !== docId));
  };

  // Helper function to start timer for progress messages
  const startProgressTimer = (): [NodeJS.Timeout, () => void] => {
    let messageCount = 0;
    const messages = [
      "We are doing our work... please wait",
      "Processing your documents... this may take a moment",
      "Hang tight! Your documents are being prepared for analysis",
      "Thanks for your patience. It's almost done...",
      "Just a little bit more... your documents are being processed",
    ];

    const timer = setInterval(() => {
      if (messageCount < messages.length) {
        toast.success(messages[messageCount]);
        messageCount++;
      }
    }, 10000);

    const clearTimer = () => {
      clearInterval(timer);
    };

    return [timer, clearTimer];
  };

  const uploadToBackend = async (
    documents: AttachedDocument[]
  ): Promise<void> => {
    if (
      !selectedType ||
      !documentTitle.trim() ||
      documents.length === 0 ||
      !selectedJurisdiction
    ) {
      toast.error(
        "Please fill in all required fields and select a jurisdiction"
      );
      return;
    }

    setIsUploading(true);
    let currentTimer: NodeJS.Timeout | null = null;
    let clearCurrentTimer: (() => void) | null = null;

    try {
      // Start timer for first file
      [currentTimer, clearCurrentTimer] = startProgressTimer();

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];

        if (!doc.file) {
          throw new Error(`File object missing for document: ${doc.name}`);
        }

        const formData = new FormData();

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
        if (doc.file.size > MAX_FILE_SIZE) {
          throw new Error(`File exceeding 10MB: ${doc.file.name}`);
        }

        formData.append("file", doc.file);
        formData.append("title", documentTitle.trim());
        formData.append("fileName", doc.file.name.trim());
        formData.append("type", selectedType.id);
        formData.append("jurisdiction", selectedJurisdiction.jurisdiction);

        console.log("Sending to backend:", {
          title: documentTitle.trim(),
          type: selectedType.id,
          fileName: doc.file.name,
          jurisdiction: selectedJurisdiction.jurisdiction,
        });

        // For uploading documents with formData
        const response = await API.post("/documents/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data", // Important for file uploads
            Accept: "application/json",
          },
        });

        if (response.status < 200 || response.status >= 300) {
          throw new Error(
            `Upload failed for ${doc.file.name}: ${response.statusText}`
          );
        }

        // Clear current timer
        if (clearCurrentTimer) {
          clearCurrentTimer();
        }

        // Show success message for current file
        toast.success(`✅ ${doc.file.name} uploaded successfully!`);

        // If there are more files to upload, start timer for next file
        if (i < documents.length - 1) {
          [currentTimer, clearCurrentTimer] = startProgressTimer();
        }
      }

      // Clear temporary state
      setTempSelectedDocs([]);
      setDocumentTitle("");
      setSelectedType(null);
      setUploadDialogOpen(false);

      // Final success message
      if (documents.length > 1) {
        toast.success(
          `🎉 All ${documents.length} documents uploaded successfully!`
        );
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during upload.";
      toast.error(errorMessage);
    } finally {
      // Clear the timer when upload is done or failed
      if (clearCurrentTimer) {
        clearCurrentTimer();
      }
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedType) {
      toast.error("Please select a document type");
      return;
    }

    if (!documentTitle.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    if (!selectedJurisdiction) {
      toast.error("Please select a jurisdiction");
      return;
    }

    if (tempSelectedDocs.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    await uploadToBackend(tempSelectedDocs);
  };

  const cancelUpload = (): void => {
    setTempSelectedDocs([]);
    setDocumentTitle("");
    setSelectedType(null);
    setUploadDialogOpen(false);
  };

  const renderJurisdictionSelect = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Jurisdiction
      </label>
      <div className="relative">
        <Popover open={jurisdictionOpen} onOpenChange={setJurisdictionOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={jurisdictionOpen}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 bg-white border text-left text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="block truncate text-gray-900">
                  {selectedJurisdiction
                    ? selectedJurisdiction.jurisdiction
                    : "Select jurisdiction..."}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-500" />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            sideOffset={4}
          >
            <Command className="max-h-[300px] overflow-auto rounded-md border border-gray-200 bg-white shadow-md">
              <CommandInput
                placeholder="Search jurisdiction..."
                className="h-10 px-3 border-b text-sm"
              />
              <CommandEmpty className="py-2 px-3 text-sm text-gray-500">
                No jurisdiction found.
              </CommandEmpty>
              <CommandGroup>
                {jurisdictions.map((jurisdiction) => (
                  <CommandItem
                    key={jurisdiction.id}
                    value={jurisdiction.jurisdiction}
                    onSelect={() => {
                      setSelectedJurisdiction(jurisdiction);
                      setJurisdictionOpen(false);
                    }}
                    className="px-3 py-2 cursor-pointer text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-blue-600",
                          selectedJurisdiction?.id === jurisdiction.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span>{jurisdiction.jurisdiction}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  const renderUploadDialog = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{selectedType?.name}</h2>
          <button
            onClick={() => {
              setUploadDialogOpen(false);
              setSelectedJurisdiction(null);
              setDocumentTitle("");
              setTempSelectedDocs([]);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Document Title
            </label>
            <input
              type="text"
              id="title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="mt-1 block p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter document title"
            />
          </div>

          {selectedType && renderJurisdictionSelect()}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Documents ({selectedType?.acceptedFormats.join(", ")})
            </label>
            <div className="border-2 border-dashed border-gray-300 p-6 rounded text-center">
              <svg
                className="mx-auto h-10 w-10 text-gray-500 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-gray-600">Drag and drop files here</p>
              <p className="text-xs text-gray-400 mb-2">Or</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={selectedType?.acceptedFormats.join(",")}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border rounded hover:bg-gray-50 text-sm transition"
                type="button"
              >
                Browse Files
              </button>
            </div>

            {tempSelectedDocs.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Selected Documents ({tempSelectedDocs.length})
                  </h4>
                  <button
                    onClick={() => setTempSelectedDocs([])}
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    Clear All
                  </button>
                </div>

                {/* Scrollable container - shows 1 document by default, rest in scroll */}
                <div className="max-h-22 overflow-y-auto space-y-2">
                  {tempSelectedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <svg
                          className="w-5 h-5 text-blue-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.type} • {doc.size}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {tempSelectedDocs.length > 1 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Scroll to see all {tempSelectedDocs.length} selected
                    documents
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

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
            onClick={handleUpload}
            disabled={
              tempSelectedDocs.length === 0 ||
              !documentTitle.trim() ||
              isUploading
            }
            className={`px-4 py-2 text-white rounded transition flex items-center gap-2 ${
              tempSelectedDocs.length === 0 ||
              !documentTitle.trim() ||
              isUploading
                ? "bg-gray-600 opacity-50 cursor-not-allowed"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
            type="button"
          >
            {isUploading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isUploading
              ? "Uploading..."
              : `Upload ${tempSelectedDocs.length} Document${
                  tempSelectedDocs.length > 1 ? "s" : ""
                }`}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6  ">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Document Upload Center</h1>
        <p className="text-gray-600">
          Select document type first, then upload your files for analysis
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setTypeSelectionOpen(true)}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div className="text-left">
            <span className="font-medium">Upload Documents</span>
            <p className="text-xs text-gray-500">Choose document type first</p>
          </div>
        </button>
      </div>

      {typeSelectionOpen && (
        <Overlay>
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border-gray-200 border-1 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Select Document Type</h2>
                <p className="text-gray-600">
                  Choose the category that best describes your documents
                </p>
              </div>
              <button
                onClick={() => setTypeSelectionOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
                type="button"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
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
                    if (e.key === "Enter" || e.key === " ") {
                      handleTypeSelection(type);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600">{type.icon}</div>
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-sm text-gray-600">
                        {type.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Accepts: {type.acceptedFormats.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {uploadDialogOpen && <Overlay>{renderUploadDialog()}</Overlay>}
    </div>
  );
};

export default DocumentUploadComponent;
