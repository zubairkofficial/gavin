import { useMutation, useQueryClient } from '@tanstack/react-query'
import  API  from '../../../../lib/api' // Adjust this import based on your API setup


interface CreateJurisdictionDto {
  jurisdiction: string
}

export function useJurisdictionMutations() {
  const queryClient = useQueryClient()

  // Create jurisdiction mutation
  const createJurisdiction = useMutation({
    mutationFn: (data: CreateJurisdictionDto) => 
      API.post('/jurisdictions', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jurisdictions'] })
    },
  })

  // Update jurisdiction mutation
  const updateJurisdiction = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateJurisdictionDto }) =>
      API.patch(`/jurisdictions/${id}`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jurisdictions'] })
    },
  })

  // Delete jurisdiction mutation
  const deleteJurisdiction = useMutation({
    mutationFn: (id: number) => 
      API.delete(`/jurisdictions/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jurisdictions'] })
    },
  })

  return {
    createJurisdiction,
    updateJurisdiction,
    deleteJurisdiction,
  }
}
