"use client"

import {  useEffect, useState } from "react"
import {  Eye, EyeOff, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { useVerifyCodeHandler } from "../hooks/hook-verify-code" // import new hook
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { toast } from "sonner"
import { useForgotPassword } from "../hooks/hook-request" // Import your existing hook
import { getUserInfo } from "@/lib/utils"
import { useNewPassword } from "../hooks/hook-new-password"

interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
}

type PasswordStep = "form" | "verification" | "success"

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const [currentStep, setCurrentStep] = useState<PasswordStep>("form")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [resendTimer, setResendTimer] = useState(0)

    // Use your existing useForgotPassword hook
    const { mutateAsync: resetPassword, isPending: isResetting } = useForgotPassword()
    const { mutateAsync: updatePassword, isPending: Resetting } = useNewPassword()
    const [isSmallScreen, setIsSmallScreen] = useState(false);


    useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)"); // sm breakpoint in Tailwind is 640px; md is 768px, so max-width 767px is sm and below
    const handleResize = () => setIsSmallScreen(mediaQuery.matches);

    handleResize();
    mediaQuery.addEventListener("change", handleResize);

    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

    const handleSendVerificationCode = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long")
            return
        }

        if (isResetting) return
        localStorage.setItem('pass', newPassword)
        const usr = getUserInfo()

        console.log(usr)
        const email = usr.email;

        try {
            // Use the same structure as your ResetPasswordPage
            await resetPassword({
                email
            })

            // If successful, move to verification step
            setCurrentStep("verification")
            setResendTimer(27)

            // Start countdown timer
            const timer = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } catch (error) {
            // Error is already handled by the useForgotPassword hook's onError
        }
    }

    const handleVerificationCodeChange = (index: number, value: string) => {
        if (value.length > 1) return

        const newCode = [...verificationCode]
        newCode[index] = value
        setVerificationCode(newCode)

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`)
            nextInput?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            e.preventDefault()
            const newCode = [...verificationCode]

            if (newCode[index]) {
                // If current field has a value, clear it
                newCode[index] = ""
                setVerificationCode(newCode)
            } else if (index > 0) {
                // If current field is empty, move to previous field and clear it
                newCode[index - 1] = ""
                setVerificationCode(newCode)
                const prevInput = document.getElementById(`code-${index - 1}`)
                prevInput?.focus()
            }
        }
    }


    // Inside ChangePasswordModal...
    const { handleVerify, isPending: isVerifying } = useVerifyCodeHandler(() => {
        setCurrentStep("success")
    })

    const handleSavePassword = async () => {
        const code = verificationCode.join("")
        if (code.length !== 6) {
            toast.error("Please enter the complete 6-digit verification code")
            return
        }

        handleVerify(code)
         updatePassword({
        password: confirmPassword,
        code: code,
      })
    }

    const handlePasteCode = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').trim()

    if (paste.length === 6) {
        const chars = paste.split('')
        setVerificationCode(chars)
        setTimeout(() => {
            const lastInput = document.getElementById(`code-5`)
            lastInput?.focus()
        }, 0)
        toast.success("Code pasted successfully!")
    } else {
        toast.error("Please paste a valid 6-character code")
    }
}

    const handleResendCode = async () => {
        if (resendTimer > 0 || isResetting) return

        try {

            const usr = getUserInfo()

        console.log(usr)
        const email = usr.email;
            // Resend using the same hook
            await resetPassword({
               email
            })

            setResendTimer(27)
            const timer = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } catch (error) {
            // Error handled by hook
        }
    }

    const handleClose = () => {
        setCurrentStep("form")
        setNewPassword("")
        setConfirmPassword("")
        setVerificationCode(["", "", "", "", "", ""])
        setResendTimer(0)
        onClose()
    }

    const renderPasswordForm = () => (
        <div className="space-y-6 py-10 md:p-10">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-left text-gray-900">Change Your Password</h2>
                <p className="text-gray-600 text-left">Update your password with verification for added security.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                        <Input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </div>

            <Button
                onClick={handleSendVerificationCode}
                disabled={!newPassword || !confirmPassword || isResetting}
                className="w-full bg-gray-600 hover:bg-gray-400"
            >
                {isResetting ? "Sending..." : "Send Verification Code"}
            </Button>
        </div>
    )

    const renderVerificationForm = () => (
        <div className="space-y-6 py-10 md:p-10">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold  text-left text-gray-900">Change Your Password</h2>
                <p className="text-gray-600 text-left">Update your password with verification for added security.</p>
            </div>

            <div className="space-y-4">
                <h3 className="font-medium text-gray-900 text-left">Verification Code</h3>
                <p className="text-sm text-gray-600 text-left">
                    We've sent a 6-digit verification code to your email. Please enter it below.
                </p>

                <div className="flex  justify-center">
                    {verificationCode.map((digit, index) => (
                        <Input
                            key={index}
                            id={`code-${index}`}
                            type="text"
                            // inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePasteCode}
                            className="w-12 h-12 text-center text-lg font-medium"
                        />
                    ))}
                </div>

                <div className="text-center">
                    <Button
                        variant="link"
                        onClick={handleResendCode}
                        disabled={resendTimer > 0 || isResetting}
                        className="text-sm text-gray-500"
                    >
                        {isResetting
                            ? "Sending..."
                            : resendTimer > 0
                                ? `Resend in ${resendTimer}s`
                                : "Resend code"}
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                <Button
                    onClick={handleSavePassword}
                    disabled={isVerifying}
                    className="w-full bg-black hover:bg-gray-800 mt-4"
                >
                    {isVerifying ? "Saving..." : "Save Password"}
                </Button>

                <Button variant="outline" onClick={() => setCurrentStep("form")} className="w-full">
                    Back
                </Button>
            </div>
        </div>
    )

    const renderSuccessForm = () => (
        <div className="space-y-6 text-center py-10 md:p-10">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-left text-gray-900">Change Your Password</h2>
                <p className="text-gray-600 text-left">Update your password with verification for added security.</p>
            </div>

            <div className="py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Updated</h3>
                <p className="text-gray-600">
                    Your password has been changed successfully. You can now use your new credentials to log in.
                </p>
            </div>

            <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700">
                Close
            </Button>
        </div>
    )

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-md px-5 md:px-0"
        style={isSmallScreen ? { maxWidth: 'calc(100vw - 4rem)' } : {}}
      >
        <VisuallyHidden>
          <DialogTitle>Change Password</DialogTitle>
        </VisuallyHidden>
        <DialogClose asChild>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4">
            {/* Close icon here */}
          </Button>
        </DialogClose>

        {currentStep === "form" && renderPasswordForm()}
        {currentStep === "verification" && renderVerificationForm()}
        {currentStep === "success" && renderSuccessForm()}
      </DialogContent>
    </Dialog>

    )
}