"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Trash2, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import API from "@/lib/api"

interface CronJob {
  name: string
  cronTime: string
  lastDate: string | null
}

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
  const [isLoading, setIsLoading] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [deletingJob, setDeletingJob] = useState<string | null>(null)

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      setIsLoadingJobs(true)
      const response = await API.get("jobs")
      if (response.status >= 200 && response.status < 300) {
        const data = response.data
        setCronJobs(data)
      } else {
        throw new Error("Failed to fetch jobs")
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
      toast.error("Failed to fetch jobs")
    } finally {
      setIsLoadingJobs(false)
    }
  }

  // Load jobs on component mount
  useEffect(() => {
    fetchJobs()
  }, [])

  const filteredJobs = cronJobs.filter((job) => job.name.toLowerCase().includes(searchTerm.toLowerCase()))

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

    setIsLoading(true)

    try {
      const cron = generateCronExpression(scheduleType, time)
      console.log(`Generated cron: ${cron}`)

      const selectedOption = scheduleOptions.find(opt => opt.value === scheduleType)
      console.log(
        `Job: ${name}, Schedule: ${selectedOption?.label}, Time: ${time}, Cron: ${cron}`
      )

      // API call
      const response = await API.post("/add", {
        name,
        cron
      })
      console.log(response)

      console.log(response.data.error)
      if(response.data.error){
        // toast.error(`response.data.error`)
        throw new Error(`${response.data.error}`)
      }
      // if(response.data){
      //   toast(`${response.data}`)
      // }else {
       
      // }


      if (response.status >= 200 && response.status < 300 ) {
        const selectedOption = scheduleOptions.find(opt => opt.value === scheduleType)
        toast.success(`"${name}" scheduled for ${selectedOption?.label} at ${time}`)
        // Reset form
        setScheduleType("")
        setTime("")
        setJobName("")
        setIsPopoverOpen(false)
        // Refresh jobs list
        fetchJobs()
      } else {
        throw new Error("Failed to schedule job")

      }
    } catch (error) {
      toast.error(`${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteJob = async (jobName: string) => {
    setDeletingJob(jobName)
    try {
      const response = await API.delete(`/${encodeURIComponent(jobName)}`)
      
      if (response.status >= 200 && response.status < 300) {
        toast.success(`Job "${jobName}" deleted successfully`)
        // Refresh jobs list
        fetchJobs()
      } else {
        throw new Error("Failed to delete job")
      }
    } catch (error) {
      console.error("Error deleting job:", error)
      toast.error("Failed to delete job. Please try again.")
    } finally {
      setDeletingJob(null)
    }
  }

  const getPreviewText = () => {
    if (!scheduleType || !time || !name) return null
    const selectedOption = scheduleOptions.find(opt => opt.value === scheduleType)
    return `${name} - ${selectedOption?.label} at ${time}`
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
                      disabled={!scheduleType || !time || !name.trim() || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Creating..." : "Create Job"}
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
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading jobs...
                    </TableCell>
                  </TableRow>
                ) : filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                      {/* <TableCell className="text-sm text-muted-foreground">
                        {job.lastDate ? new Date(job.lastDate).toLocaleString() : "Never"}
                      </TableCell> */}
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteJob(job.name)}
                          disabled={deletingJob === job.name}
                          className="h-8 w-8 p-0"
                        >
                          {deletingJob === job.name ? (
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