"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUpRight01Icon,
  BubbleChatIcon,
  Logout01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { createWorkspace, selectWorkspace } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const FeedbackForm = dynamic(() =>
  import("@/components/product/feedback-form").then((module) => module.FeedbackForm),
);

function WorkspaceAvatar({ name }) {
  return (
    <span
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-product-border-subtle bg-product-bg-inset text-xs font-semibold text-product-text-secondary"
      aria-hidden="true"
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

function CreateWorkspaceDialog({ open, onOpenChange }) {
  const [state, action, pending] = useActionState(createWorkspace, null);
  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Create workspace</DialogTitle>
        <Separator />
        <form action={action} className="grid gap-4">
          <div className="product-field">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              name="name"
              required
              minLength={1}
              maxLength={80}
              placeholder="Acme Inc."
              disabled={pending}
              autoComplete="off"
              aria-invalid={!!state?.error}
            />
          </div>
          <Separator />
          <div className="product-actions">
            <DialogClose render={<Button variant="outline" />} disabled={pending}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WorkspaceSwitcher({ workspaces, selected }) {
  const [pending, setPending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const current = workspaces.find((workspace) => workspace.id === selected);
  async function switchTo(id) {
    if (id === selected || pending) return;
    setPending(true);
    const form = new FormData();
    form.set("workspaceId", id);
    try {
      await selectWorkspace(form);
    } catch (error) {
      // Server-action redirects throw; let navigation proceed.
      if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
      toast.error("Could not switch workspace. Try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="order-1 max-w-75 min-w-0 max-md:max-w-none max-md:flex-1 [&>button]:max-w-full [&>button]:gap-2 [&>button[data-popup-open]_svg:last-child]:rotate-180">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" />}
          disabled={pending}
          aria-label="Switch workspace"
        >
          <WorkspaceAvatar name={current?.name} />
          <span className="truncate font-medium">
            {pending ? "Switching…" : current?.name || "Workspace"}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="text-product-text-secondary transition-transform duration-150"
            aria-hidden="true"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8} className="min-w-64">
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => switchTo(workspace.id)}
              disabled={pending}
            >
              <WorkspaceAvatar name={workspace.name} />
              <span className="flex-1 truncate">{workspace.name}</span>
              {workspace.id === selected && (
                <>
                  <HugeiconsIcon icon={Tick01Icon} aria-hidden="true" />
                  <span className="sr-only">Current workspace</span>
                </>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)} className="cursor-pointer">
            <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
            <span className="flex-1">Create workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
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
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Try again.");
      setPending(false);
    }
  }
  return (
    <div className="order-3 ms-auto flex shrink-0 items-center gap-2 max-md:order-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Send feedback"
                onClick={() => setFeedbackOpen(true)}
              />
            }
          >
            <HugeiconsIcon icon={BubbleChatIcon} className="size-6" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Send Feedback</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" />}
          aria-label="Open account menu"
        >
          {avatar}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="min-w-64">
          <div className="flex max-w-80 items-center gap-3 px-2 pt-3 pb-4 whitespace-nowrap">
            {avatar}
            <div className="grid min-w-0 flex-1 gap-1">
              <strong className="text-sm font-semibold break-words">
                {user.name || "Account"}
              </strong>
              <span
                className="block max-w-full truncate text-xs text-product-text-secondary"
                title={user.email}
              >
                {user.email}
              </span>
            </div>
          </div>
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onClick={leave}
            disabled={pending}
          >
            <HugeiconsIcon icon={Logout01Icon} aria-hidden="true" />
            {pending ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {feedbackOpen && (
        <FeedbackForm user={user} open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      )}
    </div>
  );
}

export function AppShellControls({ user, avatar, workspaces, selectedWorkspace }) {
  return (
    <>
      <WorkspaceSwitcher workspaces={workspaces} selected={selectedWorkspace} />
      <AccountMenu user={user} avatar={avatar} />
    </>
  );
}

export function AppShell({ children, headerControls }) {
  const pathname = usePathname();
  const navLinkClass = cn(
    "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm whitespace-nowrap text-product-text-secondary no-underline transition-colors duration-150 hover:bg-product-bg-inset hover:text-product-text-primary md:flex-none",
  );
  return (
    <div className="min-h-dvh bg-white">
      <a
        className="absolute top-2 left-2 z-50 -translate-y-full bg-product-bg-surface p-3 focus:translate-y-0"
        href="#product-content"
      >
        Skip to content
      </a>
      <header className="border-b border-product-border-subtle bg-white">
        <div className="mx-auto flex min-h-18 max-w-288 items-center gap-4 px-8 py-3 max-[359px]:gap-2 max-[359px]:px-4 max-md:flex-wrap max-md:gap-3 max-md:px-5">
          <Link
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-start rounded-lg"
            href="/waitlists"
            aria-label="Waitlyze home"
          >
            <span className="inline-flex h-6 -skew-x-12 items-center gap-1" aria-hidden="true">
              <i className="block h-3.5 w-1.25 rounded-xs bg-product-accent-solid" />
              <i className="block h-5.5 w-1.25 rounded-xs bg-product-accent-solid" />
              <i className="block h-4.25 w-1.25 rounded-xs bg-product-accent-solid" />
            </span>
          </Link>
          <div className="contents">{headerControls}</div>
          <nav
            aria-label="Main navigation"
            className="order-2 ms-auto flex min-w-0 items-center gap-2 max-md:order-4 max-md:ms-0 max-md:me-0 max-md:w-full max-md:justify-between max-md:gap-1"
          >
            <Link
              className={cn(
                navLinkClass,
                pathname.startsWith("/waitlists") &&
                  "font-semibold text-product-text-primary underline decoration-product-accent-solid underline-offset-6",
              )}
              href="/waitlists"
              aria-current={pathname.startsWith("/waitlists") ? "page" : undefined}
            >
              Overview
            </Link>
            <Link
              className={cn(
                navLinkClass,
                pathname.startsWith("/settings") &&
                  "font-semibold text-product-text-primary underline decoration-product-accent-solid underline-offset-6",
              )}
              href="/settings"
              aria-current={pathname.startsWith("/settings") ? "page" : undefined}
            >
              Settings
            </Link>
            <Link
              prefetch={false}
              className={navLinkClass}
              href="/docs"
              target="_blank"
              rel="noreferrer"
            >
              Docs
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>
      <main
        id="product-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-288 px-8 pt-6 pb-28 max-[359px]:px-4 max-md:px-5"
      >
        {children}
      </main>
    </div>
  );
}
