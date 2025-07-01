"use client"

import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Pencil, Eye, RefreshCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import API from "@/lib/api"
import { toast } from "sonner"
import { EditDocumentModal } from "./edit-documet-model" // Adjust path as needed
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface Contract {
  id: string
  fileName: string
  type: string
  title: string
  isEnabled: boolean
  jurisdiction: string
  source: string
  createdAt: string
  filePath: string
  status?: boolean
}

interface ContractsResponse {
  success: boolean
  data: Contract[]
  count: number
}

interface Regulation {
  createdAt: string
  updatedAt: string
  type: string
  jurisdiction: string
  citation: string
  title: string
  source_url: string
  isEnabled: boolean
  filePath: string
  section: string
  subject_area: string
  id: string
  fileName?: string // Added fileName for regulations
  status?: boolean
}

interface Statute {
  createdAt: string
  updatedAt: string
  jurisdiction: string
  title: string
  fileName: string
  code: string
  isEnabled: boolean
  type: string
  filePath: string
  source_url: string
  court: string
  citation: string
  holding_summary: string
  decision_date: string
  id: string
  status?: boolean
}

interface Case {
  createdAt: string
  updatedAt: string
  jurisdiction: string
  title: string
  fileName: string
  code: string
  isEnabled: boolean
  type: string
  filePath: string
  case_type:string
  name:string
  source_url: string
  section: string
  holding_summary: string
  id: string
  status?: boolean
  content_html?: string
}

interface RegulationsResponse {
  success: boolean
  data: Regulation[]
}

interface StatutesResponse {
  success: boolean
  data: Statute[]
}

interface CasesResponse {
  success: boolean
  data: Case[]
}

type DocumentType = "contracts" | "regulations" | "statutes" | "cases"

export default function DocumentsTable() {
  const [documentType, setDocumentType] = useState<DocumentType>("contracts")
  const [searchTerm, setSearchTerm] = useState("")
  const [contracts, setContracts] = useState<Contract[]>([])
  const [regulations, setRegulations] = useState<Regulation[]>([])
  const [statutes, setStatutes] = useState<Statute[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editDocument, setEditDocument] = useState<Contract | Regulation | Statute | Case | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Contract | Regulation | Statute | Case | null>(null)
  const [documentDetails, setDocumentDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const fetchDocuments = async (type: DocumentType) => {
    setLoading(true)
    setError(null)
    try {
      const url = `/documents/${type}`
      console.log(`Fetching ${type} from ${url}`)
      const response = await API.get(url)
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to fetch ${type}`)
      }

      const responseData = response.data
      console.log(`Response data for ${type}:`, responseData)

      if (type === "contracts") {
        const contractsResponse = responseData as ContractsResponse
        if (contractsResponse.success) {
          setContracts(contractsResponse.data)
        } else {
          setContracts([])
        }
      } else if (type === "regulations") {
        const regulationsResponse = responseData as RegulationsResponse
        if (regulationsResponse.success) {
          setRegulations(regulationsResponse.data)
        } else {
          setRegulations([])
        }
      } else if (type === "statutes") {
        const statutesResponse = responseData as StatutesResponse
        if (statutesResponse.success) {
          setStatutes(statutesResponse.data)
        } else {
          setStatutes([])
        }
      } else if (type === "cases") {
        const casesResponse = responseData as CasesResponse
        if (casesResponse.success) {
          setCases(casesResponse.data)
        } else {
          setCases([])
        }
      }
    } catch (err) {
      console.error("Error fetching documents:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      if (type === "contracts") {
        setContracts([])
      } else if (type === "regulations") {
        setRegulations([])
      } else if (type === "statutes") {
        setStatutes([])
      } else if (type === "cases") {
        setCases([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments(documentType)
  }, [documentType])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredContracts = contracts.filter((contract) =>
    Object.values(contract).some((value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const filteredRegulations = regulations.filter((regulation) =>
    Object.values(regulation).some(
      (value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  )

  const filteredStatutes = statutes.filter((statute) =>
    Object.values(statute).some((value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const filteredCases = cases.filter((caseItem) =>
    Object.values(caseItem).some((value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Sort the filtered data based on date
  const sortedContracts = [...filteredContracts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const sortedRegulations = [...filteredRegulations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const sortedStatutes = [...filteredStatutes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const sortedCases = [...filteredCases].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  // Update pagination calculations to use sorted data
  const totalItems =
    documentType === "contracts"
      ? sortedContracts.length
      : documentType === "regulations"
        ? sortedRegulations.length
        : documentType === "statutes"
          ? sortedStatutes.length
          : sortedCases.length

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const paginatedContracts = sortedContracts.slice(startIndex, endIndex)
  const paginatedRegulations = sortedRegulations.slice(startIndex, endIndex)
  const paginatedStatutes = sortedStatutes.slice(startIndex, endIndex)
  const paginatedCases = sortedCases.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDocumentTypeChange = (value: DocumentType) => {
    setDocumentType(value)
    setCurrentPage(1) // Reset to first page when changing document type
  }

  const handleStatusToggle = async (documentId: string, currentStatus: boolean, type: string) => {
    setLoadingIds((prev) => new Set(prev).add(documentId))
    try {
      // Use the correct endpoint - PUT /metadata/:documentId
      const response = await API.put(`documents/metadata/${type}/${documentId}`, {
        status: !currentStatus,
      })
      if (response.data.success) {
        toast.success("Status updated successfully")
        // Update local state immediately for better UX
        const newStatus = !currentStatus
        if (documentType === "contracts") {
          setContracts((prevContracts) =>
            prevContracts.map((contract) =>
              contract.id === documentId ? { ...contract, status: newStatus, isEnabled: newStatus } : contract,
            ),
          )
        } else if (documentType === "regulations") {
          setRegulations((prevRegulations) =>
            prevRegulations.map((regulation) =>
              regulation.id === documentId ? { ...regulation, status: newStatus, isEnabled: newStatus } : regulation,
            ),
          )
        } else if (documentType === "statutes") {
          setStatutes((prevStatutes) =>
            prevStatutes.map((statute) =>
              statute.id === documentId ? { ...statute, status: newStatus, isEnabled: newStatus } : statute,
            ),
          )
        } else if (documentType === "cases") {
          setCases((prevCases) =>
            prevCases.map((caseItem) =>
              caseItem.id === documentId ? { ...caseItem, status: newStatus, isEnabled: newStatus } : caseItem,
            ),
          )
        }
        setLoadingIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(documentId) // Stop loading
          return newSet
        })
        // Optionally, you can still refresh the data in the background
        // fetchDocuments(documentType);
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    }
  }

  const handleEditClick = (document: Contract | Regulation | Statute | Case) => {
    setEditDocument(document)
    // fetchDocuments(documentType)
    setEditModalOpen(true)
  }

  const handleModalClose = () => {
    setEditModalOpen(false)
    setEditDocument(null)
  }

  const handleDocumentUpdate = () => {
    fetchDocuments(documentType) // Refresh data after update
  }

  const fetchDocumentDetails = async (docType: DocumentType, docId: string) => {
    setLoadingDetails(true)
    try {
      const response = await API.get(`/documents/${docType}/${docId}`)
      if (response.data.success) {
        setDocumentDetails(response.data)
        console.log(response.data)
      } else {
        toast.error("Failed to fetch document details")
      }
    } catch (error) {
      console.error("Error fetching document details:", error)
      toast.error("Failed to fetch document details")
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleViewClick = (document: Contract | Regulation | Statute | Case) => {
    console.log("View document:", document)
    if (document.filePath.startsWith("http://") || document.filePath.startsWith("https://")) {
      // Open drawer with document details
      setSelectedDocument(document)
      setDrawerOpen(true)
      fetchDocumentDetails(documentType, document.id)
      return
    }

    let fileName = ""
    if ("fileName" in document && document.fileName) {
      fileName = document.fileName
    } else {
      // Fallback: create a filename from title or id if fileName is not available
      const title = document.title || document.id
      fileName = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`
    }

    if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
      // If the fileName is already a full URL, open it directly
      window.open(fileName, "_blank")
      return
    }

    // Construct the static file URL
    const url = import.meta.env.VITE_API_URL
    const fileUrl = `${url}/static/files/${fileName}`

    // Open the document in a new window/tab
    window.open(fileUrl, "_blank")
  }

  // Helper function to get document status - FIXED
  const getDocumentStatus = (document: Contract | Regulation | Statute | Case): boolean => {
    // Prioritize the status field if it exists, otherwise fall back to isEnabled
    return document.status !== undefined ? document.status : document.isEnabled
  }

  const handleClick = async () => {
    console.log("Scraping started")
    // toast.success('Scraping started successfully');
    const response = await API.post("/run-task")
    toast.success(response.data.message)
    if (response.status === 200) {
      console.log("Scraping completed successfully")
    } else {
      console.error("Error during scraping:", response.statusText)
    }
  }

  return (
    <div className=" space-y-4 h-full ">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Knowledge Base</CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Start Scraping</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will start the scraping process. Make sure everything is ready.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClick}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row  gap-4 mb-6">
            <Select value={documentType} onValueChange={handleDocumentTypeChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contracts">Contracts</SelectItem>
                <SelectItem value="regulations">Regulations</SelectItem>
                <SelectItem value="statutes">Statutes</SelectItem>
                <SelectItem value="cases">Cases</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 w-[24px]"
              />
            </div>
            <Button variant={"ghost"} className="p-6 bg-white text-black" onClick={() => fetchDocuments(documentType)}>
              <RefreshCcw />
            </Button>
          </div>

          {error && <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-md">Error: {error}</div>}

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="border rounded-lg">
              {documentType === "contracts" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Enable/Disable</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedContracts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No contracts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedContracts.map((contract, index) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">{index + 1 + startIndex}</TableCell>
                          <TableCell className="font-medium">{contract.fileName?.slice(0, 30) || "--"}</TableCell>
                          <TableCell className="font-medium">{contract.title?.slice(0, 30) || "--"}</TableCell>
                          <TableCell>{contract.type || "--"}</TableCell>
                          <TableCell>{contract.jurisdiction || "--"}</TableCell>
                          <TableCell>{contract.source || "--"}</TableCell>
                          <TableCell>{formatDate(contract.createdAt)}</TableCell>
                          <TableCell>
                            {loadingIds.has(contract.id) ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                              <Switch
                                checked={getDocumentStatus(contract)}
                                onCheckedChange={() =>
                                  handleStatusToggle(contract.id, getDocumentStatus(contract), contract.type)
                                }
                                className="data-[state=checked]:bg-primary"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 border-1 border-blue-400 hover:bg-blue-100"
                                onClick={() => handleViewClick(contract)}
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                className="h-10 w-10 border-1 border-gray-400 hover:bg-gray-400"
                                size="icon"
                                onClick={() => handleEditClick(contract)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ) : documentType === "regulations" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Source </TableHead>
                      <TableHead>Citation</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Enable/Disable</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRegulations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No regulations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRegulations.map((regulation, index) => (
                        <TableRow key={regulation.id}>
                          <TableCell className="font-medium">{index + 1 + startIndex}</TableCell>
                          <TableCell className="font-medium">{regulation.fileName?.slice(0, 30) || "--"}</TableCell>
                          <TableCell className="font-medium">{regulation.title.slice(0, 30) || "--"}</TableCell>
                          <TableCell className="font-medium">{regulation.source_url}</TableCell>
                          <TableCell>{regulation.citation?.slice(0, 30) || "--"}</TableCell>
                          <TableCell>{regulation.jurisdiction || "--"}</TableCell>
                          <TableCell>{formatDate(regulation.createdAt)}</TableCell>
                          <TableCell>
                            {loadingIds.has(regulation.id) ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                              <Switch
                                checked={getDocumentStatus(regulation)}
                                onCheckedChange={() =>
                                  handleStatusToggle(regulation.id, getDocumentStatus(regulation), regulation.type)
                                }
                                className="data-[state=checked]:bg-primary"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 border-1 border-blue-400 hover:bg-blue-100"
                                onClick={() => handleViewClick(regulation)}
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 border-1 border-gray-400 hover:bg-gray-400"
                                onClick={() => handleEditClick(regulation)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ) : documentType === "statutes" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>FileName</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Citation</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Enable/Disable</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStatutes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No statutes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStatutes.map((statute, index) => (
                        <TableRow key={statute.id}>
                          <TableCell className="font-medium">{index + 1 + startIndex}</TableCell>
                          <TableCell className="font-medium">{statute.fileName?.split("?")[0] || "--"}</TableCell>
                          <TableCell className="font-medium">{statute.title.slice(0, 30) || "--"}</TableCell>
                          <TableCell className="font-medium">{statute.source_url || "--"}</TableCell>
                          <TableCell>{statute.citation?.slice(0, 30) || "--"}</TableCell>
                          <TableCell>{statute.code?.slice(0, 15) || "--"}</TableCell>
                          <TableCell>{statute.jurisdiction || "--"}</TableCell>
                          <TableCell>{formatDate(statute.createdAt)}</TableCell>
                          <TableCell>
                            {loadingIds.has(statute.id) ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                              <Switch
                                checked={getDocumentStatus(statute)}
                                onCheckedChange={() =>
                                  handleStatusToggle(statute.id, getDocumentStatus(statute), statute.type)
                                }
                                className="data-[state=checked]:bg-primary"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 border-1 border-blue-400 hover:bg-blue-100"
                                onClick={() => handleViewClick(statute)}
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 border-1 border-gray-400 hover:bg-gray-400"
                                onClick={() => handleEditClick(statute)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>FileName</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>case_type</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Enable/Disable</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          No cases found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCases.map((caseItem, index) => (
                        <TableRow key={caseItem.id}>
                          <TableCell className="font-medium">{index + 1 + startIndex}</TableCell>
                          <TableCell className="font-medium">{caseItem.name?.slice(0 , 20) || "--"}</TableCell>
                          <TableCell className="font-medium">{caseItem.title?.slice(0, 30) || "--"}</TableCell>
                          <TableCell className="font-medium">{caseItem.source_url || "--"}</TableCell>
                          <TableCell className="font-medium">{caseItem.jurisdiction || "--"}</TableCell>
                          <TableCell>{caseItem.case_type || "--"}</TableCell>
                          <TableCell>{formatDate(caseItem.createdAt)}</TableCell>
                          <TableCell className="flex justify-center items-center">
                            {loadingIds.has(caseItem.id) ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                              <Switch
                                checked={getDocumentStatus(caseItem)}
                                onCheckedChange={() =>
                                  handleStatusToggle(caseItem.id, getDocumentStatus(caseItem), caseItem.type)
                                }
                                className="data-[state=checked]:bg-primary"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 border-1 border-blue-400 hover:bg-blue-100"
                                onClick={() => handleViewClick(caseItem)}
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 border-1 border-gray-400 hover:bg-gray-400"
                                onClick={() => handleEditClick(caseItem)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
              </div>
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber
                      if (totalPages <= 5) {
                        pageNumber = i + 1
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i
                      } else {
                        pageNumber = currentPage - 2 + i
                      }
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNumber)}
                            isActive={currentPage === pageNumber}
                            className="cursor-pointer"
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Document Modal */}
      {editModalOpen && editDocument && (
        <EditDocumentModal
          isOpen={editModalOpen}
          document={editDocument}
          documentType={documentType}
          onClose={handleModalClose}
          onUpdate={handleDocumentUpdate}
        />
      )}

      {/* Document Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[450px] sm:w-[540px]">
          <div className="mt-6 space-y-4">
            {loadingDetails ? (
              <div className="text-center py-8">Loading document details...</div>
            ) : documentDetails ? (
              <div className="space-y-4">
                {/* Show content_html if available */}
                {documentDetails.content_html ? (
                  <div className="space-y-4 m-6 overflow-y-auto  overflow-x-hidden">
                    <div>
                      <label className="text-md font-semibold text-gray-800 mb-2 block">Document Content</label>
                      <h2 className="text-sm mb-5 break-words whitespace-normal">
                        <span className="font-bold">Title: </span>
                        {selectedDocument?.title || "Document Information"}
                      </h2>
                      <h2 className="text-sm mb-5 break-words whitespace-normal">
                        <span className="font-bold">Source URL: </span>
                        <a href={`${selectedDocument?.filePath}`} target="_blank">
                          {selectedDocument?.filePath || "URL Not Found"}
                        </a>
                      </h2>
                      <div
                        className="border rounded-lg p-4 max-h-[70vh]  overflow-y-auto  bg-gray-50 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
                        dangerouslySetInnerHTML={{ __html: documentDetails.content_html }}
                        style={{
                          scrollBehavior: "smooth",
                          WebkitOverflowScrolling: "touch",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p>Document Data are not Found</p>
                )}
                {/* Show Open Document button only if filePath exists and no content_html */}
                {documentDetails.filePath && !documentDetails.content_html && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => {
                        const url = import.meta.env.VITE_API_URL
                        const fileUrl = `${url}/static/files/${documentDetails.filePath}`
                        window.open(fileUrl, "_blank")
                      }}
                      className="w-full"
                    >
                      Open Document
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No document details available</div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
