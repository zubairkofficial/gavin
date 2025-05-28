import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Define form schema with Zod
const formSchema = z.object({
  code: z
    .string()
    .min(6, {
      message: "Verification code must be at least 6 characters.",
    })
    .max(8),
  rememberDevice: z.boolean(),
})


// Mock API call - replace with your actual API endpoint
const verifyCode = async (data: z.infer<typeof formSchema>) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, data })
    }, 1000)
  })
}

export default function VerifyPage() {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      rememberDevice: false,
    },
  })


  // Setup React Query mutation
  const mutation = useMutation({
    mutationFn: verifyCode,
    onSuccess: () => {
      // Handle successful verification
      // Redirect to dashboard or next page
      console.log("Verification successful")
    },
  })

  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values)
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center">
  <div className="mt-8 md:text-center">
    <h2 className="text-3xl md:text-5xl font-bold font-lora mb-4">Verify your identity</h2>
    <p className="mt-2 text-gray-600">Check your preferred one-time password application for a code.</p>
  </div>

  <div className="w-full max-w-md flex-1 md:flex-none flex flex-col justify-between">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6 mt-6 flex flex-col justify-between">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter your one-time code*</FormLabel>
                <FormControl>
                  <Input placeholder="000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberDevice"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-muted-foreground">Remember this device for 30 days</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-black hover:bg-gray-800" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    </Form>
  </div>

  <div className="mt-4 text-center">
    <Button variant="link" className="text-sm text-primary hover:underline">
      Try another method
    </Button>
  </div>
</div>
  )
}
