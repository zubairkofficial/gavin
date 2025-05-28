import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "react-router-dom"
import { useGoogleLoginMutation, useLoginMutation } from "./hooks"
import { auth, googleProvider } from "@/lib/firebase"
import { signInWithPopup } from "firebase/auth"
import SocialLoginButton from "@/components/SocialLoginButton"

// Form validation schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate();
  const { mutateAsync } = useLoginMutation();
  const { mutateAsync: googleLogin } = useGoogleLoginMutation();

  // Initialize React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Google sign in handler
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      console.log("Signing in with Google")
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      await googleLogin({ token })
      navigate(0)
      console.log("Token:", token);
    } catch (error) {
      console.error("Google sign in failed:", error)
      navigate('/auth-error')
    } finally {
      setIsLoading(false)
    }
  }

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isLoading) return;
    await mutateAsync(values)
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center">
  <div className="mt-8 md:text-center">
    <h2 className="text-3xl md:text-5xl font-bold font-lora mb-4">Sign in</h2>
  </div>

  <div className="w-full max-w-md flex-1 md:flex-none flex flex-col justify-between">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6 mt-6 flex flex-col justify-between">
        <div className="space-y-6">
          <SocialLoginButton
            type="google"
            message="Sign in with Google"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-black hover:bg-gray-800"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </Form>
  </div>

  <div className="mt-4 text-center text-sm">
    <p className="text-black/70">
      Already have an account?{" "}
      <Link to="/sign-up" className="font-medium text-primary hover:underline">
        Sign up
      </Link>
    </p>
    <p className="mt-2">
      <Link to="/reset-password" className="font-medium text-primary hover:underline">
        Forgot password?
      </Link>
    </p>
  </div>
</div>
  )
}
