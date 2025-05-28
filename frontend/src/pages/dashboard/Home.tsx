import { useState } from "react";
import Chat from "./components/Chat";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [messages, setMessages] = useState<any>([]);
  const isMobile = useIsMobile()

  return (
    <main className="container h-[86vh] max-w-7xl mx-auto py-6 md:space-y-8 space-y-4 flex flex-col items-center justify-center">
      <div className={cn("flex-1 flex flex-col items-center font-inter", messages.length ? "" : "justify-center", isMobile && "flex-1")}>
        {!messages.length && (
          <div className="flex-1 md:flex-none flex flex-col items-center justify-center">
            <h1 className="mb-8 text-center px-8 text-5xl font-bold tracking-tight font-lora">What do you want to know?</h1>
          </div>
        )}
        <Chat messages={messages} setMessages={setMessages} />
      </div>
      <footer className="fixed bottom-2 md:bottom-0 mt-auto px-8 text-center text-xs text-muted-foreground">
        Free Research Preview. Bot Buzz may produce inaccurate information about people, places, or facts. Gavin 1.0
      </footer>
    </main>
  )
}

