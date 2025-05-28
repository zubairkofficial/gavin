import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import SocialLoginButton from "@/components/SocialLoginButton"
import { useRegisterMutation } from "./hooks"
import { googleProvider } from "@/lib/firebase"
import { signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useGoogleLoginMutation } from "../login/hooks"

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, { message: "" })
  .refine((value) => /[A-Z]/.test(value), {
    message: "",
  })
  .refine((value) => /[0-9]/.test(value), {
    message: "",
  })
  .refine((value) => /[^A-Za-z0-9]/.test(value), {
    message: "",
  })

// Form validation schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: passwordSchema,
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and privacy policy" }),
  }),
})

export default function SignUpPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    isWeak: true,
    message:
      "Your password is too weak. Please use at least 8 characters, including a number, an uppercase letter, and a special symbol.",
  })

  const [loading, setLoading] = useState(false)

  const { mutateAsync: signUp } = useRegisterMutation()
  const { mutateAsync: googleLogin } = useGoogleLoginMutation()

  // Initialize React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Check password strength whenever it changes
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength({
        isWeak: true,
        message:
          "Your password is too weak. Please use at least 8 characters, including a number, an uppercase letter, and a special symbol.",
      })
      return
    }

    const hasMinLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[^A-Za-z0-9]/.test(password)

    const isStrong = hasMinLength && hasUppercase && hasNumber && hasSpecial

    if (!isStrong) {
      setPasswordStrength({
        isWeak: true,
        message:
          "Your password is too weak. Please use at least 8 characters, including a number, an uppercase letter, and a special symbol.",
      })
    } else {
      setPasswordStrength({ isWeak: false, message: "" })
    }
  }

  // Google sign up handler
  const handleGoogleSignUp = async () => {
    if (loading) return;
    try {
      setLoading(true)
      console.log("Signing in with Google")
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      await googleLogin({ token })
      navigate('/')
      console.log("Token:", token);
    } catch (error) {
      console.error("Google sign in failed:", error)
      navigate('/auth-error')
    } finally {
      setLoading(false)
    }
  }

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (loading) return;
    try {
      setLoading(true)
      await signUp(values)
    } catch (error) {
      console.error("Sign up failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center">
  <div className="mt-8 md:text-center">
    <h2 className="text-3xl md:text-5xl font-bold font-lora mb-4">Create your account</h2>
  </div>

  <div className="w-full max-w-md flex-1 md:flex-none flex flex-col justify-between">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6 mt-6 flex flex-col justify-between">
        <div className="space-y-6">
          <SocialLoginButton
            type="google"
            message="Sign up with Google"
            onClick={handleGoogleSignUp}
            disabled={loading}
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
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="password"
                      className="pr-10"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        checkPasswordStrength(e.target.value)
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </FormControl>
                {form.formState.isSubmitted && passwordStrength.isWeak && (
                  <p className="text-sm text-destructive mt-1">{passwordStrength.message}</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="rounded-full w-5 h-5 data-[state=checked]:bg-black data-[state=checked]:text-white"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    Agree to our{" "}
                    <Link to="/terms" className="underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="underline">
                      Privacy Policy
                    </Link>
                  </FormLabel>
                  <FormMessage className="block" />
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-black hover:bg-gray-800" disabled={loading}>
          {loading ? "Signing up..." : "Sign up"}
        </Button>
      </form>
    </Form>
  </div>

  <div className="mt-4 text-center text-sm">
    <p className="text-black/70">
      Already have an account?{" "}
      <Link to="/" className="font-medium text-primary hover:underline">
        Sign in
      </Link>
    </p>
  </div>
</div>
  )
}
