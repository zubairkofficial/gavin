import API from "@/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"


export const useProposalQuery = () => {
    return useQuery({
        queryKey: ["proposal"],
        queryFn: async () => {
            const res = await API.get('/proposal')
            return res
        }
    })
}

export const useCreateProposalMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ["create-proposal"],
        mutationFn: async (payload: any) => {
            const res = await API.post('/proposal', payload)
            return res
        },
        onSuccess: () => {
            toast.success("Proposal Successfully Created.");
            queryClient.invalidateQueries({ queryKey: ["proposal"] })
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(error.response?.data?.message || error.response?.data?.message[0] || "Error creating proposal")
        }
    })
}


export const useUpdateProposalMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ["update-proposal"],
        mutationFn: async ({ id, ...payload }: any) => {
            const res = await API.patch(`/proposal/${id}`, payload)
            return res
        },
        onSuccess: (_, variables) => {
            toast.success("Proposal Successfully Updated.")
            queryClient.invalidateQueries({ queryKey: ["proposal-by-id", variables.id] })
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(error.response?.data?.message || error.response?.data?.message[0] || "Error updating proposal")
        }
    })
}


export const useDeleteProposalMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ["delete-proposal"],
        mutationFn: async (id: string) => {
            const res = await API.delete(`/proposal/${id}`)
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proposal"] })
            toast.success("Proposal Successfully Deleted.")
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(error.response?.data?.message || error.response?.data?.message[0] || "Error deleting proposal")
        }
    })
}


export const useProposalByIdQuery = ({
    proposalId
}: {
    proposalId: string
}) => {
    return useQuery({
        queryKey: ["proposal-by-id", proposalId],
        queryFn: async () => {
            const res = await API.get(`/proposal/${proposalId}`)
            return res
        },
        enabled: !!proposalId
    })
}

