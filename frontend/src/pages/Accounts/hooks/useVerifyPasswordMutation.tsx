import API from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export const useVerifyPasswordMutation = () => {
  return useMutation({
    mutationKey: ["verify-password"],
    mutationFn: async (data: any) => {
      const res = await API.post('/auth/check-reset-code', {
        ...data
      })
      return res
    },
    
    onError: (error: string) => {
      toast.error(error || "An error occurred")
    }
  })
}
