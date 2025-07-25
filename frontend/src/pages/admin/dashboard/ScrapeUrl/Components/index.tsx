"use client"

import API from "@/lib/api"
import { Link } from "lucide-react"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { getStateNameByCode } from "../../../../common/usStatesWithCodes"

interface DocumentType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  acceptedFormats: string[]
}

interface Jurisdiction {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  jurisdiction: string
  userId: string
}

const documentTypes: DocumentType[] = [
  {
    id: "Contract",
    name: "Contracts",
    description: "Employment contracts, NDAs, service agreements",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    description: "Legislative acts, laws, regulations, codes, and statutory texts",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
]

interface OverlayProps {
  children: React.ReactNode
}

const Overlay: React.FC<OverlayProps> = ({ children }) => (
  <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50 p-4 ">{children}</div>
)

interface UrlStatus {
  url: string
  status: "pending" | "processing" | "success" | "error"
  message?: string
}

const ScrapeUrl = () => {
  const [typeSelectionOpen, setTypeSelectionOpen] = useState<boolean>(false)
  const [urlDialogOpen, setUrlDialogOpen] = useState<boolean>(false)
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null)
  const [urlInput, setUrlInput] = useState<string>("")
  const [urls, setUrls] = useState<UrlStatus[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [allowMultipleUrls, setAllowMultipleUrls] = useState<boolean>(false)
  const [currentUrlIndex, setCurrentUrlIndex] = useState<number>(0)

  // Jurisdiction states
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([])
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null)
  const [jurisdictionSearch, setJurisdictionSearch] = useState<string>("")
  const [showJurisdictionDropdown, setShowJurisdictionDropdown] = useState<boolean>(false)
  const jurisdictionDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch jurisdictions on component mount
  useEffect(() => {
    const fetchJurisdictions = async () => {
      try {
        const response = await API.get("/jurisdictions")
        setJurisdictions(response.data)
      } catch (error) {
        toast.error("Failed to load jurisdictions")
      }
    }
    fetchJurisdictions()
  }, [])

  // Close jurisdiction dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (jurisdictionDropdownRef.current && !jurisdictionDropdownRef.current.contains(event.target as Node)) {
        setShowJurisdictionDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleTypeSelection = (type: DocumentType): void => {
    setSelectedType(type)
    setTypeSelectionOpen(false)
    setUrlDialogOpen(true)
  }

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString)
      return true
    } catch {
      return false
    }
  }

  const parseUrls = (input: string): string[] => {
    // Split by newlines, commas, or spaces and filter out empty strings
    return input
      .split(/[\n,\s]+/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
  }

  const validateUrls = (urlList: string[]): boolean => {
    if (urlList.length === 0) {
      toast.error("Please enter at least one URL")
      return false
    }

    const invalidUrls = urlList.filter((url) => !isValidUrl(url))
    if (invalidUrls.length > 0) {
      toast.error(`Invalid URLs detected: ${invalidUrls.join(", ")}`)
      return false
    }

    return true
  }

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUrlInput(e.target.value)

    if (allowMultipleUrls) {
      const parsedUrls = parseUrls(e.target.value)
      setUrls(parsedUrls.map((url) => ({ url, status: "pending" })))
    }
  }

  const handleScrapeMultiple = async () => {
    if (!selectedType) {
      toast.error("Please select a document type")
      return
    }

    if (!selectedJurisdiction) {
      toast.error("Please select a jurisdiction")
      return
    }

    const parsedUrls = parseUrls(urlInput)
    if (!validateUrls(parsedUrls)) {
      return
    }

    setUrls(parsedUrls.map((url) => ({ url, status: "pending" })))
    setIsProcessing(true)
    setCurrentUrlIndex(0)

    // Process URLs sequentially
    for (let i = 0; i < parsedUrls.length; i++) {
      setCurrentUrlIndex(i)
      const url = parsedUrls[i]

      // Update status to processing
      setUrls((prev) => prev.map((item, idx) => (idx === i ? { ...item, status: "processing" } : item)))

      try {
        const response = await API.post(
          "/documents/scrape/url",
          {
            type: selectedType.id,
            filePath: url,
            jurisdiction: selectedJurisdiction.jurisdiction,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        )

        if (response.status < 200 || response.status >= 300) {
          throw new Error(`Upload failed for ${url}`)
        }

        // Update status to success
        setUrls((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: "success", message: "Successfully scraped" } : item)),
        )

        toast.success(`✅ ${url} uploaded successfully!`)
      } catch (error) {
        console.error("Scraping error:", error)

        // Update status to error
        setUrls((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: "error", message: "Failed to scrape" } : item)),
        )

        toast.error(`Failed to scrape URL: ${url}`)
      }
    }

    setIsProcessing(false)
    // Clear the input and URLs list after processing is complete, then close dialog
    setTimeout(() => {
      setUrlInput("")
      setUrls([])
      setUrlDialogOpen(false)
      setSelectedType(null)
      setSelectedJurisdiction(null)
      setJurisdictionSearch("")
      setAllowMultipleUrls(false)
    }, 100) 

    toast.success("URL scraping completed!")
  }

  const handleScrape = async () => {
    if (allowMultipleUrls) {
      await handleScrapeMultiple()
      return
    }

    if (!selectedType) {
      toast.error("Please select a document type")
      return
    }

    if (!urlInput.trim()) {
      toast.error("Please enter a URL")
      return
    }

    if (!isValidUrl(urlInput.trim())) {
      toast.error("Please enter a valid URL")
      return
    }

    if (!selectedJurisdiction) {
      toast.error("Please select a jurisdiction")
      return
    }

    setIsProcessing(true)

    try {
      const response = await API.post(
        "/documents/scrape/url",
        {
          type: selectedType.id,
          filePath: urlInput.trim(),
          jurisdiction: selectedJurisdiction.jurisdiction,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      )

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Upload failed for ${urlInput}`)
      }

      toast.success(`✅ ${urlInput} uploaded successfully!`)

      // Clear state
      setUrlInput("")
      setUrls([]) // Add this line
      setSelectedType(null)
      setSelectedJurisdiction(null)
      setJurisdictionSearch("")
      setUrlDialogOpen(false)
      toast.success("URL scraped successfully!")
    } catch (error) {
      console.error("Scraping error:", error)
      toast.error("Failed to scrape URL")
    } finally {
      setIsProcessing(false)
    }
  }

  const cancelScrape = (): void => {
    setUrlInput("")
    setUrls([])
    setSelectedType(null)
    setSelectedJurisdiction(null)
    setJurisdictionSearch("")
    setUrlDialogOpen(false)
    setAllowMultipleUrls(false)
  }

  // Filter jurisdictions based on search
  const filteredJurisdictions = jurisdictions.filter((jurisdiction) => {
    const stateCode = getStateNameByCode(jurisdiction.jurisdiction)
    const searchLower = jurisdictionSearch.toLowerCase()
    return (
      jurisdiction.jurisdiction.toLowerCase().includes(searchLower) || stateCode.toLowerCase().includes(searchLower)
    )
  })

  const handleJurisdictionSelect = (jurisdiction: Jurisdiction) => {
    setSelectedJurisdiction(jurisdiction)
    const stateName = getStateNameByCode(jurisdiction.jurisdiction)
    setJurisdictionSearch(` ${stateName} (${jurisdiction.jurisdiction})`)
    setShowJurisdictionDropdown(false)
  }

  const renderUrlDialog = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{selectedType?.name}</h2>
          <button
            onClick={() => {
              setUrlDialogOpen(false)
              setUrlInput("")
              setUrls([])
              setSelectedJurisdiction(null)
              setJurisdictionSearch("")
              setAllowMultipleUrls(false)
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                Enter URL{allowMultipleUrls ? "s" : ""} to Scrape
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allow-multiple"
                  checked={allowMultipleUrls}
                  onChange={(e) => setAllowMultipleUrls(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="allow-multiple" className="text-sm text-gray-600">
                  Multiple URLs
                </label>
              </div>
            </div>
            <textarea
              id="url"
              value={urlInput}
              onChange={handleUrlInputChange}
              className="mt-1 block p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
              placeholder={
                allowMultipleUrls ? "Enter multiple URLs (one per line)" : "https://example.com"
              }
              rows={allowMultipleUrls ? 4 : 1}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter {allowMultipleUrls ? "valid URLs" : "a valid URL"} to scrape content for{" "}
              {selectedType?.name.toLowerCase()}
            </p>
          </div>

          {/* Jurisdiction Selection */}
          <div className="relative" ref={jurisdictionDropdownRef}>
            <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700">
              Select Jurisdiction
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                id="jurisdiction"
                value={jurisdictionSearch}
                onChange={(e) => {
                  setJurisdictionSearch(e.target.value)
                  setShowJurisdictionDropdown(true)
                  if (!e.target.value) {
                    setSelectedJurisdiction(null)
                  }
                }}
                onFocus={() => setShowJurisdictionDropdown(true)}
                className="block p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
                placeholder="Search and select jurisdiction..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {showJurisdictionDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredJurisdictions.length > 0 ? (
                  filteredJurisdictions.map((jurisdiction) => (
                    <div
                      key={jurisdiction.id}
                      onClick={() => handleJurisdictionSelect(jurisdiction)}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span className="text-sm">
                        {getStateNameByCode(jurisdiction.jurisdiction)} ({jurisdiction.jurisdiction})
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No jurisdictions found</div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Select the jurisdiction for this document</p>
          </div>

          {/* URL Status List */}
          {allowMultipleUrls && urls.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">URLs to Process ({urls.length})</h3>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        URL
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {urls.map((urlItem, index) => (
                      <tr key={index} className={index === currentUrlIndex && isProcessing ? "bg-blue-50" : ""}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <div className="truncate max-w-[200px]">{urlItem.url}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          {urlItem.status === "pending" && <span className="text-gray-500">Pending</span>}
                          {urlItem.status === "processing" && (
                            <span className="text-blue-500 flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500"
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
                              Processing
                            </span>
                          )}
                          {urlItem.status === "success" && <span className="text-green-500">✓ Success</span>}
                          {urlItem.status === "error" && <span className="text-red-500">✗ Failed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {isProcessing && (
            <div className="flex-1 flex items-center">
              <span className="text-sm text-gray-500">
                {allowMultipleUrls
                  ? `Processing URL ${currentUrlIndex + 1} of ${urls.length}...`
                  : "Processing URL... please wait"}
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
            disabled={
              (allowMultipleUrls ? urls.length === 0 : !urlInput.trim()) || !selectedJurisdiction || isProcessing
            }
            className={`px-4 py-2 text-white rounded transition flex items-center gap-2 ${
              (allowMultipleUrls ? urls.length === 0 : !urlInput.trim()) || !selectedJurisdiction || isProcessing
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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
  )

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">URL Scraping Center</h1>
        <p className="text-gray-600">Start scraping with URL - Select document type first, then enter URL to scrape</p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setTypeSelectionOpen(true)}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Link />
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
                <p className="text-gray-600">Choose the category that best describes the content you want to scrape</p>
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
                    if (e.key === "Enter" || e.key === " ") {
                      handleTypeSelection(type)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600">{type.icon}</div>
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Scrape content related to {type.name.toLowerCase()}</p>
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
  )
}

export default ScrapeUrl
