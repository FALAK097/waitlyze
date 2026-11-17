# Workspace entitlements and invitation edge cases

This note records the product decisions behind the workspace/plan fixes. It is intentionally
short: the code and copy are the source of truth.

## Problem

The Free plan was documented and implemented as "1 waitlist, 100 signups, 1 member" **per
workspace**, while workspaces themselves were unlimited. That produced three classes of bugs:

1. A Free user could create unlimited workspaces, multiplying the Free allowances (1 waitlist and
   100 lifetime signups each) and resetting the lifetime signup counter by deleting a workspace.
2. Pro could be bought on a personal workspace, which refused invitations. Creating a shared
   workspace afterwards started on Free, so the same person had to pay twice to collaborate.
3. The invitation flow had no downgrade story: pending invitations created under Pro failed on
   accept after a downgrade, and ownership could never be transferred even though several error
   messages told owners to "make another member an owner first".

## Decisions

### 1. Free includes one workspace, Pro is unlimited

`PLAN_ENTITLEMENTS` gains a `workspaces` limit (`FREE: 1`, `PRO: null`). The limit counts
**owned** workspaces, not memberships: joining a Pro workspace someone else owns never counts
against your own allowance.

The plan that governs workspace creation is the best plan among the workspaces the user owns. A
user with no Pro workspace may own exactly one workspace; a user who owns at least one Pro
workspace may create more. Existing accounts above the limit are grandfathered: nothing is
deleted, but no new workspace is created until they are back within the limit.

Because a Free user always owns exactly one workspace (the account's first workspace) and that
workspace cannot be deleted, the delete-and-recreate signup reset disappears.

### 2. The account's first workspace is a normal workspace

`personalOwnerId` keeps two meanings only: it marks the workspace that is created lazily on first
sign-in, and it prevents deleting that workspace. It no longer makes the workspace private, so
invitations work there. In user-facing copy it is called the account's first workspace.

This is what makes the reported flow work end to end: a user upgrades their first workspace, then
invites teammates there. No second workspace and no second payment are needed.

### 3. Ownership is transferable

An owner can promote another member to owner. The previous owner becomes an admin. The target
must be an existing member (never a pending invitee or the caller) and, on Free, must not already
own a workspace.

Transfers are blocked while the workspace has a live Pro subscription, a provider subscription that
still needs reconciliation, or an open checkout. The Dodo portal is keyed to the paying customer, so
handing such a workspace over would give the new owner the payer's saved payment details and invoices.
When the subscription has ended, the lapsed customer id is detached at transfer time. Admins can
never remove or demote an owner.

### 4. Plans survive dunning

`PAST_DUE` and `ON_HOLD` keep Pro access through a grace window (the provider's
`past_dueEndsAt` when supplied, otherwise seven days past the paid period or the last webhook
event). An unresolved Dodo product identifier never silently downgrades an active subscription.

### 5. Downgrades are explicit

When a subscription stops being effective Pro, pending invitations expire so nobody accepts a
link that cannot work. Existing members and waitlists keep access; new activity that exceeds the
Free limits shows an upgrade prompt instead of a silent failure.

### 6. The last workspace is remembered

`users.lastWorkspaceId` backs the `waitlyze-workspace` cookie so an invited member who loses the
cookie returns to the workspace they were using instead of silently landing in their own Free
workspace.

## Limits that stay per workspace

Waitlists, signups, and members remain scoped to the workspace that owns them. That is deliberate:
a member of a Pro workspace gets that workspace's Pro features, and a Free workspace still holds
one waitlist and 100 lifetime signups.
