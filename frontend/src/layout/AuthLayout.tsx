import { Logo } from "@/components/Logo";
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F5F7F8] py-4 md:py-12 px-6 md:px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <Outlet />
    </div>
  );
};

export default AuthLayout;

