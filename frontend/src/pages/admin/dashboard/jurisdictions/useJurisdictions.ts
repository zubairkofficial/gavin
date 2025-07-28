import { useQuery } from '@tanstack/react-query'
import  API  from '../../../../lib/api' // Adjust this import based on your API setup

interface Jurisdiction {
  id: number
  jurisdiction: string
  createdAt: string
}

export function useJurisdictions() {
  return useQuery({
    queryKey: ['jurisdictions'],
    queryFn: () => API.get('/jurisdictions/forall').then(res => res.data as Jurisdiction[]),
  })
}
