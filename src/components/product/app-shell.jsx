"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowDown01Icon, ArrowUpRight01Icon, BubbleChatIcon, Logout01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkspace, selectWorkspace } from "@/app/actions/settings";
import { signOut } from "@/lib/auth-client";
import { FeedbackForm } from "@/components/product/feedback-form";
import "./app-shell.css";
import { toast } from "sonner";

function WorkspaceAvatar({ name }) {
  return <span className="app-workspace-avatar" aria-hidden="true">{(name || "?").slice(0, 1).toUpperCase()}</span>;
}

function CreateWorkspaceDialog({ open, onOpenChange }) {
  const [state, action, pending] = useActionState(createWorkspace, null);
  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogTitle>Create workspace</DialogTitle>
      <Separator />
      <form action={action} className="app-workspace-create">
        <div className="product-field">
          <Label htmlFor="workspace-name">Workspace name</Label>
          <Input id="workspace-name" name="name" required minLength={1} maxLength={80} placeholder="Acme Inc." disabled={pending} autoComplete="off" aria-invalid={!!state?.error} />
        </div>
        <Separator />
        <div className="product-actions">
          <DialogClose render={<Button variant="outline" />} disabled={pending}>Cancel</DialogClose>
          <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create"}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}

function WorkspaceSwitcher({ workspaces, selected }) {
  const [pending, setPending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const current = workspaces.find(workspace => workspace.id === selected);
  async function switchTo(id) {
    if (id === selected || pending) return;
    setPending(true);
    const form = new FormData();
    form.set("workspaceId", id);
    try { await selectWorkspace(form); }
    catch (error) {
      // Server-action redirects throw; let navigation proceed.
      if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
      toast.error("Could not switch workspace. Try again.");
    }
    finally { setPending(false); }
  }
  return <div className="app-workspace-control">
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" />} disabled={pending} aria-label="Switch workspace">
        <WorkspaceAvatar name={current?.name} />
        <span className="app-workspace-current">{pending ? "Switching…" : current?.name || "Workspace"}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="min-w-64">
        {workspaces.map(workspace => <DropdownMenuItem key={workspace.id} onClick={() => switchTo(workspace.id)} disabled={pending}><WorkspaceAvatar name={workspace.name} /><span className="flex-1 truncate">{workspace.name}</span>{workspace.id === selected && <><HugeiconsIcon icon={Tick01Icon} aria-hidden="true" /><span className="sr-only">Current workspace</span></>}</DropdownMenuItem>)}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setCreateOpen(true)} className="cursor-pointer"><HugeiconsIcon icon={Add01Icon} aria-hidden="true" /><span className="flex-1">Create workspace</span></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
  </div>;
}

/** Account dropdown with sign-out and feedback actions. */
function AccountMenu({ user, avatar }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  /** Signs out the current user and returns them to the public home page. */
  async function leave() {
    setPending(true);
    try {
      const result = await signOut();
      if (result.error) throw new Error("Sign out failed");
      router.replace("/"); router.refresh();
    } catch { toast.error("Could not sign out. Try again."); setPending(false); }
  }
  return <div className="app-account-control"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" />} aria-label="Open account menu">{avatar}</DropdownMenuTrigger><DropdownMenuContent align="end" sideOffset={8} className="min-w-64">
    <div className="app-account-details">{avatar}<div><strong>{user.name || "Account"}</strong><span className="app-account-email" title={user.email}>{user.email}</span></div></div>
    <DropdownMenuItem className="cursor-pointer" onClick={() => setFeedbackOpen(true)}><HugeiconsIcon icon={BubbleChatIcon} aria-hidden="true" /><span className="flex-1">Send feedback</span></DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={leave} disabled={pending}><HugeiconsIcon icon={Logout01Icon} aria-hidden="true" />{pending ? "Signing out…" : "Sign out"}</DropdownMenuItem>
  </DropdownMenuContent></DropdownMenu><FeedbackForm user={user} open={feedbackOpen} onOpenChange={setFeedbackOpen} /></div>;
}

export function AppShell({ children, user, avatar, workspaces, selectedWorkspace }) {
  const pathname = usePathname();
  return <div className="app-frame">
    <a className="product-skip-link" href="#product-content">Skip to content</a>
    <header className="app-header"><div className="app-header-inner">
      <Link prefetch={false} className="app-wordmark" href="/waitlists" aria-label="Waitlyze home"><span className="app-mark" aria-hidden="true"><i /><i /><i /></span></Link>
      <WorkspaceSwitcher workspaces={workspaces} selected={selectedWorkspace} />
      <nav aria-label="Main navigation" className="app-navigation">
        <Link prefetch={false} href="/waitlists" aria-current={pathname.startsWith("/waitlists") ? "page" : undefined}>Overview</Link>
        <Link prefetch={false} href="/settings" aria-current={pathname.startsWith("/settings") ? "page" : undefined}>Settings</Link>
        <Link prefetch={false} href="/changelog" aria-current={pathname.startsWith("/changelog") ? "page" : undefined}>Changelog</Link>
        <Link prefetch={false} href="/docs" target="_blank" rel="noreferrer">Docs<HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" /></Link>
      </nav>
      <AccountMenu user={user} avatar={avatar} />
    </div></header>
    <main id="product-content" tabIndex={-1} className="product-main">{children}</main>
  </div>;
}
