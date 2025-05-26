import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import AppHeader from "./Header";

export default function AppLayout() {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-none">
          <AppHeader />
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
