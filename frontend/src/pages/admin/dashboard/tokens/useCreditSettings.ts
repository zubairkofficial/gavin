import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import API from '@/lib/api'

interface CreditSettings {
  cutCredits: number
  minMessages: number
}

interface UpdateCreditSettingsPayload {
  cutCreditsPerToken: number
  minimumCreditsToSend: number
}

export const useCreditSettings = () => {
  const queryClient = useQueryClient()

  // Query for fetching credit settings
  const { 
    data: settings, 
    isLoading: isLoadingSettings,
    error: fetchError 
  } = useQuery<CreditSettings>({
    queryKey: ['credit-settings'],
    queryFn: async () => {
      const response = await API.get("/config/get-credits")
      if (!response.status || response.status >= 300) {
        throw new Error('Failed to fetch credit settings')
      }
      return response.data
    }
  })

  // Mutation for updating credit settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: UpdateCreditSettingsPayload) => {
      const response = await API.post("/config/manage-credits", payload)
      if (!response.status || response.status >= 300) {
        throw new Error('Failed to update credit settings')
      }
      return response.data
    },
    onSuccess: () => {
      // Invalidate and refetch credit settings after successful update
      queryClient.invalidateQueries({ queryKey: ['credit-settings'] })
    }
  })

  return {
    settings,
    isLoadingSettings,
    fetchError,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
    updateError: updateSettingsMutation.error,
    isSuccess: updateSettingsMutation.isSuccess
  }
}
