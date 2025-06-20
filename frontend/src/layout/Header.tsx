import { Logo } from "@/components/Logo";
import ProfileDropdown from "@/components/ProfileDropdown";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/context/Auth.context";
import { AlignLeft, PlusIcon, ZapIcon } from "lucide-react";

export default function AppHeader() {
  const { toggleSidebar } = useSidebar()
  const { user } = useAuth()

  return (
    <div className="md:flex bg-background md:sticky top-0 items-center md:justify-end px-4 h-22 z-20 gap-4 md:border-b">
      {user && user.role !== "admin" && (
        <div className="md:flex hidden items-center gap-4">
          <p className="text-sm">Credit plan: 100/90</p>

          <Button className="hover:bg-transparent bg-orange py-2 h-[unset] hover:text-orange hover:shadow-none">
            <ZapIcon />
            Upgrade Plan
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
        <Button variant="outline" className="!px-4 gap-2 !py-3 h-12">
          <PlusIcon size={18} />
          <span>New Chat</span>
        </Button>
      </div>
    </div>
  );
}