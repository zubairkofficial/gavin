import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import API from '@/lib/api'

interface CronJob {
  name: string
  cronTime: string
  lastDate: string | null
}

interface CreateCronJobPayload {
  name: string
  cron: string
}

export const useCronJobs = () => {
  const queryClient = useQueryClient()

  // Query for fetching jobs
  const { data: jobs = [], isLoading: isLoadingJobs, error: fetchError } = useQuery<CronJob[]>({
    queryKey: ['cron-jobs'],
    queryFn: async () => {
      const response = await API.get('jobs')
      if (!response.status || response.status >= 300) {
        throw new Error('Failed to fetch jobs')
      }
      return response.data
    }
  })

  // Mutation for creating a job
  const createJobMutation = useMutation({
    mutationFn: async (payload: CreateCronJobPayload) => {
      const response = await API.post('/add', payload)
      if (response.data.error) {
        throw new Error(response.data.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] })
    }
  })

  // Mutation for deleting a job
  const deleteJobMutation = useMutation({
    mutationFn: async (jobName: string) => {
      const response = await API.delete(`/${encodeURIComponent(jobName)}`)
      if (!response.status || response.status >= 300) {
        throw new Error('Failed to delete job')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] })
    }
  })

  return {
    jobs,
    isLoadingJobs,
    fetchError,
    createJob: createJobMutation.mutate,
    isCreatingJob: createJobMutation.isPending,
    createJobError: createJobMutation.error,
    deleteJob: deleteJobMutation.mutate,
    isDeletingJob: deleteJobMutation.isPending,
    deleteJobError: deleteJobMutation.error
  }
}
