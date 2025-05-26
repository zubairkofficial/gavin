"use client"

import { useState } from "react"
import { ChevronDown, Paperclip, Book } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function DocumentUpload() {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedSources, setSelectedSources] = useState({
    "EDGAR (SEC Filings)": false,
    PACER: true,
    "CourtListener / RECAP Archive": false,
    WebSearch: true,
  })

  const toggleSource = (source: string) => {
    setSelectedSources({
      ...selectedSources,
      [source]: !selectedSources[source as keyof typeof selectedSources],
    })
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 max-w-3xl mx-auto">
      {/* Attach doc or PDF button */}
      <Card className="w-full md:w-60 hover:bg-accent transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
            <Paperclip className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Attach doc or PDF</h3>
            <p className="text-xs text-muted-foreground">Choose files from your computer</p>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge source dropdown */}
      <div className="w-full md:w-96">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start p-4 h-auto hover:bg-accent"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
                    <Book className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-sm">Choose knowledge source</h3>
                    <p className="text-xs text-muted-foreground">EDGAR, EUR-Lex and more</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
          </Card>

          <CollapsibleContent>
            <Card className="mt-1 shadow-sm">
              <CardContent className="p-2">
                {Object.entries(selectedSources).map(([source, isSelected]) => (
                  <div
                    key={source}
                    className="flex items-center space-x-3 p-2 hover:bg-accent rounded cursor-pointer"
                    onClick={() => toggleSource(source)}
                  >
                    <Checkbox
                      id={source}
                      checked={isSelected}
                      onCheckedChange={() => toggleSource(source)}
                    />
                    <label
                      htmlFor={source}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {source}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}