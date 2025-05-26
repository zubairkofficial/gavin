import { useState } from "react";
import Chat from "./components/Chat";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [messages, setMessages] = useState<any>([]);
  const isMobile = useIsMobile()

  return (
    <main className="container h-full max-w-7xl mx-auto py-6 md:space-y-8 space-y-4 flex flex-col items-center justify-center">
      <div className={cn("flex-1 flex flex-col items-center font-inter", messages.length ? "" : "justify-center", isMobile && "flex-1")}>
        {
          messages.length ? (
            <div className="md:max-w-[850px] px-4 flex items-center justify-center">
              <div className="w-full space-y-4">
                {/* Question */}
                <div className="flex justify-end">
                  <div className="bg-gray-200 rounded-lg py-2 px-4 max-w-md">
                    <p className="text-gray-800">Is a non-compete clause enforceable</p>
                  </div>
                </div>

                {/* Answer - removed bg-white as requested */}
                <div className="rounded-lg py-6">
                  <div className="space-y-4">
                    <p className="text-gray-800">
                      No, non-compete clauses are generally unenforceable in California, including for independent contractors.{" "}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-7 px-2 py-1 text-xs bg-white border-gray-200 text-gray-800 hover:bg-gray-900 hover:text-white data-[state=open]:text-white data-[state=open]:bg-gray-800"
                          >
                            Microsoft Inc
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="start"  className="w-80 p-0 bg-white rounded-lg shadow-md">
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

                          <div className="p-4 space-y-4">
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
                    <p className="text-gray-800">
                      Pursuant to California Business and Professions Code § 16600, "every contract by which anyone is
                      restrained from engaging in a lawful profession{" "}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-7 px-2 py-1 text-xs bg-white border-gray-200 text-gray-800 hover:bg-gray-900 hover:text-white data-[state=open]:text-white data-[state=open]:bg-gray-800"
                          >
                            Microsoft Inc
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="start"  className="w-80 p-0 bg-white rounded-lg shadow-md">
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

                          <div className="p-4 space-y-4">
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
                    <p className="text-gray-800">
                      Pursuant to California Business and Professions Code § 16600, "every contract by which anyone is
                      restrained from engaging in a lawful profession, trade, or business of any kind is to that extent void."
                      This provision applies broadly to both employees and independent contractors.
                    </p>
                    <p className="text-gray-800">
                      California courts have consistently declined to enforce non-compete clauses, except in narrow
                      circumstances involving the sale of a business.{" "}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="group" asChild>
                          <Button
                            variant="outline"
                            className="h-7 px-2 py-1 text-xs bg-white border-gray-200 text-gray-800 hover:bg-gray-900 hover:text-white data-[state=open]:text-white data-[state=open]:bg-gray-800"
                          >
                            Apple Inc
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="start" className="w-80 p-0 bg-white rounded-lg shadow-md">
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

                          <div className="p-4 space-y-4">
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
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white text-gray-600 hover:bg-gray-200"
                    >
                      <ThumbsUp className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white text-gray-600 hover:bg-gray-200"
                    >
                      <ThumbsDown className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white text-gray-600 hover:bg-gray-200"
                    >
                      <Copy className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white text-gray-600 hover:bg-gray-200"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          ) : (
            <div className="flex-1 md:flex-none flex flex-col items-center justify-center">
             <h1 className="mb-8 text-center px-8 text-5xl font-bold tracking-tight font-lora">What do you want to know?</h1>
            </div>
          )
        }
        <Chat messages={messages} setMessages={setMessages} />
      </div>
      <footer className="mt-auto px-8  text-center text-xs text-muted-foreground">
        Free Research Preview. Bot Buzz may produce inaccurate information about people, places, or facts. Gavin 1.0
      </footer>
    </main>
  )
}
