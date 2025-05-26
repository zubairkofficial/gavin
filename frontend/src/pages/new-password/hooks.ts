import API from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (
      data: any,
    ) => {
      const response = await API.post('/auth/reset-password', data);
      return response.data;
    },
    onSuccess: (data) => {
      alert(data.message);
      navigate('/');
    },
    onError: (error: string) => {
      toast.error(error);
    },
  });
}