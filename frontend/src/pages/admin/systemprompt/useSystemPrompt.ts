import { useState } from 'react'
import API from "@/lib/api"

interface UseSystemPromptReturn {
  prompt: string
  setPrompt: (value: string) => void
  isLoading: boolean
  isFetching: boolean
  error: string | null
  success: boolean
  fetchPrompt: () => Promise<void>
  updatePrompt: (newPrompt: string) => Promise<void>
}

export function useSystemPrompt(): UseSystemPromptReturn {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchPrompt = async () => {
    try {
      setIsFetching(true)
      setError(null)
      const response = await API.get("config/get-prompt")

      if (response.data) {
        setPrompt(response.data.systemPrompt[0]?.prompt)
      }
    } catch (err) {
      console.error("Failed to fetch prompt:", err)
      setError("Failed to load existing prompt")
    } finally {
      setIsFetching(false)
    }
  }

  const updatePrompt = async (newPrompt: string) => {
    if (!newPrompt) {
      setError("Please enter a system prompt")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      const response = await API.post("config/set-systemprompt", {
        prompt: newPrompt,
      })

      if (response.status === 200 || response.status === 201) {
        setSuccess(true)
        setPrompt(newPrompt)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      console.error("Failed to save prompt:", err)
      setError("Failed to save system prompt. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    prompt,
    setPrompt,
    isLoading,
    isFetching,
    error,
    success,
    fetchPrompt,
    updatePrompt
  }
}
