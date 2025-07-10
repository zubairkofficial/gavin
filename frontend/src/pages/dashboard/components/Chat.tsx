"use client"

import type React from "react"

import {
  Book,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileDown,
  FileText,
  Paperclip,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useRef, useState } from "react"
import { Mousewheel, Navigation, Scrollbar } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

// @ts-ignore
import "swiper/css"
// @ts-ignore
import "swiper/css/navigation"

import { useIsMobile } from "@/hooks/use-mobile"
import API from "@/lib/api"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { set } from "date-fns"

interface AttachedDocument {
  id: string
  name: string
  type: string
  size: string
  file?: File // Add the actual file object
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  currentMessages?: any
  documents?: AttachedDocument[]
  isStreaming?: boolean
}


const Chat = ({
  messages,
  setMessages,
}: {
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
}) => {
  const [message, setMessage] = useState<string>("");
  const [citation, setcitation] = useState<string>("");
  const [selectedDocuments, setSelectedDocuments] = useState<AttachedDocument[]>([]);
  const [tempSelectedDocs, setTempSelectedDocs] = useState<AttachedDocument[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [title, setTitle] = useState("");
  const [isFirstMessage, setIsFirstMessage] = useState(false);
  const [hasNavigatedToNewConversation, setHasNavigatedToNewConversation] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const params = useParams();
  const urlConversationId = params.conversationId;
  const queryClient = useQueryClient();

  // Ref for smooth scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ref to hold streaming content for assistant message
  const streamingContentRef = useRef("");

  // Cleanup copy timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Fetch conversation messages when URL conversation ID changes
  const fetchConversationMessages = async () => {
    if (!urlConversationId) {
      setMessages([])
      setConversationId("")
      setTitle("")
      return
    }

    // Don't fetch messages if we just navigated to a new conversation that we created
    if (hasNavigatedToNewConversation && conversationId === urlConversationId) {
      setHasNavigatedToNewConversation(false)
      return
    }

    if (!isFirstMessage) {
      setIsFetchingMessages(true)
    }
    try {
      const response = await API.get(`/chat/conversation/${urlConversationId}`)
      if (response.status >= 200 && response.status < 300) {
        const data = response.data
        setConversationId(urlConversationId)
        if (data.title) {
          setTitle(data.title)
        }
        // Update messages if available
        if (data.messages && Array.isArray(data.messages)) {
          const transformedMessages: ChatMessage[] = data.messages.flatMap((msg: any, index: number) => {
            let transformedDocuments: AttachedDocument[] | undefined = undefined;
            if (msg.documents && Array.isArray(msg.documents) && msg.documents.length > 0) {
              transformedDocuments = msg.documents.map((doc: any, docIndex: number) => ({
                id: `${msg.id}-doc-${docIndex}`,
                name: doc.fileName || doc.name || `Document ${docIndex + 1}`,
                type: doc.fileType || doc.type || "Document",
                size: doc.fileSize
                  ? (typeof doc.fileSize === 'number' ? `${(doc.fileSize / 1024).toFixed(1)} KB` : doc.fileSize)
                  : doc.size || "Unknown size",
              }));
            } else if (msg.fileName && msg.fileType && msg.fileSize) {
              transformedDocuments = [
                {
                  id: `${msg.id}-doc-0`,
                  name: msg.fileName,
                  type: msg.fileType?.split('/')[1],
                  size: `${(msg?.fileSize / 1024).toFixed(1)} KB`,
                },
              ];
            }
            const userMsg: ChatMessage = {
              id: `${msg.id}-user`,
              role: "user",
              content: msg.userMessage || "",
              documents: transformedDocuments,
              isStreaming: false,
            };
            const aiMsg: ChatMessage = {
              id: `${msg.id}-assistant`,
              role: "assistant",
              content: msg.aiResponse || "",
              documents: undefined,
              isStreaming: false,
            };
            return [userMsg, aiMsg];
          });
          setMessages(transformedMessages)
        } else {
          setMessages([])
        }
      } else {
        setMessages([])
      }
    } catch (error) {
      setMessages([])
    } finally {
      setIsFirstMessage(false)
      setIsFetchingMessages(false)
    }
  }

  useEffect(() => {
    const fetchsuggestions = async () => {
      const response = await API.get(`/chat/get-suggestions`)
      setSuggestions(response.data.suggestions.titles)
    }
    fetchsuggestions()
    // Only fetch messages if urlConversationId exists (not for new conversation)
    if (urlConversationId) {
      fetchConversationMessages()
    } else {
      // If it's a new conversation, clear messages
      setMessages([])
      setConversationId("")
      setTitle("")
    }

    queryClient.invalidateQueries({ queryKey: ['conversations'] });

  }, [urlConversationId]);

  // Smooth scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)")
    const handleResize = () => setIsSmallScreen(mediaQuery.matches)

    handleResize()
    mediaQuery.addEventListener("change", handleResize)

    return () => mediaQuery.removeEventListener("change", handleResize)
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const remainingSlots = 10 - tempSelectedDocs.length
      const filesToAdd = Math.min(files.length, remainingSlots)

      const newDocs: AttachedDocument[] = Array.from(files)
        .slice(0, filesToAdd)
        .map((file, index) => ({
          id: `${Date.now()}-${index}`,
          name: file.name,
          type: file.type.includes("pdf") ? "PDF" : "Document",
          size: `${(file.size / 1024).toFixed(1)} KB`,
          file: file // Store the actual file object
        }))

      setSelectedDocuments([...selectedDocuments, ...newDocs])
      setTempSelectedDocs([...tempSelectedDocs, ...newDocs])

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeDocument = (docId: string, isTemp = false) => {
    if (isTemp) {
      setTempSelectedDocs(tempSelectedDocs.filter((doc) => doc.id !== docId))
      setSelectedDocuments(selectedDocuments.filter((doc) => doc.id !== docId))
    } else {
      setSelectedDocuments(selectedDocuments.filter((doc) => doc.id !== docId))
      setTempSelectedDocs(tempSelectedDocs.filter((doc) => doc.id !== docId))
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() && selectedDocuments.length === 0) return;

    setIsLoading(true);

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      documents: selectedDocuments.length > 0 ? [...selectedDocuments] : undefined,
    };

    // Use functional updates to avoid race conditions and message loss
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      newMessage,
      { id: assistantMessageId, role: "assistant", content: "", isStreaming: true },
    ]);

    setMessage("");
    setSelectedDocuments([]);
    setTempSelectedDocs([]);

    try {
      const currentConversationId = urlConversationId || conversationId;
      const token = localStorage.getItem('authToken');
      const baseURL = API.defaults?.baseURL || "";

      // Create FormData to handle file uploads
      const formData = new FormData();
      formData.append('message', newMessage.content);

      if (currentConversationId) {
        formData.append('conversationId', currentConversationId);
      }

      if (title) {
        formData.append('title', title);
      }

      // Add files to FormData
      if (newMessage.documents && newMessage.documents.length > 0) {
        newMessage.documents.forEach((doc, index) => {
          if (doc.file) {
            formData.append(`files`, doc.file);
          }
        });
      }

      console.log(formData)

      const response = await fetch(`${baseURL}/chat/message`, {
        method: "POST",
        headers: {
          // Don't set Content-Type header when sending FormData
          // The browser will set it automatically with the boundary
          "Accept": "text/event-stream",
          // "content-type": "multipart/form-data",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: formData, // Send FormData instead of JSON
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No stream reader available");
      }

      let hasNavigated = false;
      streamingContentRef.current = "";
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          console.log(`Received chunk:`, value, `Done:`, done);
          if (done) {
            console.log("Stream completed");
            break;
          }

          const chunk = new TextDecoder().decode(value, { stream: true });
          buffer += chunk;

          // Split by newlines to process complete lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep the last incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === "") continue;

                const data = JSON.parse(jsonStr);
                console.log(`Received chunk data:`, data);

                // Handle conversation metadata (first chunk)
                if (data.conversationId && !hasNavigated) {
                  setConversationId(data.conversationId);
                  if (!urlConversationId || urlConversationId !== data.conversationId) {
                    setIsFirstMessage(true);
                    setHasNavigatedToNewConversation(true); // Set flag before navigation
                    navigate(`/chat/${data.conversationId}`);
                    // Add this line to force refetch after navigation
                    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['conversations'] }), 500);
                    hasNavigated = true;
                  }
                }

                // Handle title update
                if (data.title) {
                  setTitle(data.title);
                }

                // Handle streaming tokens
                if (data.token) {
                  streamingContentRef.current += data.token;
                  console.log("Current streaming content:", streamingContentRef.current);
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: streamingContentRef.current, isStreaming: true }
                      : msg
                  ));
                }

                // Handle completion
                if (data.done) {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, isStreaming: false }
                        : msg
                    )
                    
                  );

                  setIsLoading(false);
                  // Only update the sidebar (conversations list), not the chat messages
                  setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                  }, 300);
                  return;
                }

                // Handle errors
                if (data.error) {
                  console.error("Server error:", data.error);
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === assistantMessageId
                        ? {
                          ...msg,
                          content: `Error: ${data.error}`,
                          isStreaming: false,
                        }
                        : msg
                    )
                  );
                  setIsLoading(false);
                  return;
                }

              } catch (parseError) {
                console.warn("Failed to parse JSON:", parseError, "Line:", line);
                // Continue processing other lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Ensure streaming state is cleared even if done event wasn't received
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
      setIsLoading(false);

    } catch (error: any) {
      console.error("Streaming error:", error);

      let errorMessage = "Sorry, I encountered an error while processing your request. Please try again.";

      if (error.message?.includes('Failed to fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes('HTTP error')) {
        errorMessage = `Server error: ${error.message}`;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
              ...msg,
              content: errorMessage,
              isStreaming: false,
            }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion); // Set selected suggestion to the message input
  };



  const handleCopy = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedMsgId(null), 1500);
  };

  // Regenerate functionality
  const handleRegenerate = async (assistantMsgId: string) => {
    // Find the assistant message index
    const assistantIndex = messages.findIndex(msg => msg.id === assistantMsgId);
    if (assistantIndex === -1 || assistantIndex === 0) return;

    // The user message is usually just before the assistant message
    const userMsg = messages[assistantIndex - 1];
    if (!userMsg || userMsg.role !== "user") return;

    // Remove the old assistant message and insert a new streaming one
    const newAssistantId = `${Date.now()}-regen`;
    setMessages(prev => {
      const newMsgs = [...prev];
      newMsgs.splice(assistantIndex, 1, {
        id: newAssistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      });
      return newMsgs;
    });

    // Send the user message again (reuse logic similar to handleSendMessage)
    await sendMessageForRegenerate(userMsg, newAssistantId);
  };

  // Helper for regeneration streaming
  const sendMessageForRegenerate = async (userMsg: ChatMessage, assistantMessageId: string) => {
    setIsLoading(true);
    const currentConversationId = urlConversationId || conversationId;
    const token = localStorage.getItem('authToken');
    const baseURL = API.defaults?.baseURL || "";

    // Create FormData to handle file uploads
    const formData = new FormData();
    formData.append('message', userMsg.content);
    if (currentConversationId) {
      formData.append('conversationId', currentConversationId);
    }
    if (title) {
      formData.append('title', title);
    }
    // Add files to FormData
    if (userMsg.documents && userMsg.documents.length > 0) {
      userMsg.documents.forEach((doc) => {
        if (doc.file) {
          formData.append('files', doc.file);
        }
      });
    }

    // Append regeneration parameters
    formData.append('regenerate', 'true');
    formData.append('assistantMsgId', assistantMessageId);
    
    // This is the id of the old assistant message being replaced
    console.log('form data:', formData);
    try {
      const response = await fetch(`${baseURL}/chat/message`, {
        method: "POST",
        headers: {
          "Accept": "text/event-stream",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No stream reader available");
      }

      let buffer = "";
      streamingContentRef.current = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === "") continue;
                const data = JSON.parse(jsonStr);
                // Handle streaming tokens
                if (data.token) {
                  streamingContentRef.current += data.token;
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: streamingContentRef.current, isStreaming: true }
                      : msg
                  ));
                }
                // Handle completion
                if (data.done) {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, isStreaming: false }
                        : msg
                    )
                  );
                  setIsLoading(false);
                  setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                  }, 300);
                  return;
                }
                // Handle errors
                if (data.error) {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: `Error: ${data.error}`, isStreaming: false }
                        : msg
                    )
                  );
                  setIsLoading(false);
                  return;
                }
              } catch (parseError) {
                // Ignore parse errors for incomplete lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
      setIsLoading(false);
    } catch (error) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Error regenerating response.", isStreaming: false }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    if (msg.role === "user") {
      return (
        <div key={msg.id} className="flex flex-col items-end ">
          {/* Documents displayed above the message */}
          {msg.documents && msg.documents.length > 0 && (
            <div className="mb-2 space-y-1 max-w-[80%] md:max-w-md">
              {msg.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 p-2 bg-gray-100 rounded text-xs border">
                  <FileText className={`w-4 h-4 ${doc.type === "PDF" || doc.type?.toLowerCase().includes('pdf') ? "text-blue-500" : "text-red-500"}`} />
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
            <p className="text-gray-800 text-sm md:text-sm leading-5">{msg.content}</p>
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className="rounded-lg p-3  mb-4">
        <div className="space-y-3 ">
          <p className="text-gray-800  text-sm md:text-sm ">
            {/* <ReactMarkdown>
            {msg.content}
            </ReactMarkdown> */}
            <ReactMarkdown 
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank" // Open in new tab
                    rel="noopener noreferrer" // Security best practice
                    // backgroundColor : 'white', border : '1px solid #d1d5db' , borderRadius : '2px', margin : '5px' , padding: '5px' , color: 'black'
                    style={{ textDecoration: 'underline' ,  }} // Underline the link
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {msg.content}
            </ReactMarkdown>
            {msg.isStreaming && !msg.content.trim() && <span className="inline-block w-4 h-4 bg-gray-400 ml-1 animate-pulse" />}
            {/* {msg.isStreaming && !msg.content.trim() && (
              <span className="inline-flex ml-2 align-middle">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mx-0.5"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mx-0.5 [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mx-0.5 [animation-delay:0.4s]"></span>
              </span>
            )} */}
          </p>
        </div>
        {/* Action buttons - only show when not streaming */}
        {!msg.isStreaming && (
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
              className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white text-gray-600 hover:bg-gray-200 relative"
              onClick={() => handleCopy(msg.id, msg.content)}
            >
              <Copy className="h-4 w-4 md:h-5 md:w-5" />
              {copiedMsgId === msg.id && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 shadow z-50 whitespace-nowrap">
                  Text copied
                </span>
              )}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white text-gray-600 hover:bg-gray-200"
              onClick={() => handleRegenerate(msg.id)}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Show loading state when fetching messages
  if (isFetchingMessages) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-sm text-gray-600">Loading conversation...</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        // Responsive container for chat area
        "w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-4xl flex flex-col m-0 p-0 min-w-0 ",
        messages.length > 0 ? "h-[84vh] " : "",
        // Responsive padding and centering
        "px-2 sm:px-4 md:px-6 lg:px-8 xl:px-0"
      )}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Messages Section */}
      {messages.length > 0 && (
        <div
          className="flex-1 pb-4 w-full "
          style={{
            maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
          }}
        >
          <div className="w-full max-w-5xl px-2 md:pl-8 flex items-center justify-center mx-auto mb-4 overflow-hidden text-[12px]">
            <div className="w-full space-y-4 pt-3 pb-[200px]">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}


      {/* Chat Input Section */}
      <div
        className={cn(
          // Responsive chat input section
          "mx-auto w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-4xl bg-background px-2 sm:px-4 md:pl-8 flex-shrink-0 min-w-0",
          messages.length > 0 ? "pb-3 fixed bottom-10 md:bottom-0" : "mt-auto"
        )}
      >

        {/* Suggestions */}
        <div
          className={
            cn(
              "hidden md:flex   h-14 flex-row overflow-x-auto gap-4 sm:mt-3 z-10  transition-all duration-200 min-h-[3.5rem]"
            )
          }
        >
          {suggestions?.length > 0 && suggestions.map((suggestion, index) => (
            <Button
              key={index}
              className="rounded-sm text-muted-foreground hover:text-white bg-muted px-4 py-2 text-sm"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>


        {/* Message Input */}
        <div
          className={cn(
            // Responsive message input area
            "bg-background mx-auto border rounded-md px-2 w-full  md:max-w-3xl lg:max-w-4xl xl:max-w-5xl overflow-y-auto relative flex flex-col min-w-0",
            selectedDocuments.length > 0 ? "h-[180px] md:h-[160px]" : "h-[120px] md:h-[100px]",
            "transition-all duration-200"
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isLoading}
            className="rounded-sm  flex-1 text-start p-1  bg-transparent outline-none border-none focus-visible:ring-0 shadow-none font-inter placeholder:text-muted-foreground text-sm md:text-sm disabled:opacity-50 resize-none min-h-[30px] max-h-[40px] w-full"
            placeholder="Ask Gavin a question..."
            style={{ minWidth: 0 }}
          />

          <div className="flex w-full items-center justify-between absolute bottom-0 right-2 px-2 md:px-0">
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
                  <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => { }}>
                    Status Bar
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => { }}>
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
              disabled={isLoading || (!message.trim() && selectedDocuments.length === 0)}
              className="rounded-sm ml-auto justify-self-end text-white hover:text-white bg-foreground hover:bg-gray-600 px-3 md:px-4 mb-1  text-xs md:text-sm disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Ask Gavin"}
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
                size={"lg"}
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
                size={"sm"}
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
                  size={"sm"}
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

type Checked = DropdownMenuCheckboxItemProps["checked"];

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
