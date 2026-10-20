"use client";

import { RocketIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export function AuthCtaButton() {
  const { data: session, isPending } = useSession();
  const { openAuthModal } = useAuthModal();

  const handleClick = () => {
    if (!isPending && session) {
      window.location.href = "/waitlists";
    } else {
      openAuthModal();
    }
  };

  return (
    <Button
      size="lg"
      className="group w-full bg-linear-to-r from-primary to-primary/20 text-base text-primary-foreground sm:w-auto sm:text-xl"
      onClick={handleClick}
      variant="ghost"
    >
      Create Your Waitlist Now
      <HugeiconsIcon
        icon={RocketIcon}
        className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5"
      />
    </Button>
  );
}
