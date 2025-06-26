"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Plus, Search, Trash2 } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import API from "@/lib/api"

interface CronJob {
  name: string
  cronTime: string
  lastDate: string | null
}

export default function Settime() {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("")
  const [name, setJobName] = useState("")
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
        const timeStr = `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')} UTC`
        
        if (dayOfMonth !== '*') {
          return `${timeStr} on day ${dayOfMonth} of each month`
        } else if (dayOfWeek !== '*') {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          const dayNames = dayOfWeek.split(',').map(d => days[parseInt(d)] || d).join(', ')
          return `${timeStr} every ${dayNames}`
        } else {
          return `${timeStr} daily`
        }
      }

      return cronExpression
    } catch (error) {
      return cronExpression
    }
  }

  const convertUtcToCron = (utcDateString: string): string => {
    const date = new Date(utcDateString)
    const minute = date.getUTCMinutes()
    const hour = date.getUTCHours()
    const day = date.getUTCDate()
    return `${minute} ${hour} ${day} * *`
  }

  const handleSubmit = async () => {
    if (!date || !time || !name.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    setIsLoading(true)

    try {
      // Combine date and time
      const [hours, minutes] = time.split(":")
      const scheduledDateTime = new Date(date)
      scheduledDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      const cron = convertUtcToCron(scheduledDateTime.toISOString())
      console.log(cron)

      console.log(
        `Job: ${name}, Date: ${format(date, "yyyy-MM-dd")}, Time: ${time}, Schedule: ${scheduledDateTime.toISOString()}`,
      )


      // API call
      const response = await API.post("/add", {
        name,
        cron
      })

      if (response.status >= 200 && response.status < 300) {
        toast.success(`"${name}" scheduled for ${format(date, "PPP")} at ${time}`)
        // Reset form
        setDate(undefined)
        setTime("")
        setJobName("")
        setIsPopoverOpen(false)
        // Refresh jobs list
        fetchJobs()
      } else {
        throw new Error("Failed to schedule job")
      }
    } catch (error) {
      toast.error(`Failed to schedule job. Please try again.`)
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
                    <Label htmlFor="date-picker">Select Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time-picker">Select Time *</Label>
                    <Input id="time-picker" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>

                  {date && time && name && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Preview:</p>
                      <p className="font-medium text-sm">
                        {name} - {format(date, "PPP")} at {time}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={!date || !time || !name.trim() || isLoading}
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
                  <TableHead>Last Run</TableHead>
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
                      <TableCell className="text-sm text-muted-foreground">
                        {job.lastDate ? new Date(job.lastDate).toLocaleString() : "Never"}
                      </TableCell>
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