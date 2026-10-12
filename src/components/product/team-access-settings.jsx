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
import { inviteWorkspaceMember, resendWorkspaceInvitation, revokeWorkspaceInvite } from "@/app/actions/workspace-invitations";
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
    return (member.user.name || "").toLowerCase().includes(needle) || (member.user.email || "").toLowerCase().includes(needle);
  });

  function runInvitationAction(operation, invitationId) {
    setRowMessage("");
    setRowError("");
    startTransition(async () => {
      try {
        const result = await operation(invitationId, workspaceId);
        setRowMessage(result.success || "");
        setRowError(result.error || "");
        { const notificationResult = result; if (notificationResult?.error) toast.add({ title: notificationResult.error, type: "error" }); else if (typeof notificationResult?.success === "string") toast.add({ title: notificationResult.success, type: "success" }); };
      } catch {
        const error = "Could not update this invitation. Check your connection and try again.";
        setRowError(error);
        { const notificationResult = { error }; if (notificationResult?.error) toast.add({ title: notificationResult.error, type: "error" }); else if (typeof notificationResult?.success === "string") toast.add({ title: notificationResult.success, type: "success" }); };
      }
    });
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
        <TableHeader><TableRow><TableHead scope="col">User</TableHead><TableHead scope="col">Role</TableHead><TableHead scope="col">Joined</TableHead></TableRow></TableHeader>
        <TableBody>
          {visibleMembers.map((member) => {
            const isSelf = currentUserId && member.userId === currentUserId;
            return <TableRow key={member.userId}>
              <TableHead scope="row"><span className="product-team-user"><Avatar aria-hidden="true"><AvatarImage src={member.user.image || member.user.imageUrl} alt="" /><AvatarFallback>{(member.user.name || member.user.email || "?").slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><span className="product-team-person"><strong>{member.user.name || member.user.email}{isSelf ? " (you)" : ""}</strong><span>{member.user.email}</span></span></span></TableHead>
              <TableCell>{member.role.toLowerCase()}</TableCell>
              <TableCell>{member.createdAt ? formatDate(member.createdAt) : "—"}</TableCell>
            </TableRow>;
          })}
          {!visibleMembers.length && <TableRow><TableCell colSpan={3}><p className="product-table-empty">No members match this search.</p></TableCell></TableRow>}
        </TableBody>
      </Table>
      <p className="product-team-results" aria-live="polite">{visibleMembers.length} of {members.length} {members.length === 1 ? "member" : "members"}</p>
      </div>
    </section>

    {canManage ? <section className="product-team-list" aria-labelledby="team-pending-heading">
      <h3 id="team-pending-heading">Pending invitations <span>({invitations.length})</span></h3>
      {invitations.length ? <ul>{invitations.map((invite) => <li key={invite.id}>

        <span className="product-team-person"><strong>{invite.emailNormalized}</strong><span>{invite.status === "SEND_FAILED" ? "Email delivery failed · retry available" : `Sent ${formatDate(invite.createdAt)} · expires ${formatDate(invite.expiresAt)}`}</span></span>
        <span className="product-team-role">{invite.role.toLowerCase()}</span>
        <div className="product-team-actions">
          <Button type="button" variant="outline" disabled={rowPending || !secureInvitesConfigured} aria-label={`Resend invitation to ${invite.emailNormalized}`} onClick={() => runInvitationAction(resendWorkspaceInvitation, invite.id)}>Resend</Button>
          <Button type="button" variant="ghost" disabled={rowPending} aria-label={`Revoke invitation to ${invite.emailNormalized}`} onClick={() => { if (window.confirm(`Revoke the invitation to ${invite.emailNormalized}?`)) runInvitationAction(revokeWorkspaceInvite, invite.id); }}>Revoke</Button>
        </div>
      </li>)}</ul> : <p className="product-help">No pending invitations.</p>}
      <p className="product-team-announcement" role={rowError ? "alert" : "status"} aria-live={rowError ? "assertive" : "polite"}>{rowError || rowMessage || ""}</p>
    </section> : null}
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
