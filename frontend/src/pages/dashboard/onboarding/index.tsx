import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link } from "react-router-dom"
import { useUpdateProfileMutation } from "./hooks"
import { Logo } from "@/components/Logo"

// Form validation schema
const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  firmName: z.string().min(2, { message: "Firm name must be at least 2 characters" }),
  companySize: z.string({ required_error: "Please select a company size" }),
})

// Company size options
const companySizeOptions = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "501-1000", label: "501-1000" },
  { value: "1000+", label: "1000+" },
]

export default function OnboardingPage() {
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfileMutation()

  // Initialize React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      firmName: "",
      companySize: "",
    },
  })

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUpdating) return;
    await updateProfile(values)
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F5F7F8] py-6 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center mb-8">
        <Logo />
      </div>

      <div className="mt-8 text-center">
        <h2 className="text-3xl md:text-5xl font-bold font-lora">Tell us about you</h2>
      </div>

      <div className="w-full flex-1 md:flex-none flex flex-col justify-between max-w-md space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 md:flex-none flex flex-col justify-between mt-6">
            <div className="flex flex-col gap-6 mb-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name:</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firmName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firm name:</FormLabel>
                    <FormControl>
                      <Input placeholder="Greenwich Law Llc" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full py-6">
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companySizeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800"
              disabled={isUpdating}
            >
              {isUpdating ? "Saving..." : "Continue"}
            </Button>
          </form>
        </Form>
      </div>
      <div className="mt-4 text-center">
        <Link to="/onboarding" className="text-sm text-gray-600 hover:underline">
          Back
        </Link>
      </div>
    </div>
  )
}
