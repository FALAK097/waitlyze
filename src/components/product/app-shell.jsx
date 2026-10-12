"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Logout01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { selectWorkspace } from "@/app/actions/settings";
import { notifySettingsResult } from "./settings-feedback";
import { signOut } from "@/lib/auth-client";
import "./app-shell.css";

function WorkspaceSwitcher({ workspaces, selected }) {
  const [pending, setPending] = useState(false);
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
  if (workspaces.length < 2) return <span className="app-workspace-name">{current?.name || "Workspace"}</span>;
  return <div className="app-workspace-control"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" />} disabled={pending} aria-label="Switch workspace">{pending ? "Switching…" : current?.name || "Workspace"}<HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" /></DropdownMenuTrigger><DropdownMenuContent align="start" sideOffset={8}>{workspaces.map(workspace => <DropdownMenuItem key={workspace.id} onClick={() => switchTo(workspace.id)} disabled={pending}><span>{workspace.name}</span>{workspace.id === selected && <><HugeiconsIcon icon={Tick01Icon} aria-hidden="true" /><span className="sr-only">Current workspace</span></>}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></div>;
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
      <Link className="product-wordmark app-wordmark" href="/wait-lists" aria-label="Waitlyze home">Waitlyze<span aria-hidden="true">.</span></Link>
      <WorkspaceSwitcher workspaces={workspaces} selected={selectedWorkspace} />
      <nav aria-label="Main navigation" className="app-navigation">
        <Link href="/wait-lists" aria-current={pathname.startsWith("/wait-lists") ? "page" : undefined}>Waitlists</Link>
        <Link href="/settings" aria-current={pathname.startsWith("/settings") ? "page" : undefined}>Settings</Link>
        <Link href="/docs">Docs</Link>
      </nav>
      <AccountMenu user={user} avatar={avatar} />
    </div></header>
    <div className="app-content-header"><Breadcrumbs pathname={pathname} waitlists={waitlists} settingsSection={pathname === "/settings" ? searchParams.get("section") || "profile" : null} /></div>
    <main id="product-content" tabIndex={-1} className="product-main">{children}</main>
  </div>;
}
