import { BookIcon, Paperclip, ChevronDownIcon, FileText, ChevronRight, X } from "lucide-react"
import { type DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent, DropdownMenuTrigger
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


const documents = ([
    { id: "1", title: "My list.doc", type: "Document" },
    { id: "2", title: "My list.doc", type: "Document" },
    { id: "3", title: "My list.doc", type: "Document" },
    { id: "4", title: "My list.doc", type: "Document" },
    { id: "5", title: "My list.doc", type: "Document" },
])


const Chat = ({ messages, setMessages }: { messages: any, setMessages: any }) => {
    const [message, setMessage] = useState<string>("");
    const isMobile = useIsMobile()

    return (
        <div className={cn("mx-auto w-full max-w-4xl mt-auto md:mt-4 md:px-8", messages.length ? "mt-auto" : "")}>
            {/* Suggestions */}
            <div className="mb-4 hidden md:flex flex-wrap gap-2">
                <Button className="rounded-sm text-muted-foreground hover:text-white bg-muted px-4 py-2 text-sm">
                    What's your checklist for incorporating a new startup?
                </Button>
                <Button className="rounded-sm text-muted-foreground hover:text-white bg-muted px-4 py-2 text-sm">
                    When should you recommend arbitration vs. litigation?
                </Button>
            </div>
            {/* Message Input */}
            <div className="mx-auto border rounded-md p-2 max-w-[93vw] md:max-w-[635px] lg:max-w-full min-h-33 md:max-h-40 overflow-y-auto h-full relative flex flex-col">
                <div className="">
                    <Swiper
                        modules={[Navigation, Scrollbar, Mousewheel]}
                        spaceBetween={isMobile ? 8 : 10}
                        navigation={{
                            nextEl: ".swiper-button-next",
                        }}
                        className="relative"
                        scrollbar={{ draggable: true }}
                        mousewheel={{ forceToAxis: true }}
                    >
                        {documents.map((doc) => (
                            <SwiperSlide key={doc.id} className="max-w-32 md:max-w-56 py-2 group">
                                <Button className="rounded-sm text-foreground bg-transparent hover:bg-transparent border w-full !px-2 pe-4 py-2 h-12 text-sm flex justify-start">
                                    <FileText className="!w-7 !h-7" />
                                    <div className="flex flex-col items-start">
                                        <h3 className="text-sm font-normal">My list.doc</h3>
                                        <p className="text-xs font-light text-muted-foreground">Document</p>
                                    </div>

                                </Button>
                                <button
                                    className="md:hidden group-hover:block absolute -top-0 -right-1 bg-black rounded-full p-1 z-10 cursor-pointer"
                                >
                                    <X className="h-3 w-3 text-white" />
                                </button>
                            </SwiperSlide>
                        ))}
                        <div className="absolute top-0 right-0 mx-auto w-48 h-full bg-[linear-gradient(90deg,_rgba(250,251,253,0)_38%,_rgba(250,251,253,1)_100%)] z-10"></div>
                        <div className="swiper-button-next absolute right-0 top-1/2 transform  z-10 after:!content-none">
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-black hover:bg-transparent">
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </Swiper>
                </div>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="rounded-sm mb-7 flex-1 text-start px-1 py-2 bg-transparent outline-none border-none focus-visible:ring-[0px] shadow-none font-inter placeholder:text-muted-foreground" placeholder="Ask Gavin a question..." />
                <div className="flex w-[96%] items-center justify-between absolute bottom-2 right-2">
                    <div className="md:hidden flex items-center gap-2 mr-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="rounded-sm text-muted-foreground hover:text-foreground bg-transparent border px-2 pe-4 py-3 h-[unset] text-sm">
                                    <BookIcon className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="top" className="w-72">
                                <DropdownMenuCheckboxItem
                                    checked={false}
                                    onCheckedChange={() => {}}
                                >
                                    Status Bar
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={false}
                                    onCheckedChange={() => {}}
                                >
                                    Panel
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <input id="file-input" type="file" className="hidden" />
                        <label htmlFor="file-input" className="rounded-sm cursor-pointer text-muted-foreground hover:text-foreground bg-transparent border px-3 py-[10px] text-sm">
                            <Paperclip className="w-5 h-5" />
                        </label>
                    </div>
                    <Button onClick={() => setMessages([...messages, { role: "user", content: message }])} className="rounded-sm md:ml-auto justify-self-end text-white hover:text-foreground bg-foreground px-4 py-2 text-sm">
                        Ask Gavin
                    </Button>
                </div>
            </div>
            {/* Document upload and knowledge source */}
            <div className="hidden  md:flex py-3 items-center justify-between">
                <input id="file-input" type="file" className="hidden" />
                <label htmlFor="file-input" className="rounded-sm text-foreground hover:bg-primary cursor-pointer hover:text-white bg-white border px-2 pe-4 py-3 h-[unset] text-sm flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
                        <Paperclip className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-start">
                        <h3 className="font-medium text-sm">Attach doc or PDF</h3>
                        <p className="text-xs text-muted-foreground">Choose files from your computer</p>
                    </div>
                </label>

                <DropdownMenuCheckboxes />
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
            <DropdownMenuTrigger className="rounded-sm text-foreground cursor-pointer bg-white border px-2 pe-4 py-3 h-[unset] text-sm w-72 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
                        <BookIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-start">
                        <h3 className="font-medium text-sm">Choose Knowledge Source</h3>
                        <p className="text-xs text-muted-foreground">EDGAR, EUR-Lex and more</p>
                    </div>
                </div>
                <div>
                    <ChevronDownIcon className="w-4 h-4" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72">
                <DropdownMenuCheckboxItem
                    checked={showStatusBar}
                    onCheckedChange={setShowStatusBar}
                >
                    Status Bar
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={showPanel}
                    onCheckedChange={setShowPanel}
                >
                    Panel
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


export default Chat