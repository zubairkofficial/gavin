import Home from "@/pages/dashboard/Home";
import { createRoutesFromElements, redirect, Route } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import OnboardingPage from "./dashboard/onboarding";

export default function AuthenticateRoutes() {
  return createRoutesFromElements(
    <>
      <Route
        loader={() => {
          const userData = localStorage.getItem("userData");
          const user = userData ? JSON.parse(userData) : null;
          if (user && (!user?.fullName || !user?.companySize || !user?.firmName)) {
            return redirect("/onboarding")
          }
          return null;
        }}
        path="/"
        element={<AppLayout />}>
        <Route
          index
          element={<Home />} />
      </Route>
      <Route
        path="/onboarding"
        loader={() => {
          const userData = localStorage.getItem("userData");
          const user = userData ? JSON.parse(userData) : null;
          if (user && user?.fullName && user?.companySize && user?.firmName) {
            return redirect("/")
          }
          return null;
        }}
        element={<OnboardingPage />} />
    </>
  );
}