"use client"

import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, X } from "lucide-react"
import { ChangePasswordModal } from "./change.password.model"
import { useModel } from "@/context/Model.context"
import { useAuth } from "@/context/Auth.context"
import { useUpdateUser } from "@/hooks/useUpdateUser"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
// import { AccountSuccessModal } from "./"

interface AccountInformationProps {
  onSave?: () => void
  onCancel?: () => void
}

export function AccountInformation({ onSave, onCancel }: AccountInformationProps) {
  const { ModalOpen, setIsModalOpen } = useModel();
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  type FormData = {
    fullName: string;
    email: string;
    userType: string;
  }

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      userType: "solo-lawyer"
    }
  });

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedData = JSON.parse(userData);
      setValue("fullName", parsedData.fullName);
      setValue("email", parsedData.email);
      setValue("userType", parsedData.userType || "solo-lawyer");
    }
  }, [])

  const updateUserMutation = useUpdateUser();

  const onsubmit = async (formData: FormData) => {
    try {
      setIsLoading(true);
      const data = await updateUserMutation.mutateAsync({
        fullName: formData.fullName,
        email: formData.email,
        userType: formData.userType,
      });
      setShowSuccessModal(true);
      toast.success("Account updated successfully!");
      onSave?.();
      console.log("Account updated successfully:", data);
      localStorage.setItem("userData", JSON.stringify(data.data));
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save account:", error);
      toast.error("Failed to update account");
    } finally {
      setIsLoading(false);
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
        <form onSubmit={handleSubmit(onsubmit)} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-base font-medium text-gray-900">
              Full Name
            </Label>
            <Input 
              id="fullName" 
              {...register("fullName", { required: "Full name is required" })} 
              className="w-full" 
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>
       
          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-medium text-gray-900">
              Email Address
            </Label>
            <Input 
              id="email" 
              {...register("email")} 
              className="w-full bg-gray-50" 
              disabled 
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-base font-medium text-gray-900">Password</Label>
            <Button 
              type="button" 
              variant="outline" 
              className="w-fit" 
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </Button>
          </div>

          {/* Preferences Section */}
          <div className="space-y-6">
            <h2 className="text-lg md:text-xl font-medium text-gray-700">Preferences</h2>

            {/* User Type */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-gray-900">User Type</Label>
              <Select 
                onValueChange={(value) => {
                  setValue("userType", value);
                }}
              >
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
        </form>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t justify-end">
        <Button 
          type="button"
          variant="outline" 
          onClick={onCancel} 
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="account-info-form"
          disabled={isLoading}
          className="w-full sm:w-auto bg-gray-600 hover:bg-gray-400"
          onClick={handleSubmit(onsubmit)}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      {/* <AccountSuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} /> */}
    </div>
  )
}
