import { User, CreditCard, LogOut, ChevronDown, BookOpenText } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/context/Auth.context"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { PlansBillingModal } from "./plans-biling-model"

export default function ProfileDropdown() {
  const { logout } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()
  return (
    <>
    <div className="flex justify-center p-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <Button variant="outline" size="icon" className="rounded-full">
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
              <DropdownMenuItem className="py-1 cursor-pointer px-0">
                <User className="mr-2 !h-[18px] !w-[1" />
                <span className="text-base">Account</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="py-1 cursor-pointer px-0" onClick={() => setIsModalOpen(true)}>
                <CreditCard className="mr-2 !h-[18px] !w-[1" />
                <button   className="text-base">Plans & Billing</button>
              </DropdownMenuItem>

              <DropdownMenuItem className="py-1 cursor-pointer px-0">
                <BookOpenText className="mr-2 !h-[18px] !w-[1" />
                <span className="text-base">Help Center</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="pt-1 cursor-pointer px-0" onClick={() => {
                logout()
                navigate(0)
              }}>
                <LogOut className="mr-2 !h-[18px] !w-[1" />
                <span className="text-base">Sign out</span>
              </DropdownMenuItem>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
    </div>
    <PlansBillingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
