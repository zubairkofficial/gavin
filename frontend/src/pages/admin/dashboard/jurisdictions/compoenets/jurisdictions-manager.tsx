"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Search, Plus, Trash2, Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import API from "@/lib/api"

interface Jurisdiction {
  id: number
  jurisdiction: string
  createdAt: string
}

export default function JurisdictionsManager() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([])
  const [filteredJurisdictions, setFilteredJurisdictions] = useState<Jurisdiction[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditingDialogOpen, setIsEditingDialogOpen] = useState(false)
  const [isAddingJurisdiction, setIsAddingJurisdiction] = useState(false)
  const [isEditingJurisdiction, setIsEditingJurisdiction] = useState(false)
  const [newJurisdictionName, setNewJurisdictionName] = useState("")
  const [editingJurisdiction, setEditingJurisdiction] = useState<Jurisdiction | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Load jurisdictions on component mount
  useEffect(() => {
    const loadJurisdictions = async () => {
      setIsLoading(true)
      try {
        const response = await API.get("/jurisdictions")
        setJurisdictions(response.data)
        setFilteredJurisdictions(response.data)
      } catch (error) {
        toast.error("Failed to load jurisdictions")
      } finally {
        setIsLoading(false)
      }
    }
    loadJurisdictions()
  }, [])

  // Filter jurisdictions based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredJurisdictions(jurisdictions)
    } else {
      const filtered = jurisdictions.filter((jurisdiction) =>
        jurisdiction.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredJurisdictions(filtered)
    }
  }, [searchQuery, jurisdictions])

  // Add new jurisdiction
  const handleAddJurisdiction = async () => {
    if (!newJurisdictionName.trim()) {
      toast.error("Jurisdiction name is required")
      return
    }

    // Check if jurisdiction already exists
    const exists = jurisdictions.some(
      (j) => j.jurisdiction.toLowerCase() === newJurisdictionName.toLowerCase(),
    )

    if (exists) {
      toast.error("Jurisdiction already exists")
      return
    }

    setIsAddingJurisdiction(true)

    try {
      const response = await API.post("/jurisdictions", {
        jurisdiction: newJurisdictionName.trim(),
      })

      setJurisdictions((prev) => [response.data, ...prev])
      setNewJurisdictionName("")
      setIsAddDialogOpen(false)

      toast.success("Jurisdiction added successfully")
    } catch (error) {
      toast.error("Failed to add jurisdiction")
    } finally {
      setIsAddingJurisdiction(false)
    }
  }

  // Handle edit jurisdiction
  const handleEditJurisdiction = async () => {
    if (!editingJurisdiction) return
    if (!editingJurisdiction.jurisdiction.trim()) {
      toast.error("Jurisdiction name is required")
      return
    }

    // Check if jurisdiction already exists
    const exists = jurisdictions.some(
      (j) =>
        j.id !== editingJurisdiction.id &&
        j.jurisdiction.toLowerCase() === editingJurisdiction.jurisdiction.toLowerCase(),
    )

    if (exists) {
      toast.error("Jurisdiction already exists")
      return
    }

    setIsEditingJurisdiction(true)

    try {
      const response = await API.patch(`/jurisdictions/${editingJurisdiction.id}`, {
        jurisdiction: editingJurisdiction.jurisdiction.trim(),
      })

      setJurisdictions((prev) =>
        prev.map((j) => (j.id === editingJurisdiction.id ? response.data : j)),
      )
      setIsEditingDialogOpen(false)
      setEditingJurisdiction(null)

      toast.success("Jurisdiction updated successfully")
    } catch (error) {
      toast.error("Failed to update jurisdiction")
    } finally {
      setIsEditingJurisdiction(false)
    }
  }

  // Delete jurisdiction
  const handleDeleteJurisdiction = async (id: number) => {
    setDeletingId(id)
    console.log("Deleting jurisdiction with ID:", id)
    try {
      await API.delete(`/jurisdictions/${id}`)
      setJurisdictions((prev) => prev.filter((j) => j.id !== id))
      toast.success("Jurisdiction deleted successfully")
    } catch (error) {
      toast.error("Failed to delete jurisdiction")
    } finally {
      setDeletingId(null)
    }
  }

  // Get current jurisdictions for pagination
  const getCurrentJurisdictions = () => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return filteredJurisdictions.slice(indexOfFirstItem, indexOfLastItem)
  }

  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Jurisdictions Management</h1>
      </div>

      {/* Search and Add Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 ">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search jurisdictions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} >
          <DialogTrigger asChild >
            <Button className="h-12">
              <Plus className="h-4 w-4 mr-2 " />
              Add Jurisdiction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] p-6">
            <DialogHeader>
              <DialogTitle>Add New Jurisdiction</DialogTitle>
              <DialogDescription>Enter the name of the new jurisdiction you want to add.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="jurisdiction" className="text-right">
                  Jurisdiction
                </Label>
                <Input
                  id="jurisdiction"
                  placeholder="Enter jurisdiction name"
                  className="col-span-3"
                  value={newJurisdictionName}
                  onChange={(e) => setNewJurisdictionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddJurisdiction()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setNewJurisdictionName("")
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddJurisdiction} disabled={isAddingJurisdiction}>
                {isAddingJurisdiction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAddingJurisdiction ? "Adding..." : "Add Jurisdiction"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading jurisdictions...</span>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCurrentJurisdictions().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      {searchQuery ? "No jurisdictions found matching your search." : "No jurisdictions found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  getCurrentJurisdictions().map((jurisdiction, index) => {
                    // Calculate the absolute index based on current page
                    const startIndex = (currentPage - 1) * itemsPerPage
                    const absoluteIndex = startIndex + index + 1

                    return (
                      <TableRow key={jurisdiction.id}>
                        <TableCell className="font-medium">{absoluteIndex}</TableCell>
                        <TableCell className="font-medium">{jurisdiction.jurisdiction}</TableCell>
                        <TableCell>
                          {new Date(jurisdiction.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-gray-300"
                              onClick={() => {
                                setEditingJurisdiction(jurisdiction)
                                setIsEditingDialogOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="hover:bg-gray-300" disabled={deletingId === jurisdiction.id}>
                                  {deletingId === jurisdiction.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="p-6">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the jurisdiction "{jurisdiction.jurisdiction}". This action
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteJurisdiction(jurisdiction.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {filteredJurisdictions.length > itemsPerPage && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredJurisdictions.length)} of{" "}
                  {filteredJurisdictions.length} jurisdictions
                  {searchQuery && ` matching "${searchQuery}"`}
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(currentPage - 1)
                        }}
                      />
                    </PaginationItem>

                    {Array.from(
                      { length: Math.ceil(filteredJurisdictions.length / itemsPerPage) },
                      (_, i) => i + 1,
                    )
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current page
                        return (
                          page === 1 ||
                          page === Math.ceil(filteredJurisdictions.length / itemsPerPage) ||
                          Math.abs(page - currentPage) <= 1
                        )
                      })
                      .map((page, index, array) => {
                        // If there's a gap, show ellipsis
                        if (index > 0 && page - array[index - 1] > 1) {
                          return (
                            <PaginationItem key={`ellipsis-${page}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )
                        }

                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={currentPage === page}
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(page)
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        aria-disabled={currentPage === Math.ceil(filteredJurisdictions.length / itemsPerPage)}
                        className={
                          currentPage === Math.ceil(filteredJurisdictions.length / itemsPerPage)
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(currentPage + 1)
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditingDialogOpen} onOpenChange={setIsEditingDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-6">
          <DialogHeader>
            <DialogTitle>Edit Jurisdiction</DialogTitle>
            <DialogDescription>Edit the name of the jurisdiction.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-jurisdiction" className="text-right">
                Jurisdiction
              </Label>
              <Input
                id="edit-jurisdiction"
                placeholder="Enter jurisdiction name"
                className="col-span-3"
                value={editingJurisdiction?.jurisdiction || ""}
                onChange={(e) =>
                  setEditingJurisdiction(
                    (prev) => (prev ? { ...prev, jurisdiction: e.target.value } : null),
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEditJurisdiction()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditingDialogOpen(false)
                setEditingJurisdiction(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditJurisdiction} disabled={isEditingJurisdiction}>
              {isEditingJurisdiction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditingJurisdiction ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
