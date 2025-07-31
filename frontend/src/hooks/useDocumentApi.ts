import { useMutation, useQuery } from '@tanstack/react-query'
import API from '@/lib/api'
import { toast } from 'sonner'

interface UploadDocumentPayload {
  formData: FormData;
}

interface ProcessingDetails {
  textLength: number;
  totalClauses: number;
  validClauses: number;
  analyzed: boolean;
  embedded: boolean;
  processed_at: string;
}

interface Clause {
  id: string;
  type: string;
  risk_level: string;
  jurisdiction: string;
}

interface DocumentResponse {
  id: string;
  type: string;
  fileName: string;
  filePath: string;
  jurisdiction: string;
  documentType: string;
  processingDetails: ProcessingDetails;
  clauses: Clause[];
}

interface SuccessResponse {
  success: true;
  status: string;
  data: DocumentResponse;
  message: string;
}

interface ErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}

type ApiResponse = SuccessResponse | ErrorResponse;

interface Jurisdiction {
  id: number;
  jurisdiction: string;
  created_at: string;
}

export const useUploadDocument = () => {
  return useMutation<ApiResponse, Error, UploadDocumentPayload>({
    mutationFn: async ({ formData }) => {
      const response = await API.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      if ('success' in data && data.success) {
        // Show success message with processing details
        toast.success(data.message, {
          description: `Processed ${data.data.clauses.length} clauses with ${
            data.data.clauses.filter(c => c.risk_level === 'High').length
          } high-risk items`,
          duration: 5000,
        });
      } else {
        // Show error message
        toast.error('error' in data ? data.message : 'Failed to process document', {
          description: 'error' in data ? data.error : undefined,
          duration: 5000,
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to upload document', {
        description: error.message,
        duration: 5000,
      });
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
