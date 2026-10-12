"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowDown01Icon, Logout01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { Fragment, useActionState, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkspace, selectWorkspace } from "@/app/actions/settings";
import { notifySettingsResult } from "./settings-feedback";
import { signOut } from "@/lib/auth-client";
import "./app-shell.css";

function WorkspaceAvatar({ name }) {
  return <span className="app-workspace-avatar" aria-hidden="true">{(name || "?").slice(0, 1).toUpperCase()}</span>;
}

function CreateWorkspaceDialog({ open, onOpenChange }) {
  const [state, action, pending] = useActionState(createWorkspace, null);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogTitle>Create workspace</DialogTitle>
      <DialogDescription>Workspaces keep waitlists, subscribers, and settings separate.</DialogDescription>
      <form action={action} className="app-workspace-create">
        <div className="product-field">
          <Label htmlFor="workspace-name">Workspace name</Label>
          <Input id="workspace-name" name="name" required minLength={1} maxLength={80} placeholder="Acme Inc" disabled={pending} autoComplete="off" aria-invalid={!!state?.error} aria-describedby={state?.error ? "workspace-name-error" : undefined} />
        </div>
        {state?.error && <p id="workspace-name-error" role="alert" className="product-field-error">{state.error}</p>}
        <div className="product-actions">
          <DialogClose render={<Button variant="outline" />} disabled={pending}>Cancel</DialogClose>
          <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create workspace"}</Button>
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
    catch { notifySettingsResult({ error: "Could not switch workspace. Try again." }); }
    finally { setPending(false); }
  }
  return <div className="app-workspace-control">
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" />} disabled={pending} aria-label="Switch workspace">
        <WorkspaceAvatar name={current?.name} />
        <span className="app-workspace-current">{pending ? "Switching…" : current?.name || "Workspace"}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8}>
        {workspaces.map(workspace => <DropdownMenuItem key={workspace.id} onClick={() => switchTo(workspace.id)} disabled={pending}><WorkspaceAvatar name={workspace.name} /><span>{workspace.name}</span>{workspace.id === selected && <><HugeiconsIcon icon={Tick01Icon} aria-hidden="true" /><span className="sr-only">Current workspace</span></>}</DropdownMenuItem>)}
        <DropdownMenuItem onClick={() => setCreateOpen(true)} className="cursor-pointer"><HugeiconsIcon icon={Add01Icon} aria-hidden="true" /><span>Create workspace</span></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
  </div>;
}

function Breadcrumbs({ pathname, waitlists, settingsSection }) {
  const segments = pathname.split("/").filter(Boolean);
  const isSettings = segments[0] === "settings";
  const crumbs = [{ label: isSettings ? "Settings" : "Waitlists", href: isSettings ? "/settings" : "/wait-lists" }];
  if (isSettings && settingsSection) crumbs.push({ label: ({ profile: "Profile", workspace: "Workspace", team: "Members", integrations: "Integrations" })[settingsSection] || "Profile" });
  if (segments[1]) {
    if (isSettings) crumbs.push({ label: ({ profile: "Profile", workspace: "Workspace", members: "Members", integrations: "Integrations", developers: "Developers" })[segments[1]] || "Settings" });
    else if (segments[1] === "new") crumbs.push({ label: "Create waitlist" });
    else {
      crumbs.push({ label: waitlists.find(item => item.id === segments[1])?.name || "Waitlist", href: `/wait-lists/${segments[1]}` });
      if (segments[2]) crumbs.push({ label: ({ subscribers: "Subscribers", analytics: "Analytics", edit: "Editor", emails: "Emails", settings: "Settings", automations: "Automations", broadcasts: "Broadcasts" })[segments[2]] || "Overview" });
    }
  }
  if (crumbs.length < 2) return null;
  return <div className="app-breadcrumbs"><Breadcrumb><BreadcrumbList>{crumbs.map((crumb, index) => <Fragment key={`${crumb.label}-${index}`}>{index > 0 && <BreadcrumbSeparator />}<BreadcrumbItem>{index === crumbs.length - 1 ? <BreadcrumbPage>{crumb.label}</BreadcrumbPage> : <BreadcrumbLink render={<Link href={crumb.href} />}>{crumb.label}</BreadcrumbLink>}</BreadcrumbItem></Fragment>)}</BreadcrumbList></Breadcrumb></div>;
}

function AccountMenu({ user, avatar }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function leave() {
    setPending(true);
    try {
      const result = await signOut();
      if (result.error) throw new Error("Sign out failed");
      router.replace("/"); router.refresh();
    } catch { notifySettingsResult({ error: "Could not sign out. Try again." }); setPending(false); }
  }
  return <div className="app-account-control"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" />} aria-label="Open account menu">{avatar}</DropdownMenuTrigger><DropdownMenuContent align="end" sideOffset={8}>
    <div className="app-account-details">{avatar}<div><strong>{user.name || "Account"}</strong><span>{user.email}</span></div></div>
    <DropdownMenuItem onClick={leave} disabled={pending}><HugeiconsIcon icon={Logout01Icon} aria-hidden="true" />{pending ? "Signing out…" : "Sign out"}</DropdownMenuItem>
  </DropdownMenuContent></DropdownMenu></div>;
}

export function AppShell({ children, user, avatar, waitlists, workspaces, selectedWorkspace }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return <div className="app-frame">
    <a className="product-skip-link" href="#product-content">Skip to content</a>
    <header className="app-header"><div className="app-header-inner">
      <Link className="app-wordmark" href="/wait-lists" aria-label="Waitlyze home"><span className="app-mark" aria-hidden="true"><i /><i /><i /></span></Link>
      <WorkspaceSwitcher workspaces={workspaces} selected={selectedWorkspace} />
      <nav aria-label="Main navigation" className="app-navigation">
        <Link href="/wait-lists" aria-current={pathname.startsWith("/wait-lists") ? "page" : undefined}>Overview</Link>
        <Link href="/settings" aria-current={pathname.startsWith("/settings") ? "page" : undefined}>Settings</Link>
        <Link href="/docs" target="_blank" rel="noreferrer">Docs</Link>
      </nav>
      <AccountMenu user={user} avatar={avatar} />
    </div></header>
    <div className="app-content-header"><Breadcrumbs pathname={pathname} waitlists={waitlists} settingsSection={pathname === "/settings" ? searchParams.get("section") || "profile" : null} /></div>
    <main id="product-content" tabIndex={-1} className="product-main">{children}</main>
  </div>;
}
