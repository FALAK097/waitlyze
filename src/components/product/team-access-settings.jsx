"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/product/button";
import { Input } from "@/components/product/input";
import { inviteWorkspaceMember, resendWorkspaceInvitation, revokeWorkspaceInvite } from "@/app/actions/workspace-invitations";
import { Avatar } from "@/components/product/avatar";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function TeamAccessSettings({ workspaceId, members, invitations, canManage, canInviteAdmins, secureInvitesConfigured }) {
  const [state, action, pending] = useActionState(inviteWorkspaceMember, {});
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
      } catch {
        setRowError("Could not update this invitation. Check your connection and try again.");
      }
    });
  }

  return <div className="product-team-settings">
    <p className="product-help">Invite people who help run this workspace. Invitations expire after seven days and only grant the role shown here.</p>
    {canManage && secureInvitesConfigured ? <form action={action} className="product-team-invite-form">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label className="product-team-field">Email address
        <Input type="email" name="email" autoComplete="email" required maxLength={254} placeholder="teammate@company.com" aria-describedby="team-email-help" />
      </label>
      <label className="product-team-field">Role
        <select name="role" defaultValue="MEMBER">
          <option value="MEMBER">Member · edit waitlists and view subscribers</option>
          {canInviteAdmins ? <option value="ADMIN">Admin · manage workspace and sending</option> : null}
        </select>
      </label>
      <p id="team-email-help" className="product-help">Admins can invite members. Only owners can invite admins.</p>
      <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Sending invite…" : "Send invitation"}</Button>
      <p className="product-team-announcement" role={state.error ? "alert" : "status"} aria-live={state.error ? "assertive" : "polite"}>{state.error || state.success || ""}</p>
    </form> : canManage ? <p className="product-team-configuration" role="status">Secure invitations are unavailable until the server-side invitation encryption key is configured.</p> : <p className="product-help">Only workspace owners and admins can invite or manage teammates.</p>}

    <section className="product-team-list" aria-labelledby="team-members-heading">
      <h3 id="team-members-heading">Members <span>{members.length}</span></h3>
      {members.length === 1 ? <p className="product-help">You’re the only member in this workspace.</p> : null}
      <ul>{members.map((member) => <li key={member.userId}>
        <Avatar id={member.userId} src={member.user.image || member.user.imageUrl} size={36} />
        <span className="product-team-person"><strong>{member.user.name || member.user.email}</strong><span>{member.user.email}</span></span>
        <span className="product-team-role">{member.role.toLowerCase()}</span>
      </li>)}</ul>
    </section>

    {canManage ? <section className="product-team-list" aria-labelledby="team-pending-heading">
      <h3 id="team-pending-heading">Pending invitations <span>{invitations.length}/50</span></h3>
      {invitations.length ? <ul>{invitations.map((invite) => <li key={invite.id}>
        <span className="product-team-pending-mark" aria-hidden="true">↗</span>
        <span className="product-team-person"><strong>{invite.emailNormalized}</strong><span>{invite.status === "SEND_FAILED" ? "Email delivery failed · retry available" : `Sent ${formatDate(invite.createdAt)} · expires ${formatDate(invite.expiresAt)}`}</span></span>
        <span className="product-team-role">{invite.role.toLowerCase()}</span>
        <div className="product-team-actions">
          <Button type="button" variant="outline" disabled={rowPending || !secureInvitesConfigured} aria-label={`Resend invitation to ${invite.emailNormalized}`} onClick={() => runInvitationAction(resendWorkspaceInvitation, invite.id)}>Resend</Button>
          <Button type="button" variant="ghost" disabled={rowPending} aria-label={`Revoke invitation to ${invite.emailNormalized}`} onClick={() => runInvitationAction(revokeWorkspaceInvite, invite.id)}>Revoke</Button>
        </div>
      </li>)}</ul> : <p className="product-help">No pending invitations.</p>}
      <p className="product-team-announcement" role={rowError ? "alert" : "status"} aria-live={rowError ? "assertive" : "polite"}>{rowError || rowMessage || ""}</p>
    </section> : null}
  </div>;
}
