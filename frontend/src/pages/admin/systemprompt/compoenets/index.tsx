"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, AlertCircle } from "lucide-react"
import API from "@/lib/api"

interface SystemPromptManagerProps {
  className?: string
}

export default function SystemPromptManager({ className }: SystemPromptManagerProps) {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch existing prompt on component mount
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        setIsFetching(true)
        setError(null)
        const response = await API.get("get-prompt")

        if (response.data) {
          setPrompt(response.data.systemPrompt[0]?.prompt )
          // console.log("Fetched system prompt:", response.data.systemPrompt)
        }
      } catch (err) {
        console.error("Failed to fetch prompt:", err)
        setError("Failed to load existing prompt")
      } finally {
        setIsFetching(false)
      }
    }

    fetchPrompt()
  }, [])

  // Handle update button click
  const handleUpdate = async () => {
    if (!prompt) {
      setError("Please enter a system prompt")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      const response = await API.post("/set-systemprompt", {
        prompt: prompt,
      })

      if (response.status === 200 || response.status === 201) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000) // Hide success message after 3 seconds
      }
    } catch (err) {
      console.error("Failed to save prompt:", err)
      setError("Failed to save system prompt. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle textarea change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    if (error) setError(null) // Clear error when user starts typing
  }

  return (
    <div className={className}>

        <CardTitle className="  text-center  font-bold text-2xl md:text-3xl mb-2 ">System Prompt Manager</CardTitle>
          <CardDescription className="text-center mb-10">Configure the system prompt that will be used for chat interactions</CardDescription>
      <Card>
        <CardHeader>
          
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Loading state for initial fetch */}
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading prompt...</span>
            </div>
          ) : (
            <>
              {/* Textarea for system prompt */}
              <div className="space-y-2 ">
                <label htmlFor="system-prompt" className="text-base font-semibold">
                  System Prompt
                </label>
                <Textarea
                  id="system-prompt"
                  placeholder="Enter your system prompt here..."
                  value={prompt}
                  onChange={handlePromptChange}
                  rows={8}
                  className="resize-none mt-6"
                />
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>System prompt updated successfully!</AlertDescription>
                </Alert>
              )}

              {/* Update Button */}
              <div className="flex justify-end">
                <Button onClick={handleUpdate} disabled={isLoading || !prompt} className="min-w-[120px]">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
