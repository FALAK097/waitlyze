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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
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
        <Button variant="ghost" className="relative w-10 h-10 p-0 border rounded-full shadow-sm border-border bg-background/50 hover:bg-muted/50">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image || user.imageUrl} alt={user.name || "User"} />
            <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2 border rounded-2xl border-border backdrop-blur-md bg-background/95" align="end" forceMount>
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">
              {user.name || "User"}
            </p>
            <p className="text-xs leading-none truncate text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 p-2 text-red-600 cursor-pointer rounded-xl focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
