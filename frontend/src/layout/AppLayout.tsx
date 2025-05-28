import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import AppHeader from "./Header";
import { useModel } from "@/context/Model.context";

import PlanBillingContent from "@/components/PlanBillingContent";

export default function AppLayout() {
  const {ModalOpen} = useModel();
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-none">
          <AppHeader />
      {ModalOpen ? (
            <PlanBillingContent
            />
          ) : (<Outlet />)}
          
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
