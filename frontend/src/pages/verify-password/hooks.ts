import API from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export const useVerifyPasswordMutation = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationKey: ["verify-password"],
    mutationFn: async (data: any) => {
      const res = await API.post('/auth/check-reset-code', {
        ...data
      })
      return res
    },
    onSuccess: (_, {code}) => {
      navigate("/new-password", { state: { code } })
    },
    onError: (error: string) => {
      toast.error(error || "An error occurred")
    }
  })
}
