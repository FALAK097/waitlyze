"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { cancelBroadcast } from "@/app/actions/emails";
import { Button } from "@/components/ui/button";

export function ScheduledBroadcastCancellation({ waitListId, broadcasts }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState(null);
  const [canceledIds, setCanceledIds] = useState(() => new Set());
  const remaining = broadcasts.filter((broadcast) => !canceledIds.has(broadcast.id));

  async function cancel(broadcastId) {
    setPendingId(broadcastId);
    try {
      const result = await cancelBroadcast({ waitListId, broadcastId });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setCanceledIds((ids) => new Set(ids).add(broadcastId));
      router.refresh();
      toast.success(result.message);
    } catch {
      toast.error("Could not cancel this broadcast. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  if (!remaining.length) return null;
  return (
    <section className="mx-auto mt-6 w-full max-w-xl text-left" aria-label="Scheduled broadcasts">
      <h3 className="font-medium">Scheduled broadcasts</h3>
      <ul className="mt-3 grid gap-2">
        {remaining.map((broadcast) => (
          <li
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-product-border-subtle bg-product-bg-surface p-3"
            key={broadcast.id}
          >
            <span className="min-w-0 flex-1 truncate text-sm">
              {broadcast.subject || "Untitled broadcast"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pendingId !== null}
              onClick={() => cancel(broadcast.id)}
            >
              {pendingId === broadcast.id ? "Canceling…" : "Cancel"}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
