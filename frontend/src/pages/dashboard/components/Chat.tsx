"use client"

import type React from "react"

import {
  Book,
  Paperclip,
  ChevronDown,
  FileText,
  ChevronRight,
  X,
  ChevronLeft,
  Copy,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  FileDown,
} from "lucide-react"
import type { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState, useRef, useEffect } from "react"

import { Swiper, SwiperSlide } from "swiper/react"
import { Mousewheel, Navigation, Scrollbar } from "swiper/modules"
// @ts-ignore
import "swiper/css"
// @ts-ignore
import "swiper/css/navigation"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface AttachedDocument {
  id: string
  name: string
  type: string
  size: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  currentMessages?: any
  documents?: AttachedDocument[]
}

const Chat = ({
  messages,
  setMessages,
}: {
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
}) => {
  const [message, setMessage] = useState<string>("")
  const [selectedDocuments, setSelectedDocuments] = useState<AttachedDocument[]>([])
  const [tempSelectedDocs, setTempSelectedDocs] = useState<AttachedDocument[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)") // sm breakpoint in Tailwind is 640px; md is 768px, so max-width 767px is sm and below
    const handleResize = () => setIsSmallScreen(mediaQuery.matches)

    handleResize()
    mediaQuery.addEventListener("change", handleResize)

    return () => mediaQuery.removeEventListener("change", handleResize)
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      // Calculate how many more files can be added
      const remainingSlots = 10 - tempSelectedDocs.length
      const filesToAdd = Math.min(files.length, remainingSlots)

      const newDocs: AttachedDocument[] = Array.from(files)
        .slice(0, filesToAdd)
        .map((file, index) => ({
          id: `${Date.now()}-${index}`,
          name: file.name,
          type: file.type.includes("pdf") ? "PDF" : "Document",
          size: `${(file.size / 1024).toFixed(1)} KB`,
        }))

      // Add to both states simultaneously
      setSelectedDocuments([...selectedDocuments, ...newDocs])
      setTempSelectedDocs([...tempSelectedDocs, ...newDocs])

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeDocument = (docId: string, isTemp = false) => {
    if (isTemp) {
      setTempSelectedDocs(tempSelectedDocs.filter((doc) => doc.id !== docId))
      // Also remove from selectedDocuments if it exists there
      setSelectedDocuments(selectedDocuments.filter((doc) => doc.id !== docId))
    } else {
      setSelectedDocuments(selectedDocuments.filter((doc) => doc.id !== docId))
      // Also remove from tempSelectedDocs if it exists there
      setTempSelectedDocs(tempSelectedDocs.filter((doc) => doc.id !== docId))
    }
  }

  const handleSendMessage = () => {
    if (message.trim() || selectedDocuments.length > 0) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        documents: selectedDocuments.length > 0 ? [...selectedDocuments] : undefined,
      }

      // Add user message first
      const updatedMessages = [...messages, newMessage]
      setMessages(updatedMessages)

      // Clear input and selected documents
      setMessage("")
      setSelectedDocuments([])
      setTempSelectedDocs([])

      // Simulate AI response after delay
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Thank you for your question. I've analyzed the provided documents and here's my response based on the legal information available.",
        }
        // Use functional update to ensure we get the latest state
        setMessages((currentMessages: ChatMessage[]) => [...currentMessages, aiResponse])
      }, 1000)
    }
  }

  const renderMessage = (msg: ChatMessage) => {
    if (msg.role === "user") {
      return (
        <div key={msg.id} className="flex flex-col items-end mb-4">
          {/* Documents displayed above the message */}
          {msg.documents && msg.documents.length > 0 && (
            <div className="mb-2 space-y-1 max-w-[80%] md:max-w-md">
              {msg.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 p-2 bg-gray-100 rounded text-xs border">
                  <FileText className={`w-4 h-4 ${doc.type === "PDF" ? "text-blue-500" : "text-red-500"}`} />
                  <div className="flex flex-col">
                    <span className="font-medium truncate">{doc.name}</span>
                    <span className="text-gray-500">
                      {doc.type} • {doc.size}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* User message */}
          <div className="bg-gray-200 rounded-lg px-3 md:px-4 py-2 max-w-[80%] md:max-w-md">
            <p className="text-gray-800 text-sm md:text-sm">{msg.content}</p>
          </div>
        </div>
      )
    }

    return (
      <div key={msg.id} className="rounded-lg py-4 md:py-6 mb-4">
        <div className="space-y-3 md:space-y-4">
          <p className="text-gray-800 text-sm md:text-sm">{msg.content}</p>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2 mt-3 md:mt-4">
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white text-gray-600 hover:bg-gray-200"
          >
            <ThumbsUp className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white text-gray-600 hover:bg-gray-200"
          >
            <ThumbsDown className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white text-gray-600 hover:bg-gray-200"
          >
            <Copy className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white text-gray-600 hover:bg-gray-200"
          >
            <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full flex flex-col m-0 p-0 mt-5 md:mt-15", messages.length > 0 ? "h-[90vh]" : "")}>
      {/* Messages Section */}
      {messages.length > 0 && (
        <div
          className="flex-1 overflow-y-auto pb-4"
          style={{
            maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
          }}
        >
          <div className="md:max-w-[950px] px-2 md:pl-8 flex items-center justify-center mx-auto mb-4 overflow-hidden text-[12px]">
            <div className="w-full space-y-4 pt-6 md:pt-12">{messages.map(renderMessage)}</div>
          </div>
        </div>
      )}

      {/* Chat Input Section */}
      <div
        className={cn(
          "mx-auto w-full max-w-5xl bg-background px-2 md:pl-8 flex-shrink-0 relative",
          messages.length > 0 ? "pb-10" : "mt-auto",
        )}
      >
        {/* Suggestions */}
        <div className="mb-4 hidden md:flex flex-wrap gap-2 sm:mt-3 z-10">
          <Button className="rounded-sm text-muted-foreground hover:text-white bg-muted px-4 py-2 text-sm">
            What's your checklist for incorporating a new startup?
          </Button>
          <Button className="rounded-sm text-muted-foreground hover:text-white bg-muted px-4 py-2 text-sm">
            When should you recommend arbitration vs. litigation?
          </Button>
        </div>

        {/* Message Input */}
        <div
          className={cn(
            "bg-background mx-auto border rounded-md p-2 max-w-[95vw] md:max-w-[635px] lg:max-w-full overflow-y-auto relative flex flex-col",
            selectedDocuments.length > 0 ? "h-[180px] md:h-[160px]" : "h-[120px] md:h-[100px]",
          )}
        >
          {/* Selected Documents Display */}
          {selectedDocuments.length > 0 && (
            <div className="">
              <Swiper
                modules={[Navigation, Scrollbar, Mousewheel]}
                spaceBetween={isMobile ? 8 : 10}
                navigation={{
                  nextEl: ".swiper-button-next",
                  prevEl: ".swiper-button-prev",
                }}
                className="relative"
                scrollbar={{ draggable: true }}
                mousewheel={{ forceToAxis: true }}
                slidesPerView="auto"
              >
                <div className="swiper-button-prev absolute left-0 top-1/2 transform z-30 after:!content-none">
                  <div className="absolute -top-3 -left-3 w-16 md:w-28 h-15 bg-[linear-gradient(90deg,rgba(250,251,253,1)_0%,rgba(250,251,253,0.83)_67%,rgba(250,251,253,0)_100%)] z-10 pointer-events-none" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 md:h-6 md:w-6 rounded-full text-black hover:bg-transparent z-20"
                  >
                    <ChevronLeft className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  </Button>
                </div>

                {selectedDocuments.map((doc) => (
                  <SwiperSlide key={doc.id} className="max-w-28 md:max-w-32 lg:max-w-56 py-2 group">
                    <Button className="rounded-sm text-foreground bg-transparent hover:bg-transparent border w-full !px-1.5 md:!px-2 pe-3 md:pe-4 py-2 h-10 md:h-12 text-xs md:text-sm flex justify-start">
                      <FileText className={`!w-4 !h-4 md:!w-6 md:!h-6 flex-shrink-0 text-black`} />
                      <div className="flex flex-col items-start min-w-0">
                        <h3 className="text-xs md:text-sm font-normal truncate w-full">{doc.name}</h3>
                        <p className="text-xs font-light text-muted-foreground">{doc.type}</p>
                      </div>
                    </Button>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="block md:hidden group-hover:block absolute -top-0 -right-1 bg-black rounded-full p-1 z-10 cursor-pointer"
                    >
                      <X className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                    </button>
                  </SwiperSlide>
                ))}

                <div className="absolute top-0 right-0 mx-auto w-32 md:w-48 h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_38%,_rgba(250,251,253,1)_100%)] z-10"></div>

                <div className="swiper-button-next absolute right-0 top-1/2 transform z-10 after:!content-none">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 md:h-6 md:w-6 rounded-full text-black hover:bg-transparent"
                  >
                    <ChevronRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  </Button>
                </div>
              </Swiper>
            </div>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-sm mb-7 flex-1 text-start px-1 py-2 bg-transparent outline-none border-none focus-visible:ring-[0px] shadow-none font-inter placeholder:text-muted-foreground text-sm md:text-sm"
            placeholder="Ask Gavin a question..."
          />

          <div className="flex w-[96%] items-center justify-between absolute bottom-2 right-2">
            <div className="md:hidden flex items-center gap-2 mr-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-sm text-muted-foreground hover:text-foreground bg-transparent border px-2 pe-3 md:pe-4 py-2.5 md:py-3 h-[unset] text-xs md:text-sm"
                  >
                    <Book className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-64 md:w-72">
                  <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => {}}>
                    Status Bar
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => {}}>
                    Panel
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-sm text-muted-foreground hover:text-foreground bg-transparent border px-2.5 md:px-3 py-2 md:py-[10px] text-xs md:text-sm"
                  >
                    <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            <Button
              onClick={handleSendMessage}
              className="rounded-sm ml-auto justify-self-end text-white hover:text-white bg-foreground hover:bg-gray-600 px-3 md:px-4 py-2 text-xs md:text-sm"
            >
              Ask Gavin
            </Button>
          </div>
        </div>

        {/* Document upload and knowledge source */}
        <div className="hidden md:flex md:flex-row py-3 items-stretch sm:items-center justify-between gap-3 sm:gap-0">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-sm text-foreground hover:bg-primary cursor-pointer hover:text-white bg-white border px-2 pe-3 md:pe-4 py-2.5 md:py-3 h-[unset] text-xs md:text-sm flex items-center gap-2"
              >
                <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-muted-foreground">
                  <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="flex flex-col items-start">
                  <h3 className="font-medium text-xs md:text-sm">Attach doc or PDF</h3>
                  <p className="text-xs text-muted-foreground hidden sm:block">Choose files from your computer</p>
                </div>
              </Button>
            </DialogTrigger>
          </Dialog>

          <DropdownMenuCheckboxes />
        </div>
      </div>

      {/* Legal Document Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-md p-10 font-inter"
          style={isSmallScreen ? { maxWidth: "calc(100vw - 4rem)" } : {}}
        >
          <DialogHeader>
            <DialogTitle className="text-left">Attach Legal Documents</DialogTitle>
            <DialogDescription className="text-left text-sm text-gray-600">
              Upload contracts, filings, or clauses for analysis (Max 10 files, 10MB each)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mt-4 text-center">
              <FileDown className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <p className="text-sm text-gray-700 mb-2">Drag and drop files here</p>
              <p className="text-xs text-gray-600 mb-4">Or</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={tempSelectedDocs.length >= 10}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size={"browse"}
                className={`text-sm border-1 border-gray-800 ${tempSelectedDocs.length >= 10 ? " opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                disabled={tempSelectedDocs.length >= 10}
              >
                Browse files
              </Button>
            </div>
          </div>

          {/* Selected Files */}
          {tempSelectedDocs.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Selected files</h4>
                <span className="text-xs text-gray-500">{tempSelectedDocs.length} of 10 files</span>
              </div>
              <div className={`${tempSelectedDocs.length >= 2 ? "max-h-38 overflow-y-auto" : ""}`}>
                {tempSelectedDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-100 rounded mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className={`h-4 w-4 ${doc.type === "PDF" ? "text-blue-500" : "text-red-500"}`} />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.type} • {doc.size}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeDocument(doc.id, true)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tempSelectedDocs.length == 0 && (
            <div className="space-y-2 mt-4 flex items-center justify-end gap-3">
              <Button
                variant={"outline"}
                size={"brows"}
                onClick={() => {
                  setSelectedDocuments([...selectedDocuments, ...tempSelectedDocs])
                  setTempSelectedDocs([])
                  setDialogOpen(false)
                }}
                className="text-sm font-light border border-gray-800 h-8 px-8 md:hidden"
              >
                Back
              </Button>

              <div className="">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={tempSelectedDocs.length >= 10}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size={"brows"}
                  variant="outline"
                  className={`text-sm font-light border border-gray-800 bg-black text-white h-8 px-8 `}
                  disabled={tempSelectedDocs.length >= 10}
                >
                  Upload
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

type Checked = DropdownMenuCheckboxItemProps["checked"]

export function DropdownMenuCheckboxes() {
  const [showStatusBar, setShowStatusBar] = useState<Checked>(true)
  const [showPanel, setShowPanel] = useState<Checked>(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-sm text-foreground cursor-pointer bg-white border px-2 pe-3 md:pe-4 py-2.5 md:py-3 h-[unset] text-xs md:text-sm w-full sm:w-64 md:w-72 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-muted-foreground">
            <Book className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="flex flex-col items-start">
            <h3 className="font-medium text-xs md:text-sm">Choose Knowledge Source</h3>
            <p className="text-xs text-muted-foreground hidden sm:block">EDGAR, EUR-Lex and more</p>
          </div>
        </div>
        <div>
          <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 md:w-72">
        <DropdownMenuCheckboxItem checked={showStatusBar} onCheckedChange={setShowStatusBar}>
          Status Bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={showPanel} onCheckedChange={setShowPanel}>
          Panel
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default Chat
