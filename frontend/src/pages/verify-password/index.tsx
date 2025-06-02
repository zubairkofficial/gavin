import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useLocation } from "react-router-dom"
import { CircleAlertIcon } from "lucide-react"
import { useVerifyPasswordMutation } from "./hooks"
import { useResetPassword } from "../new-password/hooks"
import { useEffect } from "react"

// Form validation schema
const formSchema = z.object({
  code: z
    .string()
    .min(6, { message: "Verification code must be 6 digits" })
    .max(6, { message: "Verification code must be 6 digits" })
})

export default function VerifyPasswordPage() {
  const {mutate: verifyCode, isPending: isVerifying, isError} = useVerifyPasswordMutation()
  const {mutate: resendCode, isPending: isResending} = useResetPassword();
  const {state} = useLocation()

  // Get email from URL params or use a default
  const email = state?.email || "user@usegavin.com"

  // Initialize React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  })

  useEffect(() => {
    if (isError) {
      form.setError('code', {message: "Incorrect Code"})
    }
  }, [isError])

  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isVerifying) return
    verifyCode(values)
  }

  // Handle resend code
  const handleResendCode = () => {
    if (isResending) return
    resendCode({email})
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center">
  <div className="mt-8 md:text-center">
    <h2 className="text-3xl md:text-5xl font-bold font-lora mb-4">Check your inbox</h2>
    <p className="mt-2 text-gray-600">Enter the verification code we just sent to {email}</p>
  </div>

  <div className="w-full max-w-md flex-1 md:flex-none flex flex-col justify-between">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6 mt-6 flex flex-col justify-between">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code:</FormLabel>
              <FormControl>
                <Input
                  placeholder="123456"
                  {...field}
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors?.code?.message ? (
                  <div className="flex items-center gap-2">
                    <CircleAlertIcon fill="oklch(0.577 0.245 27.325)" stroke="white" />
                    Incorrect Code
                  </div>
                ): undefined}
              </FormMessage>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-black hover:bg-gray-800" disabled={isVerifying}>
          {isVerifying ? "Verifying..." : "Continue"}
        </Button>
      </form>
    </Form>
  </div>

  <div className="mt-4 text-center">
    <button
      type="button"
      onClick={handleResendCode}
      className="text-sm text-primary hover:underline cursor-pointer"
      disabled={isResending}
    >
      {isResending ? "Sending..." : "Resend email"}
    </button>
  </div>
</div>
  )
}
