"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, X } from "lucide-react"
import { ChangePasswordModal } from "./change.password.model"
import { useModel } from "@/context/Model.context"
import { useAuth } from "@/context/Auth.context"
import API from "@/lib/api"
// import { AccountSuccessModal } from "./"

interface AccountInformationProps {
  onSave?: () => void
  onCancel?: () => void
}

export function AccountInformation({ onSave, onCancel }: AccountInformationProps) {
   const { ModalOpen, setIsModalOpen } = useModel();
   const {user} = useAuth();
  const [fullName, setFullName] = useState(user?.fullName)
  const [email, setEmail] = useState(user?.email || "vectore@gmail.com")
  const [userType, setUserType] = useState("solo-lawyer")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  
  const handleSaveAccount = async () => {
    setIsLoading(true)
    try {
      const response = await API.post("/auth/user/update", {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          userType,
        }),
      })

      if (response.status >= 200 && response.status < 300) {
        setShowSuccessModal(true)
        onSave?.()
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

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
            <div className="w-full flex justify-end  md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600 md:hidden"
                    onClick={() => setIsModalOpen(!ModalOpen)}
                >
                    <X className="w-6 h-6" />
                </Button>
            </div>
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">My Account</h1>
        <p className="text-gray-600">Manage your personal information and preferences</p>
      </div>

      {/* Account Information Section */}
      <div className="space-y-6">
        <h2 className="text-lg md:text-xl font-medium text-gray-700">Account Information</h2>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-base font-medium text-gray-900">
            Full Name
          </Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full" />
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="text-base font-medium text-gray-900">
              Email Address
            </Label>
            
          </div>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-50"
            disabled
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label className="text-base font-medium text-gray-900">Password</Label>
          <Button variant="outline" className="w-fit" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </Button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="space-y-6">
        <h2 className="text-lg md:text-xl font-medium text-gray-700">Preferences</h2>

        {/* User Type */}
        <div className="space-y-2">
          <Label className="text-base font-medium text-gray-900">User Type</Label>
          <Select value={userType} onValueChange={setUserType}>
            <SelectTrigger className="w-full">
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
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t justify-end">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          onClick={handleSaveAccount}
          disabled={isLoading}
          className="w-full sm:w-auto bg-gray-600 hover:bg-gray-400"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      {/* <AccountSuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} /> */}
    </div>
  )
}
