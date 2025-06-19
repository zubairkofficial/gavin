"use client";

import { useState, useEffect } from "react";
import { Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { EditDocumentModal } from "./edit-documet-model";
import { Toaster } from "sonner";
import API from "@/lib/api";

interface Contract {
  id: string;
  fileName: string;
  type: string;
  title: string;
  jurisdiction: string;
  source: string;
  createdAt: string;
}

interface ContractsResponse {
  success: boolean;
  data: Contract[];
  count: number;
}

interface Regulation {
  createdAt: string;
  updatedAt: string;
  type: string;
  jurisdiction: string;
  citation: string;
  title: string;
  section: string;
  subject_area: string;
  id: string;
}

interface Statute {
  createdAt: string;
  updatedAt: string;
  jurisdiction: string;
  title: string;
  fileName: string;
  type: string;
  court: string;
  citation: string;
  holding_summary: string;
  decision_date: string;
  id: string;
}

interface RegulationsResponse {
  success: boolean;
  data: Regulation[];
}

interface StatutesResponse {
  success: boolean;
  data: Statute[];
}

type DocumentType = "contracts" | "regulations" | "statutes";

// Add a function to check if all fields have data for contracts
const isContractComplete = (contract: Contract): boolean => {
  return Boolean(
    contract.id &&
      contract.type &&
      contract.jurisdiction &&
      contract.source &&
      contract.createdAt
  );
};

// Add a function to check if all fields have data for regulations
const isRegulationComplete = (regulation: Regulation): boolean => {
  return Boolean(
    regulation.createdAt &&
      regulation.updatedAt &&
      regulation.jurisdiction &&
      regulation.citation &&
      regulation.title &&
      regulation.section &&
      regulation.subject_area
  );
};

// Add a function to check if all fields have data for statutes
const isStatuteComplete = (statute: Statute): boolean => {
  return Boolean(
    statute.createdAt &&
      statute.updatedAt &&
      statute.type &&
      statute.jurisdiction &&
      statute.title &&
      statute.fileName &&
      statute.court &&
      statute.citation &&
      statute.holding_summary &&
      statute.decision_date
  );
};

export default function DocumentsTable() {
  const [documentType, setDocumentType] = useState<DocumentType>("contracts");
  const [searchTerm, setSearchTerm] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [statutes, setStatutes] = useState<Statute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // const [totalCount, setTotalCount] = useState(0)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<
    Contract | Regulation | Statute | null
  >(null);

  const fetchDocuments = async (type: DocumentType) => {
    setLoading(true);
    setError(null);

    try {
      const url = `/documents/${type}`;
      console.log(`Fetching ${type} from ${url}`);
      const response = await API.get(url);

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to fetch ${type}`);
      }

      const responseData = response.data;
      console.log(`Response data for ${type}:`, responseData);

      if (type === "contracts") {
        // Handle contracts response format
        const contractsResponse = responseData as ContractsResponse;
        if (contractsResponse.success) {
          setContracts(contractsResponse.data);
          // setTotalCount(contractsResponse.count)
        } else {
          setContracts([]);
          // setTotalCount(0)
        }
      } else if (type === "regulations") {
        // Handle regulations response format
        const regulationsResponse = responseData as RegulationsResponse;
        if (regulationsResponse.success) {
          setRegulations(regulationsResponse.data);
        } else {
          setRegulations([]);
        }
      } else if (type === "statutes") {
        // Handle statutes response format
        const statutesResponse = responseData as StatutesResponse;
        if (statutesResponse.success) {
          setStatutes(statutesResponse.data);
        } else {
          setStatutes([]);
        }
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      if (type === "contracts") {
        setContracts([]);
      } else if (type === "regulations") {
        setRegulations([]);
      } else if (type === "statutes") {
        setStatutes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(documentType);
  }, [documentType]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredContracts = contracts.filter((contract) =>
    Object.values(contract).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredRegulations = regulations.filter((regulation) =>
    Object.values(regulation).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredStatutes = statutes.filter((statute) =>
    Object.values(statute).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort the filtered data based on date
  const sortedContracts = [...filteredContracts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const sortedRegulations = [...filteredRegulations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const sortedStatutes = [...filteredStatutes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Update pagination calculations to use sorted data
  const totalItems =
    documentType === "contracts"
      ? sortedContracts.length
      : documentType === "regulations"
      ? sortedRegulations.length
      : sortedStatutes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedContracts = sortedContracts.slice(startIndex, endIndex);
  const paginatedRegulations = sortedRegulations.slice(startIndex, endIndex);
  const paginatedStatutes = sortedStatutes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDocumentTypeChange = (value: DocumentType) => {
    setDocumentType(value);
    setCurrentPage(1); // Reset to first page when changing document type
  };



  const handleStatusClick = (document: Contract | Regulation | Statute) => {
    setSelectedDocument(document);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    // We'll keep the selected document until the modal is fully closed
    // to prevent UI flicker
    setTimeout(() => {
      setSelectedDocument(null);
    }, 300);
  };

  const handleUpdateSuccess = () => {
    fetchDocuments(documentType);
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select
              value={documentType}
              onValueChange={handleDocumentTypeChange}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contracts">Contracts</SelectItem>
                <SelectItem value="regulations">Regulations</SelectItem>
                <SelectItem value="statutes">Statutes</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-md">
              Error: {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="border rounded-lg">
              {documentType === "contracts" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedContracts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No contracts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">
                            {contract.id.slice(-4)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {contract.title}
                          </TableCell>
                          <TableCell>{contract.type}</TableCell>
                          <TableCell>{contract.jurisdiction}</TableCell>
                          <TableCell>{contract.source}</TableCell>
                          <TableCell>
                            {formatDate(contract.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-gray-300"
                              onClick={() => handleStatusClick(contract)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Citation</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Subject Area</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRegulations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No regulations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRegulations.map((regulation) => (
                        <TableRow key={regulation.id}>
                          <TableCell className="font-medium">
                            {regulation.id.slice(-4)}
                          </TableCell>
                          <TableCell
                            className="font-medium"
                            title={regulation.title}
                          >
                            {regulation.title.length > 25
                              ? `${regulation.title.slice(0, 25)}...`
                              : regulation.title}
                          </TableCell>
                          <TableCell>{regulation.type}</TableCell>
                          <TableCell>{regulation.jurisdiction}</TableCell>
                          <TableCell>{regulation.citation || "N/A"}</TableCell>
                          <TableCell>{regulation.section || "N/A"}</TableCell>
                          <TableCell>
                            {regulation.subject_area || "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatDate(regulation.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-gray-300"
                                onClick={() => handleStatusClick(regulation)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Court</TableHead>
                      <TableHead>Citation</TableHead>
                      <TableHead>Decision Date</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStatutes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No statutes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStatutes.map((statute) => (
                        <TableRow key={statute.id}>
                          <TableCell className="font-medium">
                            {statute.id.slice(-4)}
                          </TableCell>
                          <TableCell
                            className="font-medium"
                            title={statute.title}
                          >
                            {statute.title.length > 25
                              ? `${statute.title.slice(0, 25)}...`
                              : statute.title}
                          </TableCell>
                          <TableCell>{statute.type}</TableCell>
                          <TableCell>{statute.jurisdiction}</TableCell>
                          <TableCell>{statute.court || "N/A"}</TableCell>
                          <TableCell>{statute.citation || "N/A"}</TableCell>
                          <TableCell>
                            {statute.decision_date
                              ? formatDate(statute.decision_date)
                              : "N/A"}
                          </TableCell>
                          <TableCell>{formatDate(statute.createdAt)}</TableCell>
                          <TableCell>
                           <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-gray-300"
                                onClick={() => handleStatusClick(statute)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
                {totalItems} results
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          handlePageChange(Math.max(1, currentPage - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
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
                      );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          handlePageChange(
                            Math.min(totalPages, currentPage + 1)
                          )
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <EditDocumentModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        documentType={documentType}
        document={selectedDocument}
        onUpdate={handleUpdateSuccess}
      />
      <Toaster />
    </div>
  );
}
