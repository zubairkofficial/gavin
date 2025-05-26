import API from "@/lib/api"
import { updateUserInfo } from "@/lib/utils"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export const useUpdateProfileMutation = () => {
    const navigate = useNavigate();
    return useMutation({
        mutationKey: ["update-user"],
        mutationFn: async (payload: any) => {
            const res = await API.post('/auth/user/update', payload)
            return res
        },
        onSuccess: (_, variables) => {
            updateUserInfo(variables)
            toast.success("Profile Successfully Updated.")
            navigate("/")
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(error.response?.data?.message || error.response?.data?.message[0] || "Error updating profile")
        }
    })
}


