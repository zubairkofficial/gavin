import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useResetPassword } from "./hooks"
import { Link, useLocation } from "react-router-dom"

const passwordSchema = z
  .string()
  .min(8, { message: "" })
  .refine((value) => /[A-Z]/.test(value), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((value) => /[0-9]/.test(value), {
    message: "Password must contain at least one number",
  })
  .refine((value) => /[^A-Za-z0-9]/.test(value), {
    message: "Password must contain at least one special character",
  });

// Password validation schema
const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type PasswordFormValues = z.infer<typeof newPasswordSchema>

export default function NewPasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { mutateAsync: resetPassword, isPending: isResetting } = useResetPassword()
  const { state } = useLocation()
  const [passwordStrength, setPasswordStrength] = useState({
    isWeak: true,
    message:
      "Your password is too weak. Please use at least 8 characters, including a number, an uppercase letter, and a special symbol.",
  })


  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  console.log(form.formState.errors, "errors")

  async function onSubmit(data: PasswordFormValues) {
    if (isResetting) return
    try {
      await resetPassword({
        password: data.password,
        code: state.code,
      })
      // Handle successful password reset
      // You could redirect or show a success message
      console.log("Password reset successful")
    } catch (error) {
      console.error("Password reset failed:", error)
    }
  }

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


  return (
    <div className="w-full flex-1 flex flex-col items-center">
  <div className="mt-8 md:text-center">
    <h2 className="text-3xl md:text-5xl font-bold font-lora mb-4">Reset your password</h2>
    <p className="mt-2 text-gray-600">Enter a new password below to change your password</p>
  </div>

  <div className="w-full max-w-md flex-1 md:flex-none flex flex-col justify-between">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6 mt-6 flex flex-col justify-between">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password:</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} {...field} onChange={(e) => {
                      field.onChange(e)
                      checkPasswordStrength(e.target.value)
                    }} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Re-enter new password:</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} {...field} onChange={(e) => {
                      field.onChange(e)
                      checkPasswordStrength(e.target.value)
                    }} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </FormControl>
                {form.formState.isSubmitted && passwordStrength.isWeak && (
                  <p className="text-sm text-destructive mt-1">{passwordStrength.message}</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={isResetting}>
          {isResetting ? "Processing..." : "Continue"}
        </Button>
      </form>
    </Form>
  </div>

  <div className="mt-4 text-center">
    <Link to=".." className="text-sm text-primary hover:underline">
      Go to back
    </Link>
  </div>
</div>
  )
}
