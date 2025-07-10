import { ChevronDown, FileText, Trash, HelpCircle, PlusIcon, ZapIcon, Users2Icon, FileUp, HomeIcon, Scale, BookOpen, Wrench, CalendarClock } from "lucide-react"
import type React from "react"
import { useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AppSidebarHeader } from "./AppSidebarHeader"
import { useAuth } from "@/context/Auth.context"
import { NavLink, useNavigate } from "react-router-dom"
import { useConversationsQuery, useCreateConversationMutation } from "./hook"
import { useEffect, useState } from "react"
// import '../pages/admin/dashboard/chat.css' // Import your custom styles for the chat

// Define Conversation type if not imported from elsewhere
type Conversation = {
  conversationid: string
  title: string
  createdat?: string // Use optional chaining if createdAt might be missing
  // Add other fields as needed
}

export default function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile, setOpen } = useSidebar()
  
  const { user } = useAuth()

  const handleSidebarClose = () => {
    setOpenMobile(false) // Close on mobile
    // setOpen(false)       // Close on desktop
  }

  return (
    <Sidebar {...props}>
      <AppSidebarHeader />
      {user?.role === "admin" ? (
        <AdminSidebar onNavClick={handleSidebarClose} />
      ) : (
        <UserSidebar onNavClick={handleSidebarClose} />
      )}
    </Sidebar>
  )
}

export function UserSidebar({ onNavClick }: { onNavClick: () => void }) {
  const { data: conversationsData, isLoading, error } = useConversationsQuery()
  const createConversationMutation = useCreateConversationMutation()
  // const [ recentChats , setRecentChats] = useState<Conversation[]>([])
const navigate = useNavigate()
const location = useLocation()
console.log("conversationsData", conversationsData)


// useEffect(()=>{
// setRecentChats(conversationsData?.conversations || [])

// },[conversationsData])
  
  // const recentChats = (conversationsData?.conversations || [])
   const recentChats = (conversationsData?.conversations || [])
    .slice() // create a shallow copy to avoid mutating original
    .sort((a, b) => {
      // If createdAt is missing, treat as oldest
      const aTime = a.createdat ? new Date(a.createdat).getTime() : 0
      const bTime = b.createdat ? new Date(b.createdat).getTime() : 0
      return bTime - aTime // descending order
    })
  // .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  // setRecentChats(conversationsData?.conversations || [])

  const handleNewChat = async () => {
    try {
      navigate('/')
      onNavClick()
    } catch (error) {
      console.error("Failed to create new chat:", error)
    }
  }

  return (
    <>
      <SidebarContent className="md:pt-4">
        <SidebarGroup className="py-0">
          <SidebarMenu>
            <SidebarMenuItem className="hidden md:block">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-12 custom-scrollbar-left" 
                onClick={handleNewChat}
                disabled={createConversationMutation.isPending}
              >
                <PlusIcon size={18} />
                <span>{createConversationMutation.isPending ? "Creating..." : "New Chat"}</span>
              </Button>
            </SidebarMenuItem>

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
                  {isLoading ? (
                    <SidebarMenuItem className="px-2">
                      <SidebarMenuButton className="gap-2 py-5 relative">
                        <span className="truncate">Loading...</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : error ? (
                    <SidebarMenuItem className="px-2">
                      <SidebarMenuButton className="gap-2 py-5 relative">
                        <span className="truncate text-red-500">Error loading chats</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : recentChats.length === 0 ? (
                    <SidebarMenuItem className="px-2">
                      <SidebarMenuButton className="gap-2 py-5 relative">
                        <span className="truncate text-muted-foreground">No recent chats</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : (
                    recentChats.map((chat) => {
                      const isActive = location.pathname === `/chat/${chat.conversationid}`
                      return (
                        <SidebarMenuItem key={chat.conversationid} className="px-2">
                          <NavLink
                            to={`/chat/${chat.conversationid}`}
                            onClick={onNavClick}
                            className={({ isActive: navActive }) =>
                              [
                                "block",
                                isActive || navActive
                                  ? "bg-muted text-foreground font-semibold"
                                  : "hover:bg-muted/60",
                                "rounded-md transition-colors"
                              ].join(" ")
                            }
                          >
                            <SidebarMenuButton className="gap-2 py-5 relative">
                              <FileText size={18} />
                              <span className="truncate" style={{
                                textOverflow: "clip",
                              }}>{chat.title}</span>
                              <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_0%,_rgba(250,251,253,0)_60%,_rgba(250,251,253,1)_100%)]"></div>
                            </SidebarMenuButton>
                          </NavLink>
                        </SidebarMenuItem>
                      )
                    })
                  )}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t md:border-none">
        <SidebarMenu>
          <SidebarMenuItem className="md:hidden">
            <SidebarMenuButton className="gap-2 py-5 text-orange" onClick={onNavClick}>
              <ZapIcon />
              <span>Upgrade Plan</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2 py-5" onClick={onNavClick}>
              <Trash size={18} />
              <span>Trash</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2 py-5" onClick={onNavClick}>
              <HelpCircle size={18} />
              <span>Help & support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}

function AdminSidebar({ onNavClick }: { onNavClick: () => void }) {
  return (
    <>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarMenu>
            <div className="flex flex-col gap-2 mt-4">
              <NavLink to="/" onClick={onNavClick}>
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
              
              <NavLink to="/users" onClick={onNavClick}>
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
              
              <NavLink to="/jurisdictions" onClick={onNavClick}>
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
              
              <NavLink to="/upload-doc" onClick={onNavClick}>
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
              
              <NavLink to="/all-docs" onClick={onNavClick}>
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
              
              <NavLink to="/Scraping" onClick={onNavClick}>
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
              
              <NavLink to="/set-time" onClick={onNavClick}>
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton className="gap-2 py-5 relative">
                    <CalendarClock size={18} />
                    <span className="truncate" style={{
                      textOverflow: "clip",
                    }}>Scraping Scheduler</span>
                    <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_0%,_rgba(250,251,253,0)_60%,_rgba(250,251,253,1)_100%)]"></div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </NavLink>
            </div>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </>
  )
}