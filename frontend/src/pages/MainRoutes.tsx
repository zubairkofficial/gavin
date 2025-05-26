import { useAuth } from "@/context/Auth.context";
import { Loader2Icon } from "lucide-react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthenticateRoutes from "./Authenticated.Routes";
import UnAuthenticateRoutes from "./UnAuthenticated.Routes";
import AdminRoutes from "./Admin.Routes";

export default function MainRoutes() {
  const { isAuthenticated, loading, user } = useAuth();

  const publicRoutes = createBrowserRouter(UnAuthenticateRoutes())
  const privateRoutes = createBrowserRouter(AuthenticateRoutes());
  const adminRoutes = createBrowserRouter(AdminRoutes());

  if (loading)
    return (
      <div className="h-screen w-screen grid place-content-center">
        <div className="w-96 mx-auto my-6">
          {loading && (
            <Loader2Icon className="w-16 h-16 mx-auto animate-spin" />
          )}
        </div>
      </div>
    );

  return (
      isAuthenticated ? user.role === "admin" ? <RouterProvider router={adminRoutes} /> : <RouterProvider router={privateRoutes} /> : <RouterProvider router={publicRoutes} />
  )
}