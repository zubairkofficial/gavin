import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"
import { useForgotPassword } from "./hooks"

// Form validation schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

export default function ResetPasswordPage() {
  const { mutateAsync: resetPassword, isPending: isResetting, isSuccess } = useForgotPassword()
  const navigate = useNavigate()

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
    <div className="w-full flex-1 flex flex-col items-center">
  <div className="mt-8 md:text-center">
    <h2 className="text-3xl md:text-5xl font-bold font-lora mb-4">Reset your password</h2>
    <p className="mt-2 text-gray-600">Enter your email address and we'll send you a link to reset your password</p>
  </div>

  <div className="w-full max-w-md flex-1 md:flex-none flex flex-col justify-between">
    {isSuccess ? (
      <div className="flex-1 flex flex-col justify-center">
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <p className="text-sm text-green-800">
            Reset link sent! Please check your email for instructions to reset your password.
          </p>
          <Button
            onClick={() => navigate("/sign-in")}
            className="mt-4 w-full bg-black hover:bg-gray-800"
          >
            Return to sign in
          </Button>
        </div>
      </div>
    ) : (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6 mt-6 flex flex-col justify-between">
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

  <div className="mt-4 text-center">
    <button
      type="button"
      onClick={() => navigate("/")}
      className="text-sm text-primary hover:underline cursor-pointer"
    >
      Go back
    </button>
  </div>
</div>
  )
}
