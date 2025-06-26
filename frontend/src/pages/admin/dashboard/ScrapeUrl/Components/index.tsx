import API from "@/lib/api";
import React, { useState } from "react";
import { toast } from "sonner";

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

interface OverlayProps {
  children: React.ReactNode;
}

const Overlay: React.FC<OverlayProps> = ({ children }) => (
  <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50 p-4 ">
    {children}
  </div>
);

const ScrapeUrl = () => {
  const [typeSelectionOpen, setTypeSelectionOpen] = useState<boolean>(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [url, setUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleTypeSelection = (type: DocumentType): void => {
    setSelectedType(type);
    setTypeSelectionOpen(false);
    setUrlDialogOpen(true);
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleScrape = async () => {
    if (!selectedType) {
      toast.error("Please select a document type");
      return;
    }

    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!isValidUrl(url.trim())) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append("type", selectedType.id);
    formData.append("url", url);
    console.log(selectedType.id)

    try {
      // Console log the data instead of API call
      const response = await API.post("/documents/scrape/url", {
        type: selectedType.id,
        filePath :url
      }, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (response.status < 200 || response.status >= 300) {
          throw new Error(
            `Upload failed for ${url}`
          );
        }

        toast.success(`✅ ${url} uploaded successfully!`);


      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear state
      setUrl("");
      setSelectedType(null);
      setUrlDialogOpen(false);

      toast.success("URL scraped successfully!");
    } catch (error) {
      console.error("Scraping error:", error);
      toast.error("Failed to scrape URL");
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelScrape = (): void => {
    setUrl("");
    setSelectedType(null);
    setUrlDialogOpen(false);
  };

  const renderUrlDialog = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{selectedType?.name}</h2>
          <button
            onClick={() => {
              setUrlDialogOpen(false);
              setUrl("");
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
              htmlFor="url"
              className="block text-sm font-medium text-gray-700"
            >
              Enter URL to Scrape
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 block p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
              placeholder="https://example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a valid URL to scrape content for {selectedType?.name.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {isProcessing && (
            <div className="flex-1 flex items-center">
              <span className="text-sm text-gray-500">
                Processing URL... please wait
              </span>
            </div>
          )}

          <button
            onClick={cancelScrape}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            disabled={isProcessing}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleScrape}
            disabled={!url.trim() || isProcessing}
            className={`px-4 py-2 text-white rounded transition flex items-center gap-2 ${!url.trim() || isProcessing
                ? "bg-gray-600 opacity-50 cursor-not-allowed"
                : "bg-gray-600 hover:bg-gray-700"
              }`}
            type="button"
          >
            {isProcessing && (
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
            {isProcessing ? "Processing..." : "Start Scraping"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">URL Scraping Center</h1>
        <p className="text-gray-600">
          Start scraping with URL - Select document type first, then enter URL to scrape
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
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
            />
          </svg>
          <div className="text-left">
            <span className="font-medium">Upload URL</span>
            <p className="text-xs text-gray-500">Choose document type first</p>
          </div>
        </button>
      </div>

      {typeSelectionOpen && (
        <Overlay>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border-gray-200 border-1 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Select Document Type</h2>
                <p className="text-gray-600">
                  Choose the category that best describes the content you want to scrape
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
                        Scrape content related to {type.name.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {urlDialogOpen && <Overlay>{renderUrlDialog()}</Overlay>}
    </div>
  );
};

export default ScrapeUrl;