import API from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export const useVerifyEmailMutation = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationKey: ["verify-email"],
    mutationFn: async (data: any) => {
      const res = await API.get('/auth/verify-email', {
        params: data
      })
      return res
    },
    onSuccess: ({data}) => {
      toast.success(data?.message || "Email verified successfully.") 
      navigate("/")
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "An error occurred")
    }
  })
}



export const useResendEmailVerificationMutation = () => {
  return useMutation({
    mutationFn: async ({email}: {email: string}) => {
      const response = await API.get('/auth/send-email-verification', {
        params: {
          email
        }
      })

      return response.data
    },
    onSuccess: ({data}) => {
      toast(data?.message || "A new verification code has been sent to your email.")
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast(error.response?.data?.message || "Failed to resend code. Please try again.")
    },
  })
}
