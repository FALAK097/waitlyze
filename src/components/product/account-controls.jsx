"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function leave() {
    setPending(true);
    try {
      const result = await signOut();
      if (result.error) throw new Error("Sign out failed");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Try again.");
      setPending(false);
    }
  }
  return (
    <div>
      <Button variant="ghost" onClick={leave} disabled={pending}>
        {pending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
