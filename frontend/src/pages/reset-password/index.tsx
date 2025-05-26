import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import { useForgotPassword } from "./hooks"

// Form validation schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

export default function ResetPasswordPage() {
  const {mutateAsync: resetPassword, isPending: isResetting, isSuccess} = useForgotPassword()

  // Initialize React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isResetting) return
    await resetPassword(values)
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="my-8">
        <h2 className="text-3xl md:text-5xl font-bold font-lora text-center">Reset your password</h2>
      </div>

      <div className="w-full max-w-md space-y-8">
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we&apos;ll send you a link to reset your password
        </p>

        {isSuccess ? (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-center">
            <p className="text-sm text-green-800">
              Reset link sent! Please check your email for instructions to reset your password.
            </p>
            <Link to="/sign-in" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              Return to sign in
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address:</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800"
                disabled={isResetting}
              >
                {isResetting ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          </Form>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="text-sm hover:underline">
          Go to back
        </Link>
      </div>
    </div>
  )
}
