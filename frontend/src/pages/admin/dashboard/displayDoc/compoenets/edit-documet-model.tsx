"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import API from "@/lib/api"

interface Contract {
  id: string
  type: string
  jurisdiction: string
  source: string
  createdAt: string
}

interface Regulation {
  id: string
  createdAt: string
  updatedAt: string
  jurisdiction: string
  citation: string
  title: string
  section: string
  subject_area: string
}

interface Case {
  id: string
  createdAt: string
  updatedAt: string
  type: string
  jurisdiction: string
  title: string
  fileName: string
  court: string
  citation: string
  holding_summary: string
  decision_date: string
}

type DocumentType = "contracts" | "regulations" | "cases"

interface EditDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  documentType: DocumentType
  document: Contract | Regulation | Case | null
  onUpdate: () => void
}

export function EditDocumentModal({ isOpen, onClose, documentType, document, onUpdate }: EditDocumentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Contract | Regulation | Case>>({})

  // Update form data when document changes or modal opens
  useEffect(() => {
    if (document && isOpen) {
      setFormData({ ...document })
    }
  }, [document, isOpen])

  // Reset form data when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({})
    }
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = `/documents/${documentType}/${document?.id}`
      console.log(`Updating document at ${url} with data:`, formData)

      const response = await API.put(url, {
        ...formData,
      })

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to update ${documentType}`)
      }

      toast.success("Document updated successfully")
      onUpdate()
      onClose()
    } catch (error) {
      console.error("Error updating document:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update document")
    } finally {
      setIsLoading(false)
    }
  }

  if (!document) return null

  const getDocumentTypeName = () => {
    switch (documentType) {
      case "contracts":
        return "Contract"
      case "regulations":
        return "Regulation"
      case "cases":
        return "Case"
      default:
        return "Document"
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle>Edit {getDocumentTypeName()}</DialogTitle>
          <DialogDescription>
            Update the fields below to modify this {getDocumentTypeName().toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {documentType === "contracts" ? (
              // Contract fields
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Input
                    id="type"
                    name="type"
                    value={(formData as Contract).type || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                    disabled
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="jurisdiction" className="text-right">
                    Jurisdiction
                  </Label>
                  <Input
                    id="jurisdiction"
                    name="jurisdiction"
                    value={(formData as Contract).jurisdiction || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="source" className="text-right">
                    Source
                  </Label>
                  <Input
                    id="source"
                    name="source"
                    value={(formData as Contract).source || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              </>
            ) : documentType === "regulations" ? (
              // Regulation fields
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={(formData as Regulation).title || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="jurisdiction" className="text-right">
                    Jurisdiction
                  </Label>
                  <Input
                    id="jurisdiction"
                    name="jurisdiction"
                    value={(formData as Regulation).jurisdiction || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="citation" className="text-right">
                    Citation
                  </Label>
                  <Input
                    id="citation"
                    name="citation"
                    value={(formData as Regulation).citation || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="section" className="text-right">
                    Section
                  </Label>
                  <Input
                    id="section"
                    name="section"
                    value={(formData as Regulation).section || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject_area" className="text-right">
                    Subject Area
                  </Label>
                  <Input
                    id="subject_area"
                    name="subject_area"
                    value={(formData as Regulation).subject_area || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              </>
            ) : (
              // Case fields
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={(formData as Case).title || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Input
                    id="type"
                    name="type"
                    value={(formData as Case).type || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="jurisdiction" className="text-right">
                    Jurisdiction
                  </Label>
                  <Input
                    id="jurisdiction"
                    name="jurisdiction"
                    value={(formData as Case).jurisdiction || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="court" className="text-right">
                    Court
                  </Label>
                  <Input
                    id="court"
                    name="court"
                    value={(formData as Case).court || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="citation" className="text-right">
                    Citation
                  </Label>
                  <Input
                    id="citation"
                    name="citation"
                    value={(formData as Case).citation || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="holding_summary" className="text-right">
                    Holding Summary
                  </Label>
                  <Input
                    id="holding_summary"
                    name="holding_summary"
                    value={(formData as Case).holding_summary || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="decision_date" className="text-right">
                    Decision Date
                  </Label>
                  <Input
                    id="decision_date"
                    name="decision_date"
                    type="date"
                    value={(formData as Case).decision_date ? (formData as Case).decision_date.split('T')[0] : ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}