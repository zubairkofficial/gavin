"use client"

import { useState } from "react"
import { Plus, Search, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useCronJobs } from "@/pages/admin/dashboard/setTimeCron/useCronJobs" // Adjust the import path as needed

interface ScheduleOption {
  value: string
  label: string
  description: string
}

const scheduleOptions: ScheduleOption[] = [
  { value: "daily", label: "Every Day", description: "Runs daily at specified time" },
  { value: "monday", label: "Every Monday", description: "Runs every Monday at specified time" },
  { value: "tuesday", label: "Every Tuesday", description: "Runs every Tuesday at specified time" },
  { value: "wednesday", label: "Every Wednesday", description: "Runs every Wednesday at specified time" },
  { value: "thursday", label: "Every Thursday", description: "Runs every Thursday at specified time" },
  { value: "friday", label: "Every Friday", description: "Runs every Friday at specified time" },
  { value: "saturday", label: "Every Saturday", description: "Runs every Saturday at specified time" },
  { value: "sunday", label: "Every Sunday", description: "Runs every Sunday at specified time" },
  { value: "every15days", label: "Every 15 Days", description: "Runs on 1st and 16th of every month" },
  { value: "monthly", label: "Every Month", description: "Runs on 1st of every month" },
]

export default function Settime() {
  const [time, setTime] = useState("")
  const [name, setJobName] = useState("")
  const [scheduleType, setScheduleType] = useState("")
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [deletingJobName, setDeletingJobName] = useState<string | null>(null)

  // Use the custom hook
  const {
    jobs,
    isLoadingJobs,
    fetchError,
    createJob,
    isCreatingJob,
    createJobError,
    deleteJob,
    isDeletingJob,
    deleteJobError
  } = useCronJobs()

  // Filter jobs based on search term
  const filteredJobs = jobs.filter((job) => 
    job.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Convert schedule type and time to cron expression
  const generateCronExpression = (scheduleType: string, time: string): string => {
    const [hours, minutes] = time.split(":")
    const minute = parseInt(minutes)
    const hour = parseInt(hours)

    switch (scheduleType) {
      case "daily":
        return `${minute} ${hour} * * *`
      case "monday":
        return `${minute} ${hour} * * 1`
      case "tuesday":
        return `${minute} ${hour} * * 2`
      case "wednesday":
        return `${minute} ${hour} * * 3`
      case "thursday":
        return `${minute} ${hour} * * 4`
      case "friday":
        return `${minute} ${hour} * * 5`
      case "saturday":
        return `${minute} ${hour} * * 6`
      case "sunday":
        return `${minute} ${hour} * * 0`
      case "every15days":
        return `${minute} ${hour} 1,16 * *`
      case "monthly":
        return `${minute} ${hour} 1 * *`
      default:
        return `${minute} ${hour} * * *`
    }
  }

  // Convert cron expression to readable format
  const cronToReadableTime = (cronExpression: string): string => {
    try {
      const parts = cronExpression.split(' ')
      if (parts.length !== 5) return cronExpression

      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts

      // Handle simple cases
      if (minute !== '*' && hour !== '*') {
        const hourNum = parseInt(hour)
        const minuteNum = parseInt(minute)
        const timeStr = `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`
        
        if (dayOfMonth === '1,16') {
          return `${timeStr} on 1st and 16th of every month`
        } else if (dayOfMonth === '1' && month === '*' && dayOfWeek === '*') {
          return `${timeStr} on 1st of every month`
        } else if (dayOfWeek !== '*') {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          const dayNames = dayOfWeek.split(',').map(d => days[parseInt(d)] || d).join(', ')
          return `${timeStr} every ${dayNames}`
        } else if (dayOfMonth === '*' && dayOfWeek === '*') {
          return `${timeStr} daily`
        }
      }

      return cronExpression
    } catch (error) {
      return cronExpression
    }
  }

  const handleSubmit = async () => {
    if (!scheduleType || !time || !name.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    try {
      const cron = generateCronExpression(scheduleType, time)
      console.log(`Generated cron: ${cron}`)

      const selectedOption = scheduleOptions.find(opt => opt.value === scheduleType)
      console.log(
        `Job: ${name}, Schedule: ${selectedOption?.label}, Time: ${time}, Cron: ${cron}`
      )

      // Use the mutation
      createJob(
        { name, cron },
        {
          onSuccess: () => {
            const selectedOption = scheduleOptions.find(opt => opt.value === scheduleType)
            toast.success(`"${name}" scheduled for ${selectedOption?.label} at ${time}`)
            // Reset form
            setScheduleType("")
            setTime("")
            setJobName("")
            setIsPopoverOpen(false)
          },
          onError: (error: Error) => {
            toast.error(`${error.message}`)
          }
        }
      )
    } catch (error) {
      toast.error(`${error}`)
    }
  }

  const handleDeleteJob = async (jobName: string) => {
    setDeletingJobName(jobName)
    
    deleteJob(jobName, {
      onSuccess: () => {
        toast.success(`Job "${jobName}" deleted successfully`)
        setDeletingJobName(null)
      },
      onError: (error: Error) => {
        console.error("Error deleting job:", error)
        toast.error("Failed to delete job. Please try again.")
        setDeletingJobName(null)
      }
    })
  }

  const getPreviewText = () => {
    if (!scheduleType || !time || !name) return null
    const selectedOption = scheduleOptions.find(opt => opt.value === scheduleType)
    return `${name} - ${selectedOption?.label} at ${time}`
  }

  // Handle fetch error
  if (fetchError) {
    toast.error("Failed to fetch jobs")
  }

  // Handle create job error
  if (createJobError) {
    toast.error(`Failed to create job: ${createJobError.message}`)
  }

  // Handle delete job error
  if (deleteJobError) {
    toast.error(`Failed to delete job: ${deleteJobError.message}`)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Scraping Scheduler</h1>
        <p className="text-muted-foreground">Schedule your scraping tasks with precision</p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scheduled Jobs</CardTitle>
              <CardDescription>Manage your scraping schedules</CardDescription>
            </div>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cron
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Schedule New Job</h4>
                    <p className="text-sm text-muted-foreground">Create a new scraping schedule</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-name">Job Name *</Label>
                    <Input
                      id="job-name"
                      placeholder="Enter job name"
                      value={name}
                      onChange={(e) => setJobName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-type">Schedule Type *</Label>
                    <Select value={scheduleType} onValueChange={setScheduleType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {scheduleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              <span className="text-xs text-muted-foreground">{option.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time-picker">Select Time *</Label>
                    <div className="relative">
                      <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="time-picker" 
                        type="time" 
                        value={time} 
                        onChange={(e) => setTime(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  {getPreviewText() && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Preview:</p>
                      <p className="font-medium text-sm">{getPreviewText()}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cron: {generateCronExpression(scheduleType, time)}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={!scheduleType || !time || !name.trim() || isCreatingJob}
                      className="flex-1"
                    >
                      {isCreatingJob ? "Creating..." : "Create Job"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsPopoverOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="relative flex-1 items-center justify-center">
              <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Cron Expression</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingJobs ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Loading jobs...
                    </TableCell>
                  </TableRow>
                ) : filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchTerm
                        ? "No jobs found matching your search."
                        : "No scheduled jobs yet. Create your first job!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.name}>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell className="text-sm">{cronToReadableTime(job.cronTime)}</TableCell>
                      <TableCell className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {job.cronTime}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteJob(job.name)}
                          disabled={deletingJobName === job.name}
                          className="h-8 w-8 p-0"
                        >
                          {deletingJobName === job.name ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}