import { useVerifyPasswordMutation } from "./useVerifyPasswordMutation"
import { useEffect } from "react"
import { toast } from "sonner"

export function useVerifyCodeHandler(onSuccess: () => void) {
  const { mutate: verifyCode, isPending, isError } = useVerifyPasswordMutation()

  useEffect(() => {
    if (isError) {
      toast.error("Incorrect code. Please try again.")
    }
  }, [isError])

  const handleVerify = (code: string) => {
    if (isPending) return
    verifyCode({ code }, { onSuccess })
  }

  return { handleVerify, isPending }
}
