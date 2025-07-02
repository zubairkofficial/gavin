"use client"

import type React from "react"
import {  useEffect, useState } from "react"
import API from "@/lib/api"
import { FileText, Scale, BookOpen, Gavel } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DocumentsTable from "./displayDoc/compoenets/documentTable"

interface DocumentCount {
  type: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  color: string
}

async function fetchDocumentCount(type: string): Promise<number> {
  try {
    const url = `/documents/${type}`
    // console.log(`Fetching ${type} from ${url}`)
    const response = await API.get(url)

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to fetch ${type}`)
    }

    const responseData = response.data
    // console.log(`Response data for ${type}:`, responseData)

    // Assuming the API returns an array or an object with a count property
    // Adjust this based on your actual API response structure
    return Array.isArray(responseData) ? responseData.length : responseData.count || 0
  } catch (error) {
    console.error(`Error fetching ${type}:`, error)
    return 0
  }
}

async function getDocumentCounts(): Promise<DocumentCount[]> {
  const documentTypes = [
    {
      type: "contracts",
      title: "Contracts",
      icon: FileText,
      color: "text-gray-600",
    },
    {
      type: "regulations",
      title: "Regulations",
      icon: Scale,
      color: "text-gray-600",
    },
    {
      type: "statutes",
      title: "Statutes",
      icon: BookOpen,
      color: "text-gray-600",
    },
    {
      type: "cases",
      title: "Cases",
      icon: Gavel,
      color: "text-gray-600",
    },
  ]

  const counts = await Promise.all(
    documentTypes.map(async (docType) => ({
      ...docType,
      count: await fetchDocumentCount(docType.type),
    })),
  )

  return counts
}

function DocumentCard({ document }: { document: DocumentCount }) {
  const Icon = document.icon

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{document.title}</CardTitle>
        <Icon className={`h-5 w-5 ${document.color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{document.count.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground mt-1">Total {document.title.toLowerCase()}</p>
      </CardContent>
    </Card>
  )
}

function DocumentCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        <div className="h-5 w-5 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  )
}

function DocumentStats() {
  const [documentCounts, setDocumentCounts] = useState<DocumentCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const counts = await getDocumentCounts()
        setDocumentCounts(counts)
      } catch (error) {
        console.error('Error fetching document counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <DocumentCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {documentCounts.map((document) => (
        <DocumentCard key={document.type} document={document} />
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <main className="container h-full max-w-7xl mx-auto py-6 space-y-8">
      <div className="flex flex-col items-center justify-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your document management system</p>
      </div>

      <div className="m-5">
        <DocumentStats />
      </div>
      <div className=" py-6 px-6">
        <DocumentsTable/>
      </div>

    </main>
  )
}