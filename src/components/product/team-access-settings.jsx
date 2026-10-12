"use client";

import { formatProductDate } from "@/lib/product-date.mjs";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { inviteWorkspaceMember, resendWorkspaceInvitation, revokeWorkspaceInvite } from "@/app/actions/workspace-invitations";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { notifySettingsResult, useSettingsFeedback } from "@/components/product/settings-feedback";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

function formatDate(value) {
  return formatProductDate(value, { includeTime: false });
}

export function TeamAccessSettings({ workspaceId, members, invitations, canManage, canInviteAdmins, secureInvitesConfigured }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rowMessage, setRowMessage] = useState("");
  const [rowError, setRowError] = useState("");
  const [rowPending, startTransition] = useTransition();

  function runInvitationAction(operation, invitationId) {
    setRowMessage("");
    setRowError("");
    startTransition(async () => {
      try {
        const result = await operation(invitationId, workspaceId);
        setRowMessage(result.success || "");
        setRowError(result.error || "");
        notifySettingsResult(result);
      } catch {
        const error = "Could not update this invitation. Check your connection and try again.";
        setRowError(error);
        notifySettingsResult({ error });
      }
    });
  }

  return <div className="product-team-settings">
    <div className="product-team-toolbar"><p>{members.length} {members.length === 1 ? "member" : "members"}</p>
      {canManage && secureInvitesConfigured ? <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogTrigger render={<Button variant="outline" />}>Invite member</DialogTrigger>
        <DialogContent>
          <div className="product-team-invitation-dialog">
          <DialogTitle>Invite a member</DialogTitle><DialogDescription>Give a teammate access to this workspace.</DialogDescription>
          <InvitationForm workspaceId={workspaceId} canInviteAdmins={canInviteAdmins} onComplete={() => setInviteOpen(false)} />
          </div>
        </DialogContent>
      </Dialog> : canManage ? <p className="product-help" role="status">Invitations are unavailable. Ask your administrator to configure secure invitations.</p> : <p className="product-help">An owner or admin can invite teammates.</p>}
    </div>

    <section className="product-team-list" aria-labelledby="team-members-heading">
      <h3 id="team-members-heading" className="sr-only">Members</h3>

      <ul>{members.map((member) => <li key={member.userId}>
        <Avatar aria-hidden="true"><AvatarImage src={member.user.image || member.user.imageUrl} alt="" /><AvatarFallback>{(member.user.name || member.user.email || "?").slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
        <span className="product-team-person"><strong>{member.user.name || member.user.email}</strong><span>{member.user.email}</span></span>
        <span className="product-team-role">{member.role.toLowerCase()}</span>
      </li>)}</ul>
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
  useSettingsFeedback(state);
  useEffect(() => { if (state.success) onComplete(); }, [state, onComplete]);
  return <form action={action} className="product-team-invite-form">
    <input type="hidden" name="workspaceId" value={workspaceId} />
    <label className="product-team-field">Email address<Input type="email" name="email" autoComplete="email" required maxLength={254} placeholder="teammate@company.com" aria-invalid={Boolean(state.error)} aria-describedby={state.error ? "team-invite-error" : undefined} /></label>
    <label className="product-team-field">Role<NativeSelect name="role" defaultValue="MEMBER"><NativeSelectOption value="MEMBER">Member</NativeSelectOption>{canInviteAdmins ? <NativeSelectOption value="ADMIN">Admin</NativeSelectOption> : null}</NativeSelect></label>
    <p className="product-help">Members can edit waitlists. Admins can also manage workspace settings.</p>
    {state.error ? <p id="team-invite-error" className="product-team-announcement" role="alert">{state.error}</p> : null}
    <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Sending invitation…" : "Send invitation"}</Button>
  </form>;
}
