import { useAuth } from "@/context/Auth.context"
import API from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export const useLoginMutation = () => {
  const { onAuth } = useAuth();
  const navigate = useNavigate();
  return useMutation({
    mutationKey: ["login"],
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
        const res = await API.post('/auth/login', {
            email,
            password,
            rememberMe: true
        })
        return res
      },
    onSuccess: (res) => {
      onAuth(res.data?.token, res.data?.user)
      navigate("/")
      toast.success("Login successful") 
    },
    onError: (error: string, {email}) => {
      console.log(error, "error")
      if (error === "Email not verified") {
        navigate("/verify-email", { state: { email } })
      }
      toast.error(error || "Please check your credentials and try again.")
    }
  })
}

export const useGoogleLoginMutation = () => {
  const { onAuth } = useAuth();
  const navigate = useNavigate();
  return useMutation({
    mutationKey: ["google-login"],
    mutationFn: async ({ token }: { token: string }) => {
        const res = await API.post('/auth/login-google', {
            token,
        })
        return res
      },
    onSuccess: (res) => {
      onAuth(res.data?.token, res.data?.user)
      navigate(0)
      toast.success("Login successful") 
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || error.response?.data?.message[0] || "Please check your credentials and try again.")
    }
  })
}


