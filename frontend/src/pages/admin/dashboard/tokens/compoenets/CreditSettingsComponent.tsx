"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Coins, Save, Info, AlertCircle, CheckCircle, XCircle, LoaderCircle } from "lucide-react"
import API from "@/lib/api"

export default function CreditSettingsComponent() {
 
  const [creditsPerThousand, setCreditsPerThousand] = useState(1) // Start with 1 credit per 1000 tokens
  const [minimumCredits, setMinimumCredits] = useState(10) // Start with 10 minimum credits
  const [currentCredits] = useState(250)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [loading, setloading] = useState(false)

  const handleCreditsPerThousandChange = (value: number) => {
    const intValue = Math.max(1, Math.floor(value)) // Ensure integer value and minimum of 1
    setCreditsPerThousand(intValue)
  }


  useEffect(()=>{
    // Fetch initial settings from the backend
    const fetchSettings = async () => {
      try {
        const response = await API.get("/chat/get-credits")
        const { cutCredits, minMessages } = response.data
        console.log('Fetched credit settings:', cutCredits, minMessages)
        setCreditsPerThousand(cutCredits )
        setMinimumCredits(minMessages )
      } catch (error) {
        console.error("Failed to fetch credit settings:", error)
      }
    }

    fetchSettings()
  },[])

  // Update the useEffect section to handle the timer
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => {
        setSaveMessage(null);
      }, 3000); // 3 seconds

      // Cleanup timer on unmount or when saveMessage changes
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  const handleSave = async () => {
    console.log('credits per 1000 tokens:', creditsPerThousand, 'min messages:', minimumCredits)
    try {
      await API.post("/chat/manage-credits", {
        cutCreditsPerToken: creditsPerThousand,
        minimumCreditsToSend: minimumCredits,
      })
      setSaveMessage({ type: 'success', text: 'Your credit settings have been updated successfully.' })
      setloading(false)
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    }
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
        
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Token & Credit Settings</CardTitle>
                <CardDescription>Configure your token costs and messaging limits</CardDescription>
              </div>
            </div>
        

        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Configuration</CardTitle>
            <CardDescription>Set up how credits are deducted and minimum requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cut Credits Per 1000 Tokens */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="cutCredits" className="text-base font-medium">
                  Tokens For 1 Credit
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Amount of Tokens for 1 Credit </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Input
                    id="cutCredits"
                    type="number"
                    min="1"
                    step="1"
                    value={creditsPerThousand}
                    onChange={(e) => {
                      const value =Number.parseInt(e.target.value) 
                      handleCreditsPerThousandChange(value)
                    }}
                    className="text-lg"
                    placeholder="e.g., 20, 30, 50"
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Rate: {creditsPerThousand} Tokens for 1 Credit
              </div>
            </div>

            <Separator />

            {/* Minimum Credits */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="minCredits" className="text-base font-medium">
                  Minimum Credits to Send Message
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Minimum credit balance required to send a message</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Input
                    id="minCredits"
                    type="number"
                    min="1"
                    value={minimumCredits}
                    onChange={(e) => setMinimumCredits(Number.parseInt(e.target.value) )}
                    className="text-lg"
                  />
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {currentCredits >= minimumCredits ? `✓ User can send messages (${currentCredits} ≥ ${minimumCredits})` : `✓ User can send messages (${currentCredits} ≥ ${minimumCredits})`
                   }
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardFooter className="flex flex-col items-center space-y-4">
            {saveMessage && (
              <Alert className={saveMessage.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                {saveMessage.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={saveMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                  {saveMessage.text}
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={() => { handleSave(); setloading(true); }} className="px-8">
              {loading ? (<> <LoaderCircle className="animate-spin w-4 h-4 mr-2"/>Saving...</>):(<><Save className="h-4 w-4 mr-2" />Save Settings</> )}
              
            </Button>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  )
}