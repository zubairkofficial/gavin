import { SidebarHeader } from "@/components/ui/sidebar";
import { Logo } from "@/components/Logo";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpenText, ChevronLeft, ChevronRight, CreditCard, LogOutIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/Auth.context";

export function AppSidebarHeader() {
  const [isInnerSideBarOpen, setIsInnerSideBarOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <SidebarHeader className="px-3 pt-6 border-b md:border-none">
      <div className=" hidden md:block">
        <Logo />
      </div>
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">Alex Smith</h2>
            <p className="text-gray-500 mb-4">alexsmith@gmail.com</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsInnerSideBarOpen(!isInnerSideBarOpen)}>
            <ChevronRight className="size-[24px]" />
          </Button>
          {isInnerSideBarOpen && (
            <div className="absolute top-0 right-0 w-full h-full bg-background z-10">
              <div className="flex justify-between px-2 py-4">
                <div>
                  <Button variant="ghost" size="icon" onClick={() => setIsInnerSideBarOpen(!isInnerSideBarOpen)}>
                    <ChevronLeft className="size-[24px]" />
                  </Button>
                </div>
                <div className="w-full h-full bg-background">
                  <h2 className="text-xl font-semibold mb-1">Alex Smith</h2>
                  <p className="text-gray-500 mb-4">alexsmith@gmail.com</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 px-4">
                <div className="py-1 flex items-center cursor-pointer px-0">
                  <UserIcon className="mr-2 !h-[18px] !w-[1" />
                  <span className="text-base">Account</span>
                </div>

                <div className="py-1 flex items-center cursor-pointer px-0">
                  <CreditCard className="mr-2 !h-[18px] !w-[1" />
                  <span className="text-base">Plans & Billing</span>
                </div>

                <div className="py-1 flex items-center cursor-pointer px-0">
                  <BookOpenText className="mr-2 !h-[18px] !w-[1" />
                  <span className="text-base">Help Center</span>
                </div>

                <div className="pt-1 flex items-center cursor-pointer px-0" onClick={() => {
                  logout()
                  navigate(0)
                }}>
                  <LogOutIcon className="mr-2 !h-[18px] !w-[1" />
                  <span className="text-base">Sign out</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="w-full bg-transparent border rounded-md p-4 mb-4">
          <h3 className="font-semibold text-left">Credits Used</h3>
          <div className="flex justify-between mb-1 items-center">
            <Progress value={60} className="h-[5px] w-[80%]" />
            <span className="text-xs">0/250</span>

          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500 text-start">You have 5 daily credits to use first</span>
          </div>
        </div>
      </div>
    </SidebarHeader>
  );
}
