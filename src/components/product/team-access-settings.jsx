"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  changeWorkspaceMemberRole,
  inviteWorkspaceMember,
  removeWorkspaceMember,
  resendWorkspaceInvitation,
  revokeWorkspaceInvite,
} from "@/app/actions/workspace-invitations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatProductDate } from "@/lib/product-date.mjs";

function formatDate(value) {
  return formatProductDate(value, { includeTime: false });
}

export function TeamAccessSettings({
  workspaceId,
  members,
  invitations,
  canManage,
  canInviteAdmins,
  secureInvitesConfigured,
  currentUserId,
  isPersonalWorkspace = false,
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [rowPending, startTransition] = useTransition();
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const visibleMembers = members.filter((member) => {
    const needle = memberQuery.trim().toLowerCase();
    if (!needle) return true;
    return (
      (member.user.name || "").toLowerCase().includes(needle) ||
      (member.user.email || "").toLowerCase().includes(needle) ||
      member.role.toLowerCase().includes(needle) ||
      "active".includes(needle)
    );
  });
  const visibleInvitations = invitations.filter((invite) => {
    const needle = memberQuery.trim().toLowerCase();
    if (!needle) return true;
    const status = invite.status === "SEND_FAILED" ? "failed" : "pending";
    return (
      (invite.emailNormalized || "").toLowerCase().includes(needle) ||
      invite.role.toLowerCase().includes(needle) ||
      status.includes(needle)
    );
  });

  function runRowAction(operation, ...args) {
    startTransition(async () => {
      try {
        const result = await operation(...args);
        if (result?.error) toast.error(result.error);
        else if (typeof result?.success === "string") {
          toast.success(result.success);
          setRevokeTarget(null);
          setRemoveTarget(null);
        }
      } catch {
        toast.error("Could not update this workspace. Check your connection and try again.");
      }
    });
  }
  function runInvitationAction(operation, invitationId) {
    runRowAction(operation, invitationId, workspaceId);
  }
  function confirmRemove() {
    if (!removeTarget) return;
    setRemoveTarget(null);
    runRowAction(removeWorkspaceMember, removeTarget.userId, workspaceId);
  }
  function confirmRevoke() {
    if (!revokeTarget) return;
    const target = revokeTarget;
    setRevokeTarget(null);
    runInvitationAction(revokeWorkspaceInvite, target.id);
  }
  function changeRole(memberUserId, role) {
    runRowAction(changeWorkspaceMemberRole, memberUserId, workspaceId, role);
  }

  return (
    <div className="grid grid-cols-1 gap-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {isPersonalWorkspace ? null : (
          <div className="max-w-70 min-w-0 flex-1" role="search">
            <Label className="sr-only" htmlFor="team-member-search">
              Search members
            </Label>
            <Input
              id="team-member-search"
              type="search"
              value={memberQuery}
              onChange={(event) => setMemberQuery(event.target.value)}
              placeholder="Search"
              autoComplete="off"
              maxLength={120}
            />
          </div>
        )}
        {isPersonalWorkspace ? (
          <p className="m-0 text-sm text-product-text-secondary tabular-nums">
            Personal workspaces are just for you. Create a shared workspace from the workspace
            switcher to invite teammates.
          </p>
        ) : canManage && secureInvitesConfigured ? (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
              <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
              Invite member
            </DialogTrigger>
            <DialogContent>
              <div className="max-w-120 [&_h2]:mt-0 [&_h2]:mr-10 [&_h2]:mb-2 [&_h2]:text-xl [&_p]:mt-0 [&_p]:mb-6">
                <DialogTitle>Invite a member</DialogTitle>
                <DialogDescription>Give a teammate access to this workspace.</DialogDescription>
                <InvitationForm
                  workspaceId={workspaceId}
                  canInviteAdmins={canInviteAdmins}
                  onComplete={() => setInviteOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        ) : canManage ? (
          <p className="m-0 text-sm text-product-text-secondary tabular-nums" role="status">
            Invitations are unavailable. Ask your administrator to configure secure invitations.
          </p>
        ) : (
          <p className="m-0 text-sm text-product-text-secondary tabular-nums">
            An owner or admin can invite teammates.
          </p>
        )}
      </div>

      <section aria-labelledby="team-members-heading">
        <h3 id="team-members-heading" className="sr-only">
          Members
        </h3>
        <div
          className={[
            "relative overflow-x-auto rounded-xl border border-product-border-subtle bg-product-bg-surface no-scrollbar",
            "[&_th]:px-5 [&_th]:py-4 [&_th]:text-left",
            "[&_th]:border-b [&_th]:border-product-border-subtle",
            "[&_th:first-child]:w-9/25 [&_th:nth-child(2)]:w-4/25",
            "[&_th:nth-child(3)]:w-7/50 [&_th:nth-child(4)]:w-4/25",
            "[&_td]:px-5 [&_td]:py-4 [&_td]:border-b [&_td]:border-product-border-subtle",
            "[&_td]:text-product-text-secondary [&_tbody_td:nth-child(2)]:capitalize",
            "max-[767px]:[&_table]:min-w-210",
            "max-[767px]:[&_th]:px-4 max-[767px]:[&_th]:py-3.5",
            "max-[767px]:[&_td]:px-4 max-[767px]:[&_td]:py-3.5",
          ].join(" ")}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">User</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Joined</TableHead>
                <TableHead scope="col">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleMembers.map((member) => {
                const isSelf = currentUserId && member.userId === currentUserId;
                const label = member.user.name || member.user.email;
                return (
                  <TableRow key={member.userId}>
                    <TableHead scope="row">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar aria-hidden="true">
                          <AvatarImage src={member.user.image || member.user.imageUrl} alt="" />
                          <AvatarFallback>
                            {(member.user.name || member.user.email || "?")
                              .slice(0, 1)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="grid min-w-32 flex-1 gap-0.5 wrap-anywhere">
                          <strong className="block text-sm font-medium">
                            {label}
                            {isSelf ? " (you)" : ""}
                          </strong>
                          <span className="block text-caption leading-relaxed text-product-text-secondary">
                            {member.user.email}
                          </span>
                        </span>
                      </span>
                    </TableHead>
                    <TableCell>
                      {canManage && !isSelf ? (
                        <Select
                          value={member.role}
                          onValueChange={(role) => changeRole(member.userId, role)}
                          disabled={rowPending}
                        >
                          <SelectTrigger aria-label={`Change role for ${label}`}>
                            <SelectValue>
                              {member.role === "ADMIN" ? "Admin" : "Member"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            {canInviteAdmins ? <SelectItem value="ADMIN">Admin</SelectItem> : null}
                          </SelectContent>
                        </Select>
                      ) : (
                        member.role.toLowerCase()
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap text-product-text-primary"
                        data-tone="success"
                      >
                        <span aria-hidden="true" className="text-micro text-product-success-text">
                          ●
                        </span>
                        Active
                      </span>
                    </TableCell>
                    <TableCell>{member.createdAt ? formatDate(member.createdAt) : "—"}</TableCell>
                    <TableCell>
                      {canManage && !isSelf && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={rowPending}
                            aria-label={`Remove ${label} from the workspace`}
                            onClick={() => setRemoveTarget({ userId: member.userId, label })}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {visibleInvitations.map((invite) => {
                const failed = invite.status === "SEND_FAILED";
                return (
                  <TableRow key={invite.id}>
                    <TableHead scope="row">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar aria-hidden="true">
                          <AvatarFallback>
                            {(invite.emailNormalized || "?").slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="grid min-w-32 flex-1 gap-0.5 wrap-anywhere">
                          <strong className="block text-sm font-medium">
                            {invite.emailNormalized}
                          </strong>
                          <span className="block text-caption leading-relaxed text-product-text-secondary">
                            {failed
                              ? "Email delivery failed"
                              : `Sent ${formatDate(invite.createdAt)} · expires ${formatDate(invite.expiresAt)}`}
                          </span>
                        </span>
                      </span>
                    </TableHead>
                    <TableCell>{invite.role.toLowerCase()}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap text-product-text-primary"
                        data-tone={failed ? "danger" : "info"}
                      >
                        <span
                          aria-hidden="true"
                          className={`text-micro ${
                            failed ? "text-product-danger-text" : "text-product-text-muted"
                          }`}
                        >
                          ●
                        </span>
                        {failed ? "Failed" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(invite.createdAt)}</TableCell>
                    <TableCell>
                      {canManage && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={rowPending || !secureInvitesConfigured}
                            aria-label={`Resend invitation to ${invite.emailNormalized}`}
                            onClick={() =>
                              runInvitationAction(resendWorkspaceInvitation, invite.id)
                            }
                          >
                            Resend
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={rowPending}
                            aria-label={`Revoke invitation to ${invite.emailNormalized}`}
                            onClick={() => setRevokeTarget(invite)}
                          >
                            Revoke
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!visibleMembers.length && !visibleInvitations.length && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <p className="m-0 py-8 text-center text-product-text-secondary">
                      Nobody matches this search.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="mx-1 mt-3 mb-0 text-caption text-product-text-secondary" aria-live="polite">
          {visibleMembers.length + visibleInvitations.length} of{" "}
          {members.length + invitations.length}{" "}
          {members.length + invitations.length === 1 ? "person" : "people"}
        </p>
      </section>
      <AlertDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget
                ? `Revoke the invitation to ${revokeTarget.emailNormalized}? They will not be able to join with it.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRevoke} disabled={rowPending}>
              Revoke invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget
                ? `Remove ${removeTarget.label} from this workspace? They will lose access immediately.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemove} disabled={rowPending}>
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InvitationForm({ workspaceId, canInviteAdmins, onComplete }) {
  const [state, action, pending] = useActionState(inviteWorkspaceMember, {});
  const [role, setRole] = useState("MEMBER");
  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (typeof state?.success === "string") toast.success(state.success);
  }, [state]);
  useEffect(() => {
    if (state.success) onComplete();
  }, [state, onComplete]);
  return (
    <form action={action} className="grid gap-4.5 border-0 bg-transparent p-0">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label className="grid gap-2 text-sm font-medium">
        Email address
        <Input
          type="email"
          name="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="teammate@company.com"
          aria-invalid={Boolean(state.error)}
        />
      </label>
      <div className="grid gap-2 text-sm font-medium">
        <Label htmlFor="team-invite-role">Role</Label>
        <Select name="role" value={role} onValueChange={setRole}>
          <SelectTrigger id="team-invite-role">
            <SelectValue>{role === "ADMIN" ? "Admin" : "Member"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER">Member</SelectItem>
            {canInviteAdmins ? <SelectItem value="ADMIN">Admin</SelectItem> : null}
          </SelectContent>
        </Select>
      </div>
      <p className="mb-4! text-sm leading-relaxed text-product-text-secondary">
        Members can edit waitlists. Admins can also manage workspace settings.
      </p>
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Sending invitation…" : "Send invitation"}
      </Button>
    </form>
  );
}
