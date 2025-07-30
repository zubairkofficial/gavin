import { Logo } from "@/components/Logo";
import ProfileDropdown from "@/components/ProfileDropdown";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/context/Auth.context";
import { AlignLeft, CreditCard, Loader2, PlusIcon, ZapIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCreateConversationMutation } from "./hooks/hook";
import { useModel } from "@/context/Model.context";
import { useState } from "react";
import { useGetCreditInfo } from "./hooks/useGetCreditInfo";

export default function AppHeader() {
  const { toggleSidebar } = useSidebar()
  const { user } = useAuth()
  const { setIsModalOpen ,setIsModalvalue  , ModalOpen } = useModel();
  const [isInnerSideBarOpen, setIsInnerSideBarOpen] = useState(false)
  const createConversationMutation = useCreateConversationMutation()
  const navigate = useNavigate()
  const { data: creditInfo, isLoading: isCreditInfoLoading } = useGetCreditInfo()


  const handleNewChat = async () => {
    try {
      navigate('/')
    } catch (error) {
      console.error("Failed to create new chat:", error)
    }
  }

  return (
    <div className="md:flex bg-background md:sticky top-0 items-center md:justify-end px-4 h-22 z-20 gap-4 md:border-b">
      {user && user.role !== "admin" && (
        <div className="md:flex hidden items-center gap-4">
          <p className="text-sm">
            {isCreditInfoLoading 
              ? <>
              <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              </>
              : `Credit plan: ${creditInfo?.totalCredits || '0'}/${(creditInfo?.credits)?.toString().slice(0, 6) || '0'}`
            }
          </p>
          <Button 
            className="hover:bg-transparent bg-orange py-2 h-[unset] hover:text-orange hover:shadow-none border-1 hover:border-gray-200" 
            onClick={() => {
              setIsModalOpen(!ModalOpen); 
              setIsInnerSideBarOpen(!isInnerSideBarOpen);   
              setIsModalvalue('PlansBilling')
            }}
          >
            <ZapIcon />
            upgrade Plan
          </Button>
        </div>
      )}
      <ProfileDropdown />
      <div className="py-4 md:hidden flex items-center justify-between gap-4">
        <div className="w-full flex items-center gap-2">
          <Button className="justify-start" variant="ghost" size="icon" onClick={toggleSidebar}>
            <AlignLeft className="size-[24px]" />
          </Button>
          <Logo className="max-w-16" />
        </div>
        <Button
          variant="outline" className="!px-4 gap-2 !py-3 h-12"
          onClick={handleNewChat}
          disabled={createConversationMutation.isPending}
        >
          <PlusIcon size={18} />
          <span>{createConversationMutation.isPending ? "Creating..." : "New Chat"}</span>
        </Button>
      </div>
    </div>
  );
}