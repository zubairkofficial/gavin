"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import API from "@/lib/api"

// Types for the conversation data
export interface Conversation {
  conversationid: string
  title: string
  createdAt: string
  updatedAt: string
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
      console.log(response)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      // Invalidate and refetch conversations data
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })
}

export function useDeleteConversationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      const response = await API.delete(`/chat/conversations/${conversationId}`)
      if (response.status !== 200) {
        throw new Error("Failed to delete conversation")
      }
      return response.data
    },
    onSuccess: () => {
      // Invalidate and refetch conversations data
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })
}