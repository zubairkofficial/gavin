"use client"

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
} from "lucide-react"
import type { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"

import { Swiper, SwiperSlide } from "swiper/react"
import { Mousewheel, Navigation, Scrollbar } from "swiper/modules"
// @ts-ignore
import "swiper/css"
// @ts-ignore
import "swiper/css/navigation"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const documents = [
  { id: "1", title: "My list.doc", type: "Document" },
  { id: "2", title: "My list.doc", type: "Document" },
  { id: "3", title: "My list.doc", type: "Document" },
  { id: "4", title: "My list.doc", type: "Document" },
  { id: "5", title: "My list.doc", type: "Document" },
]

const Chat = ({ messages, setMessages }: { messages: any; setMessages: any }) => {
  const [message, setMessage] = useState<string>("")
  const isMobile = useIsMobile()

  return (
    <div className={cn("w-full flex flex-col  m-0 p-0", messages.length > 0 ? "h-[87vh] " : "")}>
      {/* Messages Section */}
{messages.length > 0 && (
  <div
    className="flex-1 overflow-y-auto pb-4"
    style={{
      maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
    }}
  >
    <div className="md:max-w-[950px] px-2 md:pl-8 flex items-center justify-center mx-auto mb-4 overflow-hidden text-[12px]">
      <div className="w-full space-y-4 pt-6 md:pt-12 ">
        {/* Question */}
        <div className="flex justify-end">
          <div className="bg-gray-200 rounded-lg px-3 md:px-4 py-2 max-w-[80%] md:max-w-md">
            <p className="text-gray-800 text-sm md:text-sm">Is a non-compete clause enforceable</p>
          </div>
        </div>

        {/* Answer  */}
        <div className="rounded-lg py-4 md:py-6">
          <div className="space-y-3 md:space-y-4">
            <p className="text-gray-800 text-sm md:text-sm">
              No, non-compete clauses are generally unenforceable in California, including for independent
              contractors.{" "}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-6 md:h-7 px-1.5 md:px-2 py-1 text-xs bg-white border-gray-200 text-gray-800 hover:bg-gray-900 hover:text-white data-[state=open]:text-white data-[state=open]:bg-gray-800"
                  >
                    Microsoft Inc
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="w-72 md:w-80 p-0 bg-white rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-center p-2 border-b border-gray-100">
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">1/2</div>
                  </div>

                  <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                    <DropdownMenuItem className="flex items-center px-2 py-1 cursor-pointer focus:bg-gray-50">
                      <div className="flex items-center">
                        <div className="h-2 w-2 bg-black rounded-full mr-2"></div>
                        <span>Microsoft Inc</span>
                      </div>
                    </DropdownMenuItem>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesen met - Microsoft
                      </p>
                      <p className="text-xs text-gray-500">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent quam ligula, cursus quis
                        luctus at, malesuada sit amet
                      </p>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </p>
            <p className="text-gray-800 text-sm md:text-sm">
              Pursuant to California Business and Professions Code § 16600, "every contract by which anyone is
              restrained from engaging in a lawful profession{" "}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-6 md:h-7 px-1.5 md:px-2 py-1 text-xs bg-white border-gray-200 text-gray-800 hover:bg-gray-900 hover:text-white data-[state=open]:text-white data-[state=open]:bg-gray-800"
                  >
                    Microsoft Inc
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="w-72 md:w-80 p-0 bg-white rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-center p-2 border-b border-gray-100">
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">1/2</div>
                  </div>

                  <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                    <DropdownMenuItem className="flex items-center px-2 py-1 cursor-pointer focus:bg-gray-50">
                      <div className="flex items-center">
                        <div className="h-2 w-2 bg-black rounded-full mr-2"></div>
                        <span>Microsoft Inc</span>
                      </div>
                    </DropdownMenuItem>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesen met - Microsoft
                      </p>
                      <p className="text-xs text-gray-500">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent quam ligula, cursus quis
                        luctus at, malesuada sit amet
                      </p>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </p>
            <p className="text-gray-800 text-sm md:text-sm">
              Pursuant to California Business and Professions Code § 16600, "every contract by which anyone is
              restrained from engaging in a lawful profession, trade, or business of any kind is to that extent
              void." This provision applies broadly to both employees and independent contractors.
            </p>
            <p className="text-gray-800 text-sm md:text-sm">
              California courts have consistently declined to enforce non-compete clauses, except in narrow
              circumstances involving the sale of a business.{" "}
              <DropdownMenu>
                <DropdownMenuTrigger className="group" asChild>
                  <Button
                    variant="outline"
                    className="h-6 md:h-7 px-1.5 md:px-2 py-1 text-xs bg-white border-gray-200 text-gray-800 hover:bg-gray-900 hover:text-white data-[state=open]:text-white data-[state=open]:bg-gray-800"
                  >
                    Apple Inc
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="w-72 md:w-80 p-0 bg-white rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-center p-2 border-b border-gray-100">
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">1/2</div>
                  </div>

                  <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                    <DropdownMenuItem className="flex items-center px-2 py-1 cursor-pointer focus:bg-gray-50">
                      <div className="flex items-center">
                        <div className="h-2 w-2 bg-black rounded-full mr-2"></div>
                        <span>Apple Inc</span>
                      </div>
                    </DropdownMenuItem>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesen met - Apple
                      </p>
                      <p className="text-xs text-gray-500">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent quam ligula, cursus quis
                        luctus at, malesuada sit amet
                      </p>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </p>
          </div>

          {/* Action buttons - made fully rounded with backgrounds */}
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
        {/* Question */}
        <div className="flex justify-end">
          <div className="bg-gray-200 rounded-lg px-3 md:px-4 py-2 max-w-[80%] md:max-w-md">
            <p className="text-gray-800 text-sm md:text-sm">Is a non-compete clause enforceable</p>
          </div>
        </div>

        {/* Answer  */}
        <div className="rounded-lg py-4 md:py-6">
          <div className="space-y-3 md:space-y-4">
            <p className="text-gray-800 text-sm md:text-sm">
              No, non-compete clauses are generally unenforceable in California, including for independent
              contractors.{" "}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-6 md:h-7 px-1.5 md:px-2 py-1 text-xs bg-white border-gray-200 text-gray-800 hover:bg-gray-900 hover:text-white data-[state=open]:text-white data-[state=open]:bg-gray-800"
                  >
                    Microsoft Inc
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="w-72 md:w-80 p-0 bg-white rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-center p-2 border-b border-gray-100">
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">1/2</div>
                  </div>

                  <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                    <DropdownMenuItem className="flex items-center px-2 py-1 cursor-pointer focus:bg-gray-50">
                      <div className="flex items-center">
                        <div className="h-2 w-2 bg-black rounded-full mr-2"></div>
                        <span>Microsoft Inc</span>
                      </div>
                    </DropdownMenuItem>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesen met - Microsoft
                      </p>
                      <p className="text-xs text-gray-500">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent quam ligula, cursus quis
                        luctus at, malesuada sit amet
                      </p>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </p>
            <p className="text-gray-800 text-sm md:text-sm">
              Pursuant to California Business and Professions Code § 16600, "every contract by which anyone is
              restrained from engaging in a lawful profession{" "}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-6 md:h-7 px-1.5 md:px-2 py-1 text-xs bg-white border-gray-200 text-gray-800 hover:bg-gray-900 hover:text-white data-[state=open]:text-white data-[state=open]:bg-gray-800"
                  >
                    Microsoft Inc
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="w-72 md:w-80 p-0 bg-white rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-center p-2 border-b border-gray-100">
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">1/2</div>
                  </div>

                  <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                    <DropdownMenuItem className="flex items-center px-2 py-1 cursor-pointer focus:bg-gray-50">
                      <div className="flex items-center">
                        <div className="h-2 w-2 bg-black rounded-full mr-2"></div>
                        <span>Microsoft Inc</span>
                      </div>
                    </DropdownMenuItem>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesen met - Microsoft
                      </p>
                      <p className="text-xs text-gray-500">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent quam ligula, cursus quis
                        luctus at, malesuada sit amet
                      </p>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </p>
            <p className="text-gray-800 text-sm md:text-sm">
              Pursuant to California Business and Professions Code § 16600, "every contract by which anyone is
              restrained from engaging in a lawful profession, trade, or business of any kind is to that extent
              void." This provision applies broadly to both employees and independent contractors.
            </p>
            <p className="text-gray-800 text-sm md:text-sm">
              California courts have consistently declined to enforce non-compete clauses, except in narrow
              circumstances involving the sale of a business.{" "}
              <DropdownMenu>
                <DropdownMenuTrigger className="group" asChild>
                  <Button
                    variant="outline"
                    className="h-6 md:h-7 px-1.5 md:px-2 py-1 text-xs bg-white border-gray-200 text-gray-800 hover:bg-gray-900 hover:text-white data-[state=open]:text-white data-[state=open]:bg-gray-800"
                  >
                    Apple Inc
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="w-72 md:w-80 p-0 bg-white rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-center p-2 border-b border-gray-100">
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">1/2</div>
                  </div>

                  <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                    <DropdownMenuItem className="flex items-center px-2 py-1 cursor-pointer focus:bg-gray-50">
                      <div className="flex items-center">
                        <div className="h-2 w-2 bg-black rounded-full mr-2"></div>
                        <span>Apple Inc</span>
                      </div>
                    </DropdownMenuItem>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesen met - Apple
                      </p>
                      <p className="text-xs text-gray-500">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent quam ligula, cursus quis
                        luctus at, malesuada sit amet
                      </p>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </p>
          </div>

          {/* Action buttons - made fully rounded with backgrounds */}
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
      </div>
    </div>
  </div>
)}


      {/* Gradiant Section */}

      {/* Chat Input Section */}
      <div
        className={cn(
            "mx-auto w-full max-w-5xl bg-background px-2 md:pl-8 flex-shrink-0 relative ",
            messages.length > 0
            ? "pb-10" // Simple bottom padding when messages exist
            : "mt-auto", // Keep original styling when no messages
        )}
      >
        {/* <div className="   absolute mx-auto w-full md:max-w-4xl h-15 bg-[linear-gradient(180deg,_rgba(250,251,253,0.2)_0%,_rgba(250,251,253,1)_100%)]  pointer-events-none"></div> */}

        {/* Suggestions */}
        <div className="mb-4 hidden md:flex flex-wrap gap-2 sm:mt-3 z-10 ">
          <Button className="rounded-sm text-muted-foreground hover:text-white bg-muted px-4 py-2 text-sm">
            What's your checklist for incorporating a new startup?
          </Button>
          <Button className="rounded-sm text-muted-foreground hover:text-white bg-muted px-4 py-2 text-sm">
            When should you recommend arbitration vs. litigation?
          </Button>
        </div>

        {/* Message Input */}
        <div className="bg-background mx-auto border rounded-md p-2 max-w-[95vw] md:max-w-[635px] lg:max-w-full h-[180px] md:h-[160px] overflow-y-auto relative flex flex-col">
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

              {documents.map((doc) => (
                <SwiperSlide key={doc.id} className="max-w-28 md:max-w-32 lg:max-w-56 py-2 group">
                  <Button className="rounded-sm text-foreground bg-transparent hover:bg-transparent border w-full !px-1.5 md:!px-2 pe-3 md:pe-4 py-2 h-10 md:h-12 text-xs md:text-sm flex justify-start">
                    <FileText className="!w-5 !h-5 md:!w-7 md:!h-7 flex-shrink-0" />
                    <div className="flex flex-col items-start min-w-0">
                      <h3 className="text-xs md:text-sm font-normal truncate w-full">My list.doc</h3>
                      <p className="text-xs font-light text-muted-foreground">Document</p>
                    </div>
                  </Button>
                  <button className="block md:hidden group-hover:block absolute -top-0 -right-1 bg-black rounded-full p-1 z-10 cursor-pointer">
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

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-sm mb-7 flex-1 text-start  px-1 py-2 bg-transparent outline-none border-none focus-visible:ring-[0px] shadow-none font-inter placeholder:text-muted-foreground text-sm md:text-sm"
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

              <input id="file-input" type="file" className="hidden" />
              <label
                htmlFor="file-input"
                className="rounded-sm cursor-pointer text-muted-foreground hover:text-foreground bg-transparent border px-2.5 md:px-3 py-2 md:py-[10px] text-xs md:text-sm"
              >
                <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
              </label>
            </div>

            <Button
              onClick={() => setMessages([...messages, { role: "user", content: message }])}
              className="rounded-sm ml-auto justify-self-end text-white hover:text-white bg-foreground hover:bg-gray-600 px-3 md:px-4 py-2 text-xs md:text-sm"
            >
              Ask Gavin
            </Button>
          </div>
        </div>

        {/* Document upload and knowledge source */}
        <div className="hidden md:flex md:flex-row py-3 items-stretch sm:items-center justify-between gap-3 sm:gap-0">
          <input id="file-input-desktop" type="file" className="hidden" />
          <label
            htmlFor="file-input-desktop"
            className="rounded-sm text-foreground hover:bg-primary cursor-pointer hover:text-white bg-white border px-2 pe-3 md:pe-4 py-2.5 md:py-3 h-[unset] text-xs md:text-sm flex items-center gap-2"
          >
            <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-muted-foreground">
              <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="flex flex-col items-start">
              <h3 className="font-medium text-xs md:text-sm">Attach doc or PDF</h3>
              <p className="text-xs text-muted-foreground hidden sm:block">Choose files from your computer</p>
            </div>
          </label>

          <DropdownMenuCheckboxes />
        </div>
      </div>
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
