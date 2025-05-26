import { Badge, ChevronsUpDown, LogOut, Sparkles, Sun } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Fragment, useState } from "react";

export function AppSidebarFooter() {
  const { isMobile } = useSidebar();

  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleOnToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  const menuList = [
    {
      title: "Upgrade to Pro",
      icon: <Sparkles />,
      onClick: () => alert("upgrade"),
    },
    {
      title: "Appearance",
      icon: <Sun />,
      onClick: handleOnToggleTheme,
    },

    { title: "Support", icon: <Badge />, onClick: () => alert("support") },

    { title: "Log out", icon: <LogOut />, onClick: () => alert("logout") },
  ];

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {/* {getInitials(`${user?.firstName} ${user?.lastName}`)} */}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {/* {`${user?.firstName} ${user?.lastName}`} */}
                  </span>
                  {/* <span className="truncate text-xs">{user?.email}</span> */}
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                {menuList.map((item, index) => (
                  <Fragment key={index}>
                    {index === 1 || index === 3 ? (
                      <DropdownMenuSeparator key={index} />
                    ) : null}
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={item.onClick}
                    >
                      {item.icon}
                      {item.title}
                    </DropdownMenuItem>
                  </Fragment>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
