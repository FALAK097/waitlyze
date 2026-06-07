"use client";

import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

export function AuthCtaButton() {
  const { data: session, isPending } = useSession();
  const { openAuthModal } = useAuthModal();

  const handleClick = () => {
    if (!isPending && session) {
      window.location.href = "/dashboard";
    } else {
      openAuthModal();
    }
  };

  return (
    <Button
      size="lg"
      className="w-full text-base sm:text-xl group bg-linear-to-r from-primary to-primary/20 text-primary-foreground sm:w-auto"
      onClick={handleClick}
    >
      Create Your Waitlist Now
      <Rocket className="ml-2 w-4 h-4 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
    </Button>
  );
}
