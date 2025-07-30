"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import API from "@/lib/api"
import { useNavigate } from "react-router-dom"

// Types for the conversation data
export interface Conversation {
  conversationid: string
  title: string
  createdat: string
  updatedat: string
  // Add other properties as needed based on your API response
}

export interface ConversationsResponse {
  conversations: Conversation[]
  total: number
  // Add other response properties as needed
}

export function useConversationsQuery() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async (): Promise<ConversationsResponse> => {
      const response = await API.get('/chat/user-conversations')
      return response.data
    },
  })
}

export function useCreateConversationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ title, message }: { title?: string; message?: string }) => {
      const response = await API.post('/chat/conversations', { title, message })
      if (response.status !== 200 && response.status !== 201) {
        console.log(response.data)
        throw new Error("Failed to create conversation")
      }
      console.log(response.data)
      return response.data
    },
    onSuccess: () => {
      // Refetch conversations immediately for sidebar update
      queryClient.refetchQueries({ queryKey: ["conversations"] })
    },
  })
}

export function useUpdateConversationTitleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId, title }: { conversationId: string; title: string }) => {
      const response = await API.post(`/chat/update-title/${conversationId}`, { title })
      if (response.status >= 300) {
        throw new Error("Failed to update conversation title")
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })
}

export function useDeleteConversationMutation() {
  const queryClient = useQueryClient()

  const navigate = useNavigate()
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await API.post(`/chat/delete/${conversationId}`)
      if (response.status >= 300) {
        throw new Error("Failed to delete conversation")
      }
      return response.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] })
      navigate("/", {
        replace: true, // Replace the current entry in the history stack  
      })
    },
    onError: (error: any) => {
      console.error("Error deleting conversation:", error)
    },
  })
}