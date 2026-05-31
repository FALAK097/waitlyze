"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "@/lib/auth-client";
import { LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export function UserNav() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return null;

  // Extract initials for fallback avatar
  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut({
        callbackURL: "/",
      });
      toast.success("Signed out successfully");
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border shadow-sm bg-background/50 hover:bg-muted/50 p-0">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image || user.imageUrl} alt={user.name || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-2xl border border-border p-2 backdrop-blur-md bg-background/95" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">
              {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuGroup className="p-1">
          <Link href="/dashboard" className="w-full">
            <DropdownMenuItem className="rounded-xl cursor-pointer flex items-center gap-2 p-2 hover:bg-primary/10 hover:text-primary">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="rounded-xl cursor-pointer flex items-center gap-2 p-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
