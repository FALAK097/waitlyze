"use client";

import { formatProductDate } from "@/lib/product-date.mjs";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { changeWorkspaceMemberRole, inviteWorkspaceMember, removeWorkspaceMember, resendWorkspaceInvitation, revokeWorkspaceInvite } from "@/app/actions/workspace-invitations";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

function formatDate(value) {
  return formatProductDate(value, { includeTime: false });
}

export function TeamAccessSettings({ workspaceId, members, invitations, canManage, canInviteAdmins, secureInvitesConfigured, currentUserId }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [rowMessage, setRowMessage] = useState("");
  const [rowError, setRowError] = useState("");
  const [rowPending, startTransition] = useTransition();
  const visibleMembers = members.filter((member) => {
    const needle = memberQuery.trim().toLowerCase();
    if (!needle) return true;
    return (member.user.name || "").toLowerCase().includes(needle) || (member.user.email || "").toLowerCase().includes(needle) || member.role.toLowerCase().includes(needle) || "active".includes(needle);
  });
  const visibleInvitations = invitations.filter((invite) => {
    const needle = memberQuery.trim().toLowerCase();
    if (!needle) return true;
    const status = invite.status === "SEND_FAILED" ? "failed" : "pending";
    return (invite.emailNormalized || "").toLowerCase().includes(needle) || invite.role.toLowerCase().includes(needle) || status.includes(needle);
  });

  function runRowAction(operation, ...args) {
    setRowMessage("");
    setRowError("");
    startTransition(async () => {
      try {
        const result = await operation(...args);
        setRowMessage(result.success || "");
        setRowError(result.error || "");
        if (result?.error) toast.add({ title: result.error, type: "error" });
        else if (typeof result?.success === "string") toast.add({ title: result.success, type: "success" });
      } catch {
        const error = "Could not update this workspace. Check your connection and try again.";
        setRowError(error);
        toast.add({ title: error, type: "error" });
      }
    });
  }
  function runInvitationAction(operation, invitationId) {
    runRowAction(operation, invitationId, workspaceId);
  }
  function removeMember(memberUserId, label) {
    if (!window.confirm(`Remove ${label} from this workspace? They will lose access immediately.`)) return;
    runRowAction(removeWorkspaceMember, memberUserId, workspaceId);
  }
  function changeRole(memberUserId, role) {
    runRowAction(changeWorkspaceMemberRole, memberUserId, workspaceId, role);
  }

  return <div className="product-team-settings">
    <div className="product-team-toolbar">
      <div className="product-team-search" role="search">
        <Label className="sr-only" htmlFor="team-member-search">Search members</Label>
        <Input id="team-member-search" type="search" value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="Search" autoComplete="off" maxLength={120} />
      </div>
      {canManage && secureInvitesConfigured ? <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogTrigger render={<Button variant="outline" />}><HugeiconsIcon icon={Add01Icon} aria-hidden="true" />Invite member</DialogTrigger>
        <DialogContent>
          <div className="product-team-invitation-dialog">
          <DialogTitle>Invite a member</DialogTitle><DialogDescription>Give a teammate access to this workspace.</DialogDescription>
          <InvitationForm workspaceId={workspaceId} canInviteAdmins={canInviteAdmins} onComplete={() => setInviteOpen(false)} />
          </div>
        </DialogContent>
      </Dialog> : canManage ? <p className="product-help" role="status">Invitations are unavailable. Ask your administrator to configure secure invitations.</p> : <p className="product-help">An owner or admin can invite teammates.</p>}
    </div>

    <section aria-labelledby="team-members-heading">
      <h3 id="team-members-heading" className="sr-only">Members</h3>
      <div className="product-table-wrap"><Table>
        <TableHeader><TableRow><TableHead scope="col">User</TableHead><TableHead scope="col">Role</TableHead><TableHead scope="col">Status</TableHead><TableHead scope="col">Joined</TableHead><TableHead scope="col"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
        <TableBody>
          {visibleMembers.map((member) => {
            const isSelf = currentUserId && member.userId === currentUserId;
            const label = member.user.name || member.user.email;
            return <TableRow key={member.userId}>
              <TableHead scope="row"><span className="product-team-user"><Avatar aria-hidden="true"><AvatarImage src={member.user.image || member.user.imageUrl} alt="" /><AvatarFallback>{(member.user.name || member.user.email || "?").slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><span className="product-team-person"><strong>{label}{isSelf ? " (you)" : ""}</strong><span>{member.user.email}</span></span></span></TableHead>
              <TableCell>{canManage && !isSelf ? <Select value={member.role} onValueChange={(role) => changeRole(member.userId, role)} disabled={rowPending}><SelectTrigger aria-label={`Change role for ${label}`}><SelectValue>{member.role === "ADMIN" ? "Admin" : "Member"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="MEMBER">Member</SelectItem>{canInviteAdmins ? <SelectItem value="ADMIN">Admin</SelectItem> : null}</SelectContent></Select> : member.role.toLowerCase()}</TableCell>
              <TableCell><span className="product-team-status" data-tone="success"><span aria-hidden="true">●</span>Active</span></TableCell>
              <TableCell>{member.createdAt ? formatDate(member.createdAt) : "—"}</TableCell>
              <TableCell>{canManage && !isSelf && <div className="product-team-actions"><Button type="button" variant="destructive" size="sm" disabled={rowPending} aria-label={`Remove ${label} from the workspace`} onClick={() => removeMember(member.userId, label)}>Remove</Button></div>}</TableCell>
            </TableRow>;
          })}
          {visibleInvitations.map((invite) => {
            const failed = invite.status === "SEND_FAILED";
            return <TableRow key={invite.id}>
              <TableHead scope="row"><span className="product-team-user"><Avatar aria-hidden="true"><AvatarFallback>{(invite.emailNormalized || "?").slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><span className="product-team-person"><strong>{invite.emailNormalized}</strong><span>{failed ? "Email delivery failed · retry available" : `Sent ${formatDate(invite.createdAt)} · expires ${formatDate(invite.expiresAt)}`}</span></span></span></TableHead>
              <TableCell>{invite.role.toLowerCase()}</TableCell>
              <TableCell><span className="product-team-status" data-tone={failed ? "danger" : "info"}><span aria-hidden="true">●</span>{failed ? "Failed" : "Pending"}</span></TableCell>
              <TableCell>{formatDate(invite.createdAt)}</TableCell>
              <TableCell>{canManage && <div className="product-team-actions">
                <Button type="button" variant="outline" size="sm" disabled={rowPending || !secureInvitesConfigured} aria-label={`Resend invitation to ${invite.emailNormalized}`} onClick={() => runInvitationAction(resendWorkspaceInvitation, invite.id)}>Resend</Button>
                <Button type="button" variant="ghost" size="sm" disabled={rowPending} aria-label={`Revoke invitation to ${invite.emailNormalized}`} onClick={() => { if (window.confirm(`Revoke the invitation to ${invite.emailNormalized}?`)) runInvitationAction(revokeWorkspaceInvite, invite.id); }}>Revoke</Button>
              </div>}</TableCell>
            </TableRow>;
          })}
          {!visibleMembers.length && !visibleInvitations.length && <TableRow><TableCell colSpan={5}><p className="product-table-empty">Nobody matches this search.</p></TableCell></TableRow>}
        </TableBody>
      </Table>
      <p className="product-team-results" aria-live="polite">{visibleMembers.length + visibleInvitations.length} of {members.length + invitations.length} {members.length + invitations.length === 1 ? "person" : "people"}</p>
      </div>
    </section>
    <p className="product-team-announcement" role={rowError ? "alert" : "status"} aria-live={rowError ? "assertive" : "polite"}>{rowError || rowMessage || ""}</p>
  </div>;
}

function InvitationForm({ workspaceId, canInviteAdmins, onComplete }) {
  const [state, action, pending] = useActionState(inviteWorkspaceMember, {});
  useEffect(() => {
    if (state?.error) toast.add({ title: state.error, type: "error" });
    else if (typeof state?.success === "string") toast.add({ title: state.success, type: "success" });
  }, [state]);
  useEffect(() => { if (state.success) onComplete(); }, [state, onComplete]);
  return <form action={action} className="product-team-invite-form">
    <input type="hidden" name="workspaceId" value={workspaceId} />
    <label className="product-team-field">Email address<Input type="email" name="email" autoComplete="email" required maxLength={254} placeholder="teammate@company.com" aria-invalid={Boolean(state.error)} aria-describedby={state.error ? "team-invite-error" : undefined} /></label>
    <div className="product-team-field"><Label htmlFor="team-invite-role">Role</Label><Select name="role" defaultValue="MEMBER"><SelectTrigger id="team-invite-role"><SelectValue>Member</SelectValue></SelectTrigger><SelectContent><SelectItem value="MEMBER">Member</SelectItem>{canInviteAdmins ? <SelectItem value="ADMIN">Admin</SelectItem> : null}</SelectContent></Select></div>
    <p className="product-help">Members can edit waitlists. Admins can also manage workspace settings.</p>
    {state.error ? <p id="team-invite-error" className="product-team-announcement" role="alert">{state.error}</p> : null}
    <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Sending invitation…" : "Send invitation"}</Button>
  </form>;
}
