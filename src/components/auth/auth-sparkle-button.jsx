"use client";

import { useAuthModal } from "@/components/auth/auth-modal-provider";
import SparkleButton from "@/components/ui/sparkle-button";
import { useSession } from "@/lib/auth-client";

export function AuthSparkleButton({ className }) {
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
    <div className={className}>
      <SparkleButton className="group w-full text-base sm:text-lg" onClick={handleClick} />
    </div>
  );
}
