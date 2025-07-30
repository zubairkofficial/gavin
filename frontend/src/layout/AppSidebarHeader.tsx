import { SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { Logo } from "@/components/Logo";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpenText, ChevronLeft, ChevronRight, CreditCard, Loader2, LogOutIcon, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import API from '@/lib/api';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/Auth.context";
import { useModel } from "@/context/Model.context";

interface CreditInfo {
  credits: number;
  totalCredits: number;
  success: boolean;
}

export function AppSidebarHeader() {

   const { user } = useAuth()

  const { setIsModalOpen ,setIsModalvalue  } = useModel();
  const {toggleSidebar} = useSidebar()
  const [isInnerSideBarOpen, setIsInnerSideBarOpen] = useState(false)
  
  const { logout } = useAuth()
  const navigate = useNavigate()
  // console.log(user)

 useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 724) { // Set threshold for large screen (1024px)
        setIsModalOpen(false); // Close the modal on large screen
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Check on initial load

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setIsModalOpen]);
  return (
    <SidebarHeader className="px-3 pt-6 border-b md:border-none">
      <div className=" hidden md:block">
        <Logo />
      </div>
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">{user?.fullName}</h2>
            <p className="text-gray-500 mb-4">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsInnerSideBarOpen(!isInnerSideBarOpen)}>
            <ChevronRight className="size-[24px]" />
          </Button>
          {isInnerSideBarOpen && (
            <div className="absolute top-0 right-0 w-full h-full bg-background z-10">
              <div className="flex justify-between px-2 py-4">
                <div>
                  <Button variant="ghost" size="icon" onClick={() => setIsInnerSideBarOpen(!isInnerSideBarOpen)}>
                    <ChevronLeft className="size-[24px]" />
                  </Button>
                </div>
                <div className="w-full h-full bg-background">
                  <h2 className="text-xl font-semibold mb-1">{user?.fullName}</h2>
                  <p className="text-gray-500 mb-4">{user?.email}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 px-4">
                <div className="py-1 flex items-center cursor-pointer px-0" onClick={() => {setIsModalOpen(true); setIsInnerSideBarOpen(!isInnerSideBarOpen); toggleSidebar() , setIsModalvalue('Account') } }>
                  <UserIcon className="mr-2 !h-[18px] !w-[1" />
                  <span className="text-base">Account</span>
                </div>

                {user?.role === "admin" ? 
                <>
                
                </>:<>
                <div className="py-1 flex items-center cursor-pointer px-0" onClick={() => {setIsModalOpen(true); setIsInnerSideBarOpen(!isInnerSideBarOpen); toggleSidebar() , setIsModalvalue('PlansBilling')} }>
                  <CreditCard className="mr-2 !h-[18px] !w-[1" />
                  <button   className="text-base">Plans & Billing</button>
                </div>
                </> }

                {user?.role === "admin" ? <></>:<>
                <div className="py-1 flex items-center cursor-pointer px-0" onClick={() => {setIsModalOpen(true); setIsInnerSideBarOpen(!isInnerSideBarOpen); toggleSidebar() , setIsModalvalue('HelpCenter')} }>
                  <BookOpenText className="mr-2 !h-[18px] !w-[1" />
                  <span className="text-base">Help Center</span>
                </div>
                </>}

                <div className="pt-1 flex items-center cursor-pointer px-0" onClick={() => {
                  logout()
                  navigate(0)
                }}>
                  <LogOutIcon className="mr-2 !h-[18px] !w-[1" />
                  <span className="text-base">Sign out</span>
                </div>
              </div>
            </div>
          )}
        </div>
        {user?.role == 'admin' ? <>
       
        </>:<>
         <div className="w-full bg-transparent border rounded-md p-4 mb-4">
          <h3 className="font-semibold text-left">Credits Used</h3>
          {(() => {
            const { data: creditInfo, isLoading } = useQuery<CreditInfo>({
              queryKey: ['credit-info'],
              queryFn: async () => {
                const response = await API.get('/payment-session/get-credit-info');
                return response.data;
              },
            });

            if (isLoading) {
              return (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              );
            }

            const percentage = creditInfo ? (creditInfo.credits / creditInfo.totalCredits) * 100 : 0;
            
            return (
              <>
                <div className="flex justify-between mb-1 items-center">
                  <Progress value={percentage} className="h-[5px] w-[80%]" />
                  <span className="text-xs">{creditInfo?.credits}/{creditInfo?.totalCredits}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500 text-start">
                    {creditInfo?.success ? `You have ${creditInfo.credits} credits remaining` : 'Unable to load credits'}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
        </>}
      </div>
     
    </SidebarHeader>
  );
}
