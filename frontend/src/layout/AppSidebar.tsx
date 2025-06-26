import { ChevronDown, FileText, Trash, HelpCircle, PlusIcon, ZapIcon, Users2Icon,FileUp, HomeIcon, Scale, BookOpen, Wrench, CalendarClock } from "lucide-react"
import type React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  // useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AppSidebarHeader } from "./AppSidebarHeader"
import { useAuth } from "@/context/Auth.context"
import { NavLink } from "react-router-dom"

export default function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // const { setOpenMobile } = useSidebar()
  const { user } = useAuth()

  return (
    <Sidebar {...props}>
      <AppSidebarHeader />
      {user?.role === "admin" ? <AdminSidebar /> : <UserSidebar />}
    </Sidebar>
  )
}



function UserSidebar() {
  return (
    <>
      <SidebarContent className="md:pt-4">
        <SidebarGroup className="py-0">
          <SidebarMenu>
            <SidebarMenuItem className="hidden md:block">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <PlusIcon size={18} />
                <span>New Chat</span>
              </Button>
            </SidebarMenuItem>

            {/* <SidebarMenuItem className="mt-4 px-2">
              <SidebarMenuButton className="gap-2 py-5">
                <FolderOpen size={18} />
                <span>My Documents</span>
              </SidebarMenuButton>
            </SidebarMenuItem> */}

            <Collapsible defaultOpen className="mt-2">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="gap-2 py-5 text-muted-foreground">
                    <span>Recent Chats</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </SidebarMenuItem>

              <CollapsibleContent>
                <SidebarMenu>
                  {recentChats.map((chat) => (
                    <SidebarMenuItem key={chat.title} className="px-2">
                      <SidebarMenuButton className="gap-2 py-5 relative">
                        <FileText size={18} />
                        <span className="truncate" style={{
                          textOverflow: "clip",
                        }}>{chat.title}</span>
                        <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_0%,_rgba(250,251,253,0)_60%,_rgba(250,251,253,1)_100%)]"></div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t md:border-none">
        <SidebarMenu>
          <SidebarMenuItem className="md:hidden">
            <SidebarMenuButton className="gap-2 py-5 text-orange">
              <ZapIcon />
              <span>Upgrade Plan</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2 py-5">
              <Trash size={18} />
              <span>Trash</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2 py-5">
              <HelpCircle size={18} />
              <span>Help & support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}

const recentChats = [
  { title: "ASCII String conversion" },
  { title: "Learn about GSOC" },
  { title: "DFS and BFS" },
  { title: "Pain points for an e-commerce asd;fljasdf  asd" },
  { title: "Array Multiplication" },
]


function AdminSidebar() {
  return (
    <>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <PlusIcon size={18} />
                <span>Admin Dashboard</span>
              </Button>
            </SidebarMenuItem>

            <div className="flex flex-col gap-2 mt-4">
              <NavLink to="/">
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton className="gap-2 py-5 relative">
                    <HomeIcon size={18} />
                  <span className="truncate" style={{
                    textOverflow: "clip",
                  }}>Dashboard</span>
                    <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_0%,_rgba(250,251,253,0)_60%,_rgba(250,251,253,1)_100%)]"></div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </NavLink>
              <NavLink to="/users">
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton className="gap-2 py-5 relative">
                    <Users2Icon size={18} />
                  <span className="truncate" style={{
                    textOverflow: "clip",
                  }}>Users</span>
                    <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_0%,_rgba(250,251,253,0)_60%,_rgba(250,251,253,1)_100%)]"></div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </NavLink>
              <NavLink to="/jurisdictions">
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton className="gap-2 py-5 relative">
                    <Scale size={18} />
                  <span className="truncate" style={{
                    textOverflow: "clip",
                  }}>jurisdictions</span>
                    <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_0%,_rgba(250,251,253,0)_60%,_rgba(250,251,253,1)_100%)]"></div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </NavLink>
              <NavLink to="/upload-doc">
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton className="gap-2 py-5 relative">
                    <FileUp size={18} />
                  <span className="truncate" style={{
                    textOverflow: "clip",
                  }}>Upload Documents</span>
                    <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_0%,_rgba(250,251,253,0)_60%,_rgba(250,251,253,1)_100%)]"></div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </NavLink>
              <NavLink to="/all-docs">
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton className="gap-2 py-5 relative">
                    <BookOpen size={18} />
                  <span className="truncate" style={{
                    textOverflow: "clip",
                  }}>Knowledge Base</span>
                    <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_0%,_rgba(250,251,253,0)_60%,_rgba(250,251,253,1)_100%)]"></div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </NavLink>
              <NavLink to="/Scraping">
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton className="gap-2 py-5 relative">
                    <Wrench size={18} />
                  <span className="truncate" style={{
                    textOverflow: "clip",
                  }}>Scraping</span>
                    <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_0%,_rgba(250,251,253,0)_60%,_rgba(250,251,253,1)_100%)]"></div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </NavLink>
              <NavLink to="/set-time">
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton className="gap-2 py-5 relative">
                    <CalendarClock size={18} />
                  <span className="truncate" style={{
                    textOverflow: "clip",
                  }}>Scraping Scheduler
</span>
                    <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_0%,_rgba(250,251,253,0)_60%,_rgba(250,251,253,1)_100%)]"></div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </NavLink>

            </div>

          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* <SidebarFooter className="mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2 py-5">
              <Trash size={18} />
              <span>Trash</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2 py-5">
              <HelpCircle size={18} />
              <span>Help & support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter> */}
    </>
  )
}