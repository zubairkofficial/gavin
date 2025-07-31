"use client"

import { useEffect, useState } from "react"
import { User, CreditCard, HelpCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { cn, getUserInfo } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useAuth } from "@/context/Auth.context"
import { useNavigate } from "react-router-dom"
import { AccountInformation } from "./account-information"
import { HelpCenter } from "./help-center"
import PlanBillingContent from "./PlanBillingContent"


interface PlansBillingModalProps {
  isOpen: boolean
  onClose: () => void
  initialSection?: string // Add this new prop
}

export function PlansBillingModal({ isOpen, onClose, initialSection = "plans-billing" }: PlansBillingModalProps) {
  // Use initialSection as the default value instead of hardcoded "plans-billing"
  const [activeSection, setActiveSection] = useState(initialSection)
  const user = getUserInfo();
  const { logout } = useAuth()
  const navigate = useNavigate()


  useEffect(() => {
    if (isOpen && initialSection) {
      setActiveSection(initialSection)
    }
  }, [isOpen, initialSection])
  const navigationItems = [
    { id: "account", label: "Account", icon: User },
   ...(user?.role === 'admin' ? [
   
  ] : [ { id: "plans-billing", label: "Plans & Billing", icon: CreditCard }]),
   ...(user?.role === 'admin' ? [
   
  ] : [ { id: "help-center", label: "Help Center", icon: HelpCircle}]),

  ]

  const handleLogout = () => {
    logout()
    navigate('/')
    navigate(0)
  }

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <div className="h-full overflow-y-auto">
            <AccountInformation
              onSave={() => console.log("Account saved")}
              onCancel={() => console.log("Account cancelled")}
            />
          </div>
        )
      case "help-center":
        return (
          <div className="h-full overflow-y-auto">
            <HelpCenter />
          </div>
        )
      default:
        return (
          <div className="h-full overflow-y-auto">
            <PlanBillingContent />
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[75vw] !w-[1250px] h-[75vh] p-0 gap-0 sm:!max-w-[95vw] font-inter border-1 border-gray-400 hidden md:block">
        <VisuallyHidden>
          <DialogTitle>Plans and Billing</DialogTitle>
        </VisuallyHidden>
        <div className="flex h-full">
          {/* Sidebar - hidden on mobile, 20% width on desktop */}
          <div className="hidden md:w-[20%] md:flex md:flex-col bg-gray-50 border-1 rounded-md border-gray-200">
            {/* User Profile */}
            <div className="p-6 mb-2">
              <div className="flex items-center gap-3">
                {/* <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div> */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">Alex Smith</p>
                  <p className="text-xs text-gray-500 truncate">alexsmith@gmail.com</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                      activeSection === item.id ? "text-white bg-gray-900" : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                )
              })}

              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </nav>
          </div>

          {/* Main Content - full width on mobile, 80% on desktop */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header with close button - only show on mobile */}
            <div className="flex items-center justify-end p-4 border-b border-gray-200 md:hidden">
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">

                </Button>
              </DialogClose>
            </div>

            {/* Close button for desktop */}
            <div className="hidden md:flex items-center justify-end px-4">
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">

                </Button>
              </DialogClose>
            </div>

            {/* Content Area - This is where the scrolling happens */}
            <div className="flex-1 overflow-y-auto min-h-0">{renderContent()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
