import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import AppHeader from "./Header";

import { useModel } from "@/context/Model.context";

import PlanBillingContent from "@/pages/Accounts/mobilePages/PlanBillingContent";
import {AccountInformationMobile} from "@/pages/Accounts/mobilePages/AccountInformationMobile";
import { HelpCenterMobile } from "@/pages/Accounts/mobilePages/HelpCenterMobile";

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
              <AccountInformationMobile />
              </>
              
            ) : Modalvalue === 'PlansBilling' ? (
              <PlanBillingContent />
            ) : (<HelpCenterMobile/>)
          ) : (
            <Outlet />
          )}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
