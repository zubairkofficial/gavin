import { useMutation, useQuery } from '@tanstack/react-query'
import API from '@/lib/api'
import { toast } from 'sonner'

interface UploadDocumentPayload {
  formData: FormData;
}

interface Jurisdiction {
  id: number;
  jurisdiction: string;
  created_at: string;
}

export const useUploadDocument = () => {
  return useMutation<any, Error, UploadDocumentPayload>({
    mutationFn: async ({ formData }) => {
      const response = await API.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      });
      return response.data;
    },
    onError: (error: any) => {
      console.log("Error uploading document:", error);
      const message =
        error?.response?.data?.message ||
        error || 
        "An unknown error occurred while uploading the document.";
      toast.error(message);
    },
  });
};

export const useJurisdictions = () => {
  return useQuery<Jurisdiction[]>({
    queryKey: ['jurisdictions'],
    queryFn: async () => {
      const response = await API.get("/jurisdictions");
      return response.data;
    },
  });
};
