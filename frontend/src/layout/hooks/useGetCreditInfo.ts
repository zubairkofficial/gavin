import { useQuery } from '@tanstack/react-query';
import API from '@/lib/api';

interface CreditInfo {
  credits: number;
  totalCredits: number;
  success: boolean;
}

export const useGetCreditInfo = () => {
  return useQuery<CreditInfo>({
    queryKey: ['credit-info'],
    queryFn: async () => {
      const response = await API.get('/payment-session/get-credit-info');
      return response.data;
    },
  });
};
