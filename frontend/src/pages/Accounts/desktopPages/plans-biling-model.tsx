"use client"

import { useEffect, useState } from "react"
import { User, CreditCard, HelpCircle, LogOut, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useAuth } from "@/context/Auth.context"
import { useNavigate } from "react-router-dom"
import { AccountInformation } from "./account-information"
import { HelpCenter } from "./help-center"


interface PlansBillingModalProps {
  isOpen: boolean
  onClose: () => void
  initialSection?: string // Add this new prop
}

export function PlansBillingModal({ isOpen, onClose, initialSection = "plans-billing" }: PlansBillingModalProps) {
  // Use initialSection as the default value instead of hardcoded "plans-billing"
  const [activeSection, setActiveSection] = useState(initialSection)

  const { logout } = useAuth()
  const navigate = useNavigate()


  useEffect(() => {
    if (isOpen && initialSection) {
      setActiveSection(initialSection)
    }
  }, [isOpen, initialSection])
  const navigationItems = [
    { id: "account", label: "Account", icon: User },
    { id: "plans-billing", label: "Plans & Billing", icon: CreditCard },
    { id: "help-center", label: "Help Center", icon: HelpCircle },
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
          <div className="px-4 md:px-6 w-full font-inter">
            <h1 className="text-xl md:text-3xl font-semibold text-gray-900 mb-4 md:mb-6 text-center">
              Plans & Billing
            </h1>

            <div className="space-y-4 md:space-y-3">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                {/* Free Plan - $0 */}
                <Card className="relative w-full h-fit">
                  <CardHeader className="px-4 md:px-6">
                    <CardTitle className="text-base md:text-lg font-medium">Free</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-bold">$0</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">per user/month, billed annually</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs md:text-sm font-medium text-gray-900 mb-3">For Small Teams</p>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                        <span className="text-sm text-gray-700">Real-time contact syncing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                        <span className="text-sm text-gray-700">Automatic data enrichment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                        <span className="text-sm text-gray-700">Up to 3 seats</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                        <span className="text-sm text-gray-700">Basic support</span>
                      </div>
                    </div>

                    <div className="pt-2 md:pt-4">
                      <Input placeholder="5 daily credits" className="text-gray-500 text-sm" disabled />
                    </div>
                  </CardContent>
                </Card>

                {/* Paid Plan - $20 */}
                <Card className="relative w-full">
                  <CardHeader className="px-4 md:px-6">
                    <CardTitle className="text-base md:text-lg font-medium">Pro</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-bold">$20</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">per user/month, billed annually</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs md:text-sm font-medium text-gray-900 mb-3">For Growing Teams</p>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                        <span className="text-sm text-gray-700">Real-time contact syncing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                        <span className="text-sm text-gray-700">Automatic data enrichment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                        <span className="text-sm text-gray-700">Unlimited seats</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                        <span className="text-sm text-gray-700">Priority support</span>
                      </div>
                    </div>

                    <div className="space-y-3 md:space-y-4 pt-3">
                      <Select defaultValue="100">
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select credits" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100 credits / month</SelectItem>
                          <SelectItem value="200">200 credits / month</SelectItem>
                          <SelectItem value="300">300 credits / month</SelectItem>
                          <SelectItem value="400">400 credits / month</SelectItem>
                          <SelectItem value="600">600 credits / month</SelectItem>
                          <SelectItem value="1000">1000 credits / month</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm">Upgrade</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
