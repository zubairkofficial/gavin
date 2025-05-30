"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { toast } from "sonner"

interface ChangeEmailModalProps {
  isOpen: boolean
  onClose: () => void
  currentEmail: string
}

export function ChangeEmailModal({ isOpen, onClose, currentEmail }: ChangeEmailModalProps) {
  const [newEmail, setNewEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  

  const handleChangeEmail = async () => {
    if (!newEmail || !password) {
      toast.error("Please fill in all fields")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newEmail,
          password,
        }),
      })

      if (response.ok) {
        toast.error("Please check both your old and new email addresses for verification instructions")
        onClose()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to change email")
      }
    } catch (error) {
      toast.error( "Failed to change email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setNewEmail("")
    setPassword("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}  >
      <DialogContent className="max-w-md p-10 " >
        <VisuallyHidden>
          <DialogTitle>Change Email Address</DialogTitle>
        </VisuallyHidden>
        <DialogClose asChild>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4">
          </Button>
        </DialogClose>

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Change Email Address</h2>
            <p className="text-gray-600">
              Update your email address. You'll need to verify both your old and new email addresses.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentEmail">Current Email</Label>
              <Input id="currentEmail" type="email" value={currentEmail} disabled className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Current Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleChangeEmail}
              disabled={!newEmail || !password || isLoading}
              className="w-full bg-gray-600 hover:bg-gray-400"
            >
              {isLoading ? "Processing..." : "Change Email"}
            </Button>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
