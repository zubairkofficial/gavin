import LoginPage from "@/pages/login";
import { createRoutesFromElements, Route } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import RegisterPage from "./register";
import ResetPasswordPage from "./reset-password";
import AuthErrorPage from "./auth-error";
import VerifyEmailPage from "./verify-email";
import VerifyPage from "./verify";
import NewPasswordForm from "./new-password";
import VerifyPasswordPage from "./verify-password";

export default function UnAuthenticateRoutes() {
  return createRoutesFromElements(
    <>
      <Route element={<AuthLayout/>} >
        <Route index path="/" element={<LoginPage />} />
        <Route index path="/sign-up" element={<RegisterPage />} />
        <Route index path="/reset-password" element={<ResetPasswordPage />} />
        <Route index path="/auth-error" element={<AuthErrorPage />} />
        <Route index path="/verify" element={<VerifyPage />} />
        <Route index path="/verify-email" element={<VerifyEmailPage />} />
        <Route index path="/verify-password" element={<VerifyPasswordPage />} />
        <Route index path="/new-password" element={<NewPasswordForm />} />
      </Route>
    </>
  );
}