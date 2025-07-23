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
import { Search, Plus, Trash2, Loader2, Pencil, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import API from "@/lib/api"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface Jurisdiction {
  id: number
  jurisdiction: string
  createdAt: string
}

const usStatesWithCodes = [
  { name: "Federal", code: "FEDERAL" },
  { name: "Alabama", code: "AL" },
  { name: "Alaska", code: "AK" },
  { name: "Arizona", code: "AZ" },
  { name: "Arkansas", code: "AR" },
  { name: "California", code: "CA" },
  { name: "Colorado", code: "CO" },
  { name: "Connecticut", code: "CT" },
  { name: "Delaware", code: "DE" },
  { name: "Florida", code: "FL" },
  { name: "Georgia", code: "GA" },
  { name: "Hawaii", code: "HI" },
  { name: "Idaho", code: "ID" },
  { name: "Illinois", code: "IL" },
  { name: "Indiana", code: "IN" },
  { name: "Iowa", code: "IA" },
  { name: "Kansas", code: "KS" },
  { name: "Kentucky", code: "KY" },
  { name: "Louisiana", code: "LA" },
  { name: "Maine", code: "ME" },
  { name: "Maryland", code: "MD" },
  { name: "Massachusetts", code: "MA" },
  { name: "Michigan", code: "MI" },
  { name: "Minnesota", code: "MN" },
  { name: "Mississippi", code: "MS" },
  { name: "Missouri", code: "MO" },
  { name: "Montana", code: "MT" },
  { name: "Nebraska", code: "NE" },
  { name: "Nevada", code: "NV" },
  { name: "New Hampshire", code: "NH" },
  { name: "New Jersey", code: "NJ" },
  { name: "New Mexico", code: "NM" },
  { name: "New York", code: "NY" },
  { name: "North Carolina", code: "NC" },
  { name: "North Dakota", code: "ND" },
  { name: "Ohio", code: "OH" },
  { name: "Oklahoma", code: "OK" },
  { name: "Oregon", code: "OR" },
  { name: "Pennsylvania", code: "PA" },
  { name: "Rhode Island", code: "RI" },
  { name: "South Carolina", code: "SC" },
  { name: "South Dakota", code: "SD" },
  { name: "Tennessee", code: "TN" },
  { name: "Texas", code: "TX" },
  { name: "Utah", code: "UT" },
  { name: "Vermont", code: "VT" },
  { name: "Virginia", code: "VA" },
  { name: "Washington", code: "WA" },
  { name: "West Virginia", code: "WV" },
  { name: "Wisconsin", code: "WI" },
  { name: "Wyoming", code: "WY" },
]


// Helper functions to convert between state names and codes
const getStateCodeByName = (stateName: string): string => {
  const state = usStatesWithCodes.find((s) => s.name === stateName)
  return state ? state.code : stateName
}

const getStateNameByCode = (stateCode: string): string => {
  const state = usStatesWithCodes.find((s) => s.code === stateCode)
  return state ? state.name : stateCode
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
  const [selectedState, setSelectedState] = useState<string>("") // State for selected US state
  const [editingJurisdiction, setEditingJurisdiction] = useState<Jurisdiction | null>(null)
  const [editingSelectedState, setEditingSelectedState] = useState<string>("") // For editing dialog
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const [isEditComboboxOpen, setIsEditComboboxOpen] = useState(false)

  // Load jurisdictions on component mount
  useEffect(() => {
    const loadJurisdictions = async () => {
      setIsLoading(true)
      try {
        // Simulate API call
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
      const filtered = jurisdictions.filter((jurisdiction) => {
        // Search by both the stored value and the full state name
        const fullStateName = getStateNameByCode(jurisdiction.jurisdiction)
        return (
          jurisdiction.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fullStateName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
      setFilteredJurisdictions(filtered)
    }
  }, [searchQuery, jurisdictions])

  // Add new jurisdiction
  const handleAddJurisdiction = async () => {
    if (!selectedState.trim()) {
      toast.error("Please select a jurisdiction")
      return
    }

    const stateCode = getStateCodeByName(selectedState)

    // Check if jurisdiction already exists (by code)
    const exists = jurisdictions.some((j) => j.jurisdiction.toLowerCase() === stateCode.toLowerCase())
    if (exists) {
      toast.error("Jurisdiction already exists")
      return
    }

    setIsAddingJurisdiction(true)
    try {
      // Send state code to API
      const response = await API.post("/jurisdictions", {
        jurisdiction: stateCode,
      })
      setJurisdictions((prev) => [response.data, ...prev])
      setSelectedState("") // Reset selected state
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
    if (!editingJurisdiction || !editingSelectedState.trim()) {
      toast.error("Please select a jurisdiction")
      return
    }

    const stateCode = getStateCodeByName(editingSelectedState)

    // Check if jurisdiction already exists (by code)
    const exists = jurisdictions.some(
      (j) => j.id !== editingJurisdiction.id && j.jurisdiction.toLowerCase() === stateCode.toLowerCase(),
    )
    if (exists) {
      toast.error("Jurisdiction already exists")
      return
    }

    setIsEditingJurisdiction(true)
    try {
      // Send state code to API
      const response = await API.patch(`/jurisdictions/${editingJurisdiction.id}`, {
        jurisdiction: stateCode,
      })
      setJurisdictions((prev) => prev.map((j) => (j.id === editingJurisdiction.id ? response.data : j)))
      setIsEditingDialogOpen(false)
      setEditingJurisdiction(null)
      setEditingSelectedState("")
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
    try {
      // Simulate API call
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12">
              <Plus className="h-4 w-4 mr-2 " />
              Add Jurisdiction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] p-6">
            <DialogHeader>
              <DialogTitle>Add New Jurisdiction</DialogTitle>
              <DialogDescription>Select the US state you want to add as a jurisdiction.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="jurisdiction" className="text-right">
                  Jurisdiction
                </Label>
                <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isComboboxOpen}
                      className="col-span-3 justify-between bg-transparent"
                    >
                      {selectedState
                        ? usStatesWithCodes.find((state) => state.name === selectedState)?.name
                        : "Select state..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search state..." />
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                          {usStatesWithCodes.map((state) => (
                            <CommandItem
                              key={state.code}
                              value={state.name}
                              onSelect={(currentValue) => {
                                setSelectedState(currentValue === selectedState ? "" : currentValue)
                                setIsComboboxOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedState === state.name ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {state.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setSelectedState("")
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
                    // Display full state name in table
                    const displayName = getStateNameByCode(jurisdiction.jurisdiction)
                    return (
                      <TableRow key={jurisdiction.id}>
                        <TableCell className="font-medium">{absoluteIndex}</TableCell>
                        <TableCell className="font-medium">{displayName}</TableCell>
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
                              className="hover:bg-gray-300 bg-transparent"
                              onClick={() => {
                                setEditingJurisdiction(jurisdiction)
                                setEditingSelectedState(getStateNameByCode(jurisdiction.jurisdiction))
                                setIsEditingDialogOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="hover:bg-gray-300 bg-transparent"
                                  disabled={deletingId === jurisdiction.id}
                                >
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
                                    This will permanently delete the jurisdiction "{displayName}". This action cannot be
                                    undone.
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredJurisdictions.length)} of {filteredJurisdictions.length}{" "}
                  jurisdictions
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
                    {Array.from({ length: Math.ceil(filteredJurisdictions.length / itemsPerPage) }, (_, i) => i + 1)
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
            <DialogDescription>Select the US state for this jurisdiction.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-jurisdiction" className="text-right">
                Jurisdiction
              </Label>
              <Popover open={isEditComboboxOpen} onOpenChange={setIsEditComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isEditComboboxOpen}
                    className="col-span-3 justify-between bg-transparent"
                  >
                    {editingSelectedState
                      ? usStatesWithCodes.find((state) => state.name === editingSelectedState)?.name
                      : "Select state..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search state..." />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>No state found.</CommandEmpty>
                      <CommandGroup>
                        {usStatesWithCodes.map((state) => (
                          <CommandItem
                            key={state.code}
                            value={state.name}
                            onSelect={(currentValue) => {
                              setEditingSelectedState(currentValue === editingSelectedState ? "" : currentValue)
                              setIsEditComboboxOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                editingSelectedState === state.name ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {state.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditingDialogOpen(false)
                setEditingJurisdiction(null)
                setEditingSelectedState("")
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
