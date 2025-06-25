import API from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

export const usedocumentQuery = ({type}:{type: string}) => {
    return useQuery({
        queryKey: ["document", type],
        queryFn: async () => {
            const res = await API.get('/proposal')
            return res
        }
    })
}