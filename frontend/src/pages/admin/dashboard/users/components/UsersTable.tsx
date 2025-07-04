import { useState } from "react"
import { useUsersQuery, useToggleUserStatusMutation } from "../hooks"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import type { UsersFilters } from "../types"

export function UsersTable() {
  const [filters, setFilters] = useState<UsersFilters>({
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  })

  const { data, isLoading, error } = useUsersQuery(filters)
  const updateUserStatusMutation = useToggleUserStatusMutation()

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }))
  }

  const handleSort = (sortBy: string) => {
    setFilters((prev) => {
      // If clicking a different column, start with ascending
      if (prev.sortBy !== sortBy) {
        return {
          ...prev,
          sortBy,
          sortOrder: "asc",
          page: 1,
        }
      }
      
      // If same column, cycle through: asc -> desc -> no sort
      if (prev.sortOrder === "asc") {
        return {
          ...prev,
          sortOrder: "desc",
          page: 1,
        }
      } else if (prev.sortOrder === "desc") {
        return {
          ...prev,
          sortBy: "createdAt", // Reset to default sort
          sortOrder: "desc",
          page: 1,
        }
      }
      
      return prev
    })
  }

  const handleStatusFilter = (isActive: string) => {
    setFilters((prev) => ({
      ...prev,
      isActive: isActive === "all" ? undefined : isActive === "true",
      page: 1,
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  const handleUpdateStatus = async (userId: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({ userId })
      toast.success(`User status updated successfully`)
    } catch (error) {
      toast.error("Failed to update user status")
    }
  }

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) return <ArrowUpDown className="h-4 w-4" />
    return filters.sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Error loading users. Please try again.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="my-2">Users Management</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={filters.search || ""}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.isActive === undefined ? "all" : filters.isActive.toString()}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="true">Active Only</SelectItem>
              <SelectItem value="false">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4">User</TableHead>
                    <TableHead>
                      <Button
                      variant="ghost" onClick={() => handleSort("email")} className="h-auto p-0 font-semibold">
                        Email
                        {getSortIcon("email")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("role")} className="h-auto p-0 font-semibold">
                        Role
                        {getSortIcon("role")}
                      </Button>
                    </TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("isActive")}
                        className="h-auto p-0 font-semibold"
                      >
                        Status
                        {getSortIcon("isActive")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("createdAt")}
                        className="h-auto p-0 font-semibold"
                      >
                        Created
                        {getSortIcon("createdAt")}
                      </Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={user.profilePicture || undefined} />
                            <AvatarFallback>
                              {user.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user?.fullName}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {user.isEmailVerified ? (
                                <Badge variant="secondary" className="text-xs">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Unverified
                                </Badge>
                              )}
                              {user.isUsingGoogleAuth && (
                                <Badge variant="outline" className="text-xs ml-1">
                                  Google
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="pl-5">{user.email}</TableCell>
                      <TableCell  className="pl-4">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.firmName || "N/A"}</div>
                          <div className="text-sm text-muted-foreground">{user.companySize || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell  className="pl-5">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell 
                       className="pl-5"
                      >{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant={user.isActive ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleUpdateStatus(user.id)}
                          disabled={updateUserStatusMutation.isPending}
                        >
                          {updateUserStatusMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.isActive ? (
                            "Deactivate"
                          ) : (
                            "Activate"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(data.page - 1) * data.limit + 1} to {Math.min(data.page * data.limit, data.total)} of{" "}
                  {data.total} users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(data.page - 1)}
                    disabled={data.page <= 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          variant={data.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(data.page + 1)}
                    disabled={data.page >= data.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
