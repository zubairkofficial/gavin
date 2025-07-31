import { useQuery } from "@tanstack/react-query"
import API from "@/lib/api"

interface Jurisdiction {
  jurisdiction: string;
  [key: string]: any;
}

export const useJurisdictions = () => {
  return useQuery<Jurisdiction[], Error, string[]>({
    queryKey: ['jurisdictions'],
    queryFn: async () => {
      const response = await API.get("/jurisdictions/forall")
      return response.data
    },
    select: (data) => data.map(jurisdiction => jurisdiction.jurisdiction)
  })
}
