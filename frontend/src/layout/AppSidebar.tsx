import { ChevronDown, FileText, Trash, HelpCircle, PlusIcon, ZapIcon, Users2Icon, FileUp, HomeIcon, Scale, BookOpen, Wrench, CalendarClock, Edit2Icon, Trash2Icon, Save, ArrowUpCircle, Text, Key, MoreVertical, Ellipsis } from "lucide-react"
import type React from "react"
import { useLocation } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import API from "@/lib/api"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
import { useCreateConversationMutation, useUpdateConversationTitleMutation, useDeleteConversationMutation } from "./hooks/hook"
import { useState } from "react"

type Conversation = {
  conversationId: string
  title: string
  createdat?: string // Use optional chaining if createdAt might be missing
}

type ViewMode = 'recent' | 'trash';

export default function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile, setOpen } = useSidebar()

  const { user } = useAuth()

  const handleSidebarClose = () => {
    setOpenMobile(false) // Close on mobile
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
  // Add new state for view mode
  const [viewMode, setViewMode] = useState<ViewMode>('recent')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [permanentDeleteOpen, setPermanentDeleteOpen] = useState(false)
  const [deletingChatIds, setDeletingChatIds] = useState<string[]>([])
  const createConversationMutation = useCreateConversationMutation()
  const updateTitleMutation = useUpdateConversationTitleMutation()
  const deleteChatMutation = useDeleteConversationMutation()

  // Add restore mutation
  const queryClient = useQueryClient()
  const restoreChatMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await API.post(`/chat/restore/${conversationId}`)
      return response.data
    },
    onSuccess: () => {
      // Invalidate conversations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })

  const navigate = useNavigate()
  const location = useLocation()

  // Modify the useConversationsQuery to include view mode
  const { data: conversationsData, isLoading, error } = useQuery({
    queryKey: ['conversations', viewMode],
    queryFn: async () => {
      const response = await API.get(`/chat/${viewMode === 'trash' ? 'trash' : 'user-conversations'}`)
      return response.data
    },
  })

  // Add toggle handler
  const handleViewToggle = (mode: ViewMode) => {
    setViewMode(mode)
  }

  const recentChats = (conversationsData?.conversations || [])
    .slice() // create a shallow copy to avoid mutating original
    .sort((a: Conversation, b: Conversation) => {
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

  const handleUpdateTitle = async (conversationId: string) => {
    if (!newTitle.trim()) return
    try {
      await updateTitleMutation.mutateAsync({
        conversationId,
        title: newTitle.trim()
      })
      setEditingId(null)
      setNewTitle("")
    } catch (error) {
      console.error("Failed to update title:", error)
    }
  }

  const handleDelete = async (conversationId: string) => {
    try {
      setDeletingChatIds(prev => [...prev, conversationId])
      await deleteChatMutation.mutateAsync(conversationId)
      // If deleted conversation is currently being edited, reset editing state
      if (editingId === conversationId) {
        setEditingId(null)
        setNewTitle("")
      }
    } catch (error) {
      console.error("Failed to delete chat:", error)
    } finally {
      setDeletingChatIds(prev => prev.filter(id => id !== conversationId))
    }
  }

  const handleRestore = async (conversationId: string) => {
    try {
      await restoreChatMutation.mutateAsync(conversationId)
      // Close all dialogs
      setDeleteConfirmOpen(false)
      setPermanentDeleteOpen(false)
      // Reset current chat ID
      setCurrentChatId(null)
      // Close any open dropdown menus
      document.body.click()
    } catch (error) {
      console.error("Failed to restore chat:", error)
    }
  }

  const handlePermanentDelete = async (conversationId: string) => {
    try {
      setDeletingChatIds(prev => [...prev, conversationId])
      await API.post(`/chat/permanent-delete/${conversationId}`)
      // Invalidate conversations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      // Close dialog and reset state after successful deletion
      setPermanentDeleteOpen(false)
      setDeleteConfirmOpen(false)
      setCurrentChatId(null)
      // Close any open dropdown menus
      document.body.click()
    } catch (error) {
      console.error("Failed to permanently delete chat:", error)
    } finally {
      setDeletingChatIds(prev => prev.filter(id => id !== conversationId))
    }
  }

  return (
    <>
      <SidebarContent className="md:pt-4 custom-scrollbar-left">
        <SidebarGroup className="py-0">
          <SidebarMenu>
            {/* Add a back button when in trash view */}
            {viewMode === 'trash' && (
              <SidebarMenuItem className="md:block">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-12 mb-2"
                  onClick={() => setViewMode('recent')}
                >
                  <ChevronDown className="rotate-90" size={18} />
                  <span>Back to Conversations</span>
                </Button>
              </SidebarMenuItem>
            )}

            {/* Only show New Chat button when not in trash */}
            {viewMode === 'recent' && (
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
            )}

            <Collapsible defaultOpen className="mt-2">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="gap-2 py-5 text-muted-foreground">
                    <span>
                      {viewMode === 'trash' ? (
                        'Deleted Conversations'
                      ) : (
                        'Recent Conversations'
                      )}
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </SidebarMenuItem>

              <CollapsibleContent className="">
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
                        <span className="truncate text-muted-foreground">
                          {viewMode === 'trash' ? 'No deleted conversations' : 'No recent conversations'}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : (
                    recentChats.map((chat: any) => {
                      const isActive = location.pathname === `/chat/${chat.conversationid || chat.conversationId}`
                      const isEditing = editingId === chat.conversationid || editingId === chat.conversationId

                      return (
                        <SidebarMenuItem key={chat.conversationid} className="px-2 group/item relative">
                          {viewMode === ('trash' as ViewMode) ? (
                            <div className={[
                              "block relative",
                              "hover:bg-muted/60",
                              "rounded-md transition-colors"
                            ].join(" ")}>
                              <SidebarMenuButton className="gap-2 py-5 w-full">
                                <div className="flex items-center gap-2 w-full pr-8">
                                  <FileText size={18} />
                                  <span className="truncate flex-1 ">{chat.title}</span>
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <button className="p-1 hover:bg-muted/60 rounded text-muted-foreground hover:text-foreground cursor-pointer">
                                          <Ellipsis size={16} />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={async (e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            await handleRestore(chat.conversationid || chat.conversationId)
                                            setPermanentDeleteOpen(false)
                                          }}
                                          className="gap-2"
                                          disabled={restoreChatMutation.isPending}
                                        >
                                          <ArrowUpCircle size={14} />
                                          <span>Restore conversation</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setCurrentChatId(chat.conversationid || chat.conversationId)
                                            setPermanentDeleteOpen(true)
                                          }}
                                          className="gap-2 text-destructive"
                                          disabled={deletingChatIds.includes(chat.conversationid || chat.conversationId)}
                                        >
                                          {deletingChatIds.includes(chat.conversationid || chat.conversationId) ? (
                                            <span className="animate-spin">⌛</span>
                                          ) : (
                                            <Trash2Icon size={14} />
                                          )}
                                          <span>Delete permanently</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </SidebarMenuButton>
                            </div>
                          ) : (
                            <NavLink
                              to={`/chat/${chat.conversationid}`}
                              onClick={(e) => {
                                setTimeout(() => {
                                  onNavClick();
                                }, 10);
                              }}
                              className={({ isActive: navActive }) =>
                                [
                                  "block relative",
                                  isActive || navActive
                                    ? "bg-muted text-foreground font-semibold"
                                    : "hover:bg-muted/60",
                                  "rounded-md transition-colors"
                                ].join(" ")
                              }
                            >
                              <SidebarMenuButton className="gap-2 py-5 w-full">
                                <div className="flex items-center gap-2 w-full pr-8">
                                  <FileText size={18} />
                                  {isEditing ? (
                                    <div className="flex-1 flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        onKeyDown={async (e) => {
                                          if (e.key === "Enter") {
                                            await handleUpdateTitle(chat.conversationid)
                                            setEditingId(null)
                                            setNewTitle("")
                                          } else if (e.key === "Escape") {
                                            setEditingId(null)
                                            setNewTitle("")
                                          }
                                        }}
                                        className="flex-1 bg-transparent border-none focus:outline-none"
                                        autoFocus
                                        onClick={(e) => e.preventDefault()}
                                      />
                                      <button
                                        onClick={async (e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          await handleUpdateTitle(chat.conversationid)
                                          setEditingId(null)
                                          setNewTitle("")
                                        }}
                                        className="p-1 hover:bg-muted/60 rounded text-muted-foreground hover:text-foreground hover:cursor-pointer"
                                        title="Save"
                                      >
                                        <Save size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="truncate flex-1 ">{chat.title}</span>
                                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <button className="p-1 hover:bg-muted/60 rounded text-muted-foreground hover:text-foreground cursor-pointer">
                                              <Ellipsis  size={16} />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setEditingId(chat.conversationid)
                                                setNewTitle(chat.title)
                                              }}
                                              className="gap-2"
                                            >
                                              <Edit2Icon size={14} />
                                              <span>Edit title</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setCurrentChatId(chat.conversationid)
                                                setDeleteConfirmOpen(true)
                                              }}
                                              className="gap-2 text-destructive"
                                              disabled={deletingChatIds.includes(chat.conversationid)}
                                            >
                                              {deletingChatIds.includes(chat.conversationid) ? (
                                                <span className="animate-spin">⌛</span>
                                              ) : (
                                                <Trash2Icon size={14} />
                                              )}
                                              <span>Move to trash</span>
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </SidebarMenuButton>
                            </NavLink>
                          )}
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
            <SidebarMenuButton
              className={`gap-2 py-5 ${viewMode === 'trash' ? 'text-foreground font-semibold' : ''}`}
              onClick={() => handleViewToggle(viewMode === 'trash' ? 'recent' : 'trash')}
            >
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

      {/* Delete confirmation dialog (Move to trash) */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Trash</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to move this conversation to trash? You can restore it later from the trash.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                setDeleteConfirmOpen(false)
                if (currentChatId) {
                  await handleDelete(currentChatId)
                  setCurrentChatId(null)
                }
              }}
              disabled={currentChatId ? deletingChatIds.includes(currentChatId) : false}
            >
              {currentChatId && deletingChatIds.includes(currentChatId) ? (
                <span className="animate-spin mr-2">⌛</span>
              ) : null}
              Move to Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent delete confirmation dialog */}
      <Dialog open={permanentDeleteOpen} onOpenChange={setPermanentDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently Delete Conversation</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to permanently delete this conversation? This action cannot be undone and the conversation will be lost forever.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermanentDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                setPermanentDeleteOpen(false)
                if (currentChatId) {
                  await handlePermanentDelete(currentChatId)
                  setCurrentChatId(null)
                }
              }}
              disabled={currentChatId ? deletingChatIds.includes(currentChatId) : false}
            >
              {currentChatId && deletingChatIds.includes(currentChatId) ? (
                <span className="animate-spin mr-2">⌛</span>
              ) : null}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <NavLink to="/set-system-prompt" onClick={onNavClick}>
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton className="gap-2 py-5 relative">
                    <Text size={18} />
                    <span className="truncate" style={{
                      textOverflow: "clip",
                    }}>System Prompt</span>
                    <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_0%,_rgba(250,251,253,0)_60%,_rgba(250,251,253,1)_100%)]"></div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </NavLink>
              <NavLink to="/set-cut-tokens" onClick={onNavClick}>
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton className="gap-2 py-5 relative">
                    <Key size={18} />
                    <span className="truncate" style={{
                      textOverflow: "clip",
                    }}>Tokens Setting</span>
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