"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { UsersResponse, UsersFilters } from "./types"
import API from "@/lib/api"

export function useUsersQuery(filters: UsersFilters) {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: async (): Promise<UsersResponse> => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const response = await API.get(`/auth/users?${params.toString()}`)
      if (response.status !== 200) {
        throw new Error("Failed to fetch users")
      }
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) => {
      return API.post(`/auth/users/toggle-status`, { userId })
    },
    onSuccess: () => {
      // Invalidate and refetch users data
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}
