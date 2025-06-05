"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, X } from "lucide-react"
import { ChangePasswordModal } from "../desktopPages/change.password.model"
import { useModel } from "@/context/Model.context"

interface AccountInformationMobileProps {
  onSave?: () => void
  onCancel?: () => void
}

export function AccountInformationMobile({ onSave, onCancel }: AccountInformationMobileProps) {
  const [fullName, setFullName] = useState("Victor Vance")
  const [email, setEmail] = useState("victor@example.com")
  const [userType, setUserType] = useState("solo-lawyer")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { ModalOpen, setIsModalOpen } = useModel()

  const handleSaveAccount = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          userType,
        }),
      })

      if (response.ok) {
        onSave?.()
        // Show success toast or notification
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      console.error("Failed to save account:", error)
      // Show error toast or notification
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    setIsModalOpen(false)
  }

  return (
    <div className="w-full max-w-[600px] mx-auto px-4 pb-4  font-inter md:hidden">
      {/* Close Button */}
      <div className="w-full flex justify-end mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-600"
          onClick={() => setIsModalOpen(!ModalOpen)}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900  mb-2 font-inter">
          My Account
        </h1>
        <p className="text-sm text-gray-600">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="w-full border-1 border-gray-300 my-5"></div>

      {/* Content Area */}
      <div className="space-y-6">
        {/* Account Information Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-700">Account Information</h2>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-900">
              Full Name
            </Label>
            <Input 
              id="fullName" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              className="w-full text-sm" 
            />
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                Email Address
              </Label>
              
            </div>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 text-sm"
              disabled
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Password</Label>
            <Button 
              variant="outline" 
              className=" text-sm" 
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </Button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-700">Preferences</h2>

          {/* User Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">User Type</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger className="w-full text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solo-lawyer">Solo Lawyer</SelectItem>
                <SelectItem value="law-firm">Law Firm</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-6 border-t">
          <Button
            onClick={handleSaveAccount}
            disabled={isLoading}
            className="w-full bg-gray-600 hover:bg-gray-400 text-sm"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            className="w-full text-sm"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
      
    </div>
  )
}