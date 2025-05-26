import API from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export const useRegisterMutation = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationKey: ["register"],
    mutationFn: async (data: any) => {
      const res = await API.post('/auth/register', {
        ...data
      })
      return res
    },
    onSuccess: () => {
      toast.success("Registration successful. Please, check your email inbox for email verification.") 
      navigate("/")
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "An error occurred")
    }
  })
}

export const useRegisterOrgUserMutation = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationKey: ["register-org"],
    mutationFn: async (data: any) => {
      const res = await API.post('/auth/register-invite', {
        ...data
      })
      return res
    },
    onSuccess: (data) => {
      toast.success(data?.data?.message || "Registration successful. Please, check your email inbox for email verification.") 
      navigate("/")
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "An error occurred")
    }
  })
}
