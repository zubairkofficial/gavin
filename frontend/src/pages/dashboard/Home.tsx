import { useState } from "react";
import Chat from "./components/Chat";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import './chat.css'




export default function Home() {



  const [messages, setMessages] = useState<any>([]);
  const isMobile = useIsMobile()

  return (
    <main className="h-[86vh] w-full mx-auto    flex flex-col items-center">
      <div className="flex-1 flex flex-col items-center  w-full font-inter overflow-y-auto scrollbar-left-0 custom-scrollbar-left">
        {!messages.length && (
          <div className="flex-1 md:flex-none flex flex-col h-[50vh] items-center justify-center">
            <h1 className="mb-8 text-center px-8 text-5xl  font-bold tracking-tight font-lora">What do you want to know?</h1>
          </div>
        )}
        <Chat messages={messages} setMessages={setMessages} />
      </div>
      <footer className="fixed bottom-2 md:bottom-0 mt-auto bg-gray-50  px-8 text-center text-xs text-muted-foreground">
        Free Research Preview. Bot Buzz may produce inaccurate information about people, places, or facts. Gavin 1.0
      </footer>
    </main>
  )
}

