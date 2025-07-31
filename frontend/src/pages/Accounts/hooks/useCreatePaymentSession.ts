import { useMutation } from '@tanstack/react-query'
import API from '@/lib/api'

interface CreatePaymentSessionParams {
  credits: number
  price: number
}

export const useCreatePaymentSession = () => {
  return useMutation({
    mutationFn: async (params: CreatePaymentSessionParams) => {
      const response = await API.post('/payment-session/create', params)
      return response.data
    }
  })
}
