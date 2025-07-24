import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import AppHeader from "./Header";

import { useModel } from "@/context/Model.context";

import PlanBillingContent from "@/pages/Accounts/mobilePages/PlanBillingContent";
// import { HelpCenterMobile } from "@/pages/Accounts/mobilePages/HelpCenterMobile";
import { HelpCenter } from "@/pages/Accounts/desktopPages/help-center";
import { AccountInformation } from "@/pages/Accounts/desktopPages/account-information";

export default function AppLayout() {
  const { ModalOpen, Modalvalue } = useModel();
  

  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-none">
          <AppHeader />
          {ModalOpen ? (
            Modalvalue === 'Account' ? (
              <>
              <AccountInformation />
              </>
              
            ) : Modalvalue === 'PlansBilling' ? (
              <PlanBillingContent />
            ) : (<HelpCenter/>)
          ) : (
            <Outlet />
          )}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
