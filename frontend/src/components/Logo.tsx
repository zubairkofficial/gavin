import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function Logo({className}: {className?: string}) {
  return (
    <Link to="/" className={cn("flex items-center w-full space-x-2 max-w-20", className)}>
      <img className="w-full h-full" src="/logo.svg" alt="Gavin Logo" />
    </Link>
  )
}
