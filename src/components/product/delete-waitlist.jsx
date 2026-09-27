"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Input } from "./input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "./dialog";
import { deleteWaitlist } from "@/app/actions/delete-waitlist";

export function DeleteWaitlist({ id, name }) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const router = useRouter();
  async function remove(event) {
    event.preventDefault(); setError(""); setPending(true);
    try {
      const result = await deleteWaitlist(id, confirmation);
      if (result.error) { setError(result.error); setPending(false); return; }
      setOpen(false); router.replace("/wait-lists"); router.refresh();
    } catch { setError("Could not delete this waitlist. Try again."); setPending(false); }
  }
  return <div ref={container}><Dialog open={open} onOpenChange={(value) => { if (!pending) { setOpen(value); setConfirmation(""); setError(""); } }}><DialogTrigger render={<Button variant="destructive" />}>Delete waitlist</DialogTrigger><DialogContent container={container}>
    <div className="product-dialog-heading"><DialogTitle>Delete {name}?</DialogTitle><DialogDescription>This permanently deletes the waitlist, subscribers and analytics. This cannot be undone.</DialogDescription></div>
    <form onSubmit={remove} className="product-form"><div className="product-field"><label htmlFor="delete-confirmation">Type “{name}” to confirm</label><Input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={pending} autoComplete="off" aria-invalid={!!error} aria-describedby={error ? "delete-error" : undefined} />{error && <p id="delete-error" role="alert">{error}</p>}</div><div className="product-actions"><DialogClose render={<Button variant="outline" />} disabled={pending}>Cancel</DialogClose><Button type="submit" variant="destructive" disabled={pending || confirmation !== name}>{pending ? "Deleting…" : "Permanently delete"}</Button></div></form>
  </DialogContent></Dialog></div>;
}
