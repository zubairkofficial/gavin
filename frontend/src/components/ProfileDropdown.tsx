import { User, CreditCard, LogOut, ChevronDown, BookOpenText } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/context/Auth.context"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { PlansBillingModal } from "../../src/pages/Accounts/desktopPages/plans-biling-model"

export default function ProfileDropdown() {
  const { logout } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState("plans-billing") // Track which section to show
  const navigate = useNavigate()

  // Define navigation items with their IDs
  const navigationItems = [
    { id: "account", label: "Account", icon: User },
    { id: "plans-billing", label: "Plans & Billing", icon: CreditCard },
    { id: "help-center", label: "Help Center", icon: BookOpenText },
  ]

  // Handle dropdown item clicks
  const handleNavItemClick = (sectionId: string) => {
    setSelectedSection(sectionId) // Set which section to show
    setIsModalOpen(true) // Open the modal
  }

  return (
    <>
      <div className="flex justify-center p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <Button variant="outline" size="icon" className="rounded-sm border-1 border-gray-800  ">
                <Avatar>
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
              </Button>
              <div>
                <ChevronDown />
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-0 rounded-2xl mt-2 mr-16">
            <div className="px-4 pt-6 pb-3 flex flex-col items-center text-center">
              <h2 className="text-xl font-semibold mb-1">Alex Smith</h2>
              <p className="text-gray-500 mb-4">alexsmith@gmail.com</p>

              <div className="w-full bg-transparent border rounded-xl p-4 mb-4">
                <h3 className="font-semibold text-left">Credits Used</h3>
                <div className="flex justify-between mb-1 items-center">
                  <Progress value={60} className="h-[5px] w-[80%]" />
                  <span className="text-xs">0/250</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500 text-start">You have 5 daily credits to use first</span>
                </div>
              </div>

              <div className="w-full">
                {/* Generate dropdown items dynamically */}
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem 
                      key={item.id}
                      className="py-1 cursor-pointer px-0"
                      onClick={() => handleNavItemClick(item.id)}
                    >
                      <Icon className="mr-2 !h-[18px] !w-[18px]" />
                      <span className="text-base">{item.label}</span>
                    </DropdownMenuItem>
                  )
                })}

                <DropdownMenuItem 
                  className="pt-1 cursor-pointer px-0" 
                  onClick={() => {
                    logout()
                    navigate(0)
                  }}
                >
                  <LogOut className="mr-2 !h-[18px] !w-[18px]" />
                  <span className="text-base">Sign out</span>
                </DropdownMenuItem>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Pass the selected section to the modal */}
      <PlansBillingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        initialSection={selectedSection}
      />
    </>
  )
}