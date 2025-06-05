export interface User {
    id: string
    createdAt: string
    updatedAt: string
    deletedAt?: string
    fullName: string
    profilePicture?: string
    email: string
    password: string
    isEmailVerified: boolean
    isActive: boolean
    isUsingGoogleAuth: boolean
    role: string
    firmName?: string
    companySize?: string
  }
  
  export interface UsersResponse {
    data: User[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
  
  export interface UsersFilters {
    search?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
    isActive?: boolean
  }
  