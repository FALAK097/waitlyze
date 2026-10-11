"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown, ChevronRight, LogOut } from "lucide-react";
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
  return <Menu.Root><Menu.Trigger className="app-workspace-trigger" disabled={pending} aria-label="Switch workspace">{pending ? "Switching…" : current?.name || "Workspace"}<ChevronDown aria-hidden="true" /></Menu.Trigger><Menu.Portal><Menu.Positioner side="bottom" align="start" sideOffset={8} className="app-menu-positioner"><Menu.Popup className="app-workspace-menu product-ui">{workspaces.map(workspace => <Menu.Item key={workspace.id} className="app-account-item" onClick={() => switchTo(workspace.id)} disabled={pending}><span>{workspace.name}</span>{workspace.id === selected && <><Check aria-hidden="true" /><span className="app-sr-only">Current workspace</span></>}</Menu.Item>)}</Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root>;
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
  return <nav aria-label="Breadcrumb" className="app-breadcrumbs"><ol>{crumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`}>{index > 0 && <ChevronRight aria-hidden="true" />}{index === crumbs.length - 1 ? <span aria-current="page">{crumb.label}</span> : <Link href={crumb.href}>{crumb.label}</Link>}</li>)}</ol></nav>;
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
  return <Menu.Root><Menu.Trigger className="app-account-trigger" aria-label="Open account menu">{avatar}</Menu.Trigger><Menu.Portal><Menu.Positioner side="bottom" align="end" sideOffset={8} className="app-menu-positioner"><Menu.Popup className="app-account-menu product-ui">
    <div className="app-account-details">{avatar}<div><strong>{user.name || "Account"}</strong><span>{user.email}</span></div></div>
    <Menu.Item className="app-account-item" onClick={leave} disabled={pending}><LogOut aria-hidden="true" />{pending ? "Signing out…" : "Sign out"}</Menu.Item>
  </Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root>;
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
