import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useNavigate, useSearchParams } from "react-router-dom"

export default function AuthErrorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams()
  const [isRetrying, setIsRetrying] = useState(false)

  // Get error details from URL params (if available)
  const errorCode = searchParams.get("error") || "idp_auth_failed"
  const errorMessage = searchParams.get("message") || "We couldn't log you in."

  // Retry authentication mutation
  const retryMutation = useMutation({
    mutationFn: async () => {
      // Simulate a retry delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real app, you might want to:
      // 1. Clear any cached credentials
      // 2. Redirect to the login page with a fresh state
      // 3. Or perform other cleanup actions

      return true
    },
    onSuccess: () => {
      // Redirect to login page
      navigate("/")
    },
  })

  // Handle retry button click
  const handleRetry = () => {
    setIsRetrying(true)
    retryMutation.mutate()
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="mt-8 text-center">
        <h2 className="text-5xl font-bold font-lora">Authentication Error</h2>
      </div>


      <div className="w-full max-w-xl space-y-8">
        <div className="mt-6 text-center">
          <p className="">
            We couldn&apos;t log you in. This may be due to an incorrect email, password,
            <br />
            or an issue with your identity provider.
          </p>
          <p className="mt-4">
            Please try again, or contact us at{" "}
            <a href="mailto:support@gavinai.com" className="text-primary hover:underline">
              support@gavinai.com
            </a>{" "}
            if the problem continues. (Include the request ID below if available.)
          </p>
          <p className="mt-4 text-sm">Error code: {errorCode}</p>
        </div>

        <div className="mt-6  max-w-96 mx-auto">
          <Button
            className="w-full bg-black hover:bg-gray-800"
            onClick={handleRetry}
            disabled={isRetrying || retryMutation.isPending}
          >
            {isRetrying || retryMutation.isPending ? "Retrying..." : "Retry"}
          </Button>
        </div>
      </div>
    </div>
  )
}
