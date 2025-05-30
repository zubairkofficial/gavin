import API from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useForgotPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationKey: ["forgotPassword"],
    mutationFn: async (data: any) => {
      const response = await API('/auth/request-reset-password', {
        params: data,
      });
      return response.data;
    },
    onSuccess: (data, {email}) => {
      toast.success(data?.message || "A new password reset code has been sent to your email.")
    },
    onError: (error: string) => {
      toast.error(error);
    },
  });
}