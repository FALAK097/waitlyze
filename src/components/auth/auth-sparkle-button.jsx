"use client";

import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { useSession } from "@/lib/auth-client";
import SparkleButton from "@/components/ui/sparkle-button";

export function AuthSparkleButton({ className }) {
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
    <div className={className}>
      <SparkleButton
        className="w-full text-base sm:text-lg group"
        onClick={handleClick}
      />
    </div>
  );
}
