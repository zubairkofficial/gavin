import API from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useNewPassword() {

  return useMutation({
    mutationFn: async (
      data: any,
    ) => {
      const response = await API.post('/auth/reset-password', data);
      return response.data;
    },
    
    onError: (error: string) => {
      toast.error(error);
    },
  });
}