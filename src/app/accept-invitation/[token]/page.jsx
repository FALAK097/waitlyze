import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { loadWorkspaceInvitation, normalizeInvitationEmail } from "@/lib/workspaces/invitations.mjs";
import { InvitationAcceptButton, InvitationSignIn, InvitationSwitchAccount } from "@/components/product/invitation-acceptance";
import PublicShell from "@/components/landing/public-shell";
import { buttonVariants } from "@/components/product/button-variants";
import "@/components/product/shell.css";

export const metadata = { title: "Workspace invitation", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function AcceptInvitationPage({ params }) {
  const { token } = await params;
  const invitation = await loadWorkspaceInvitation(prisma, token);
  const session = await auth.api.getSession({ headers: await headers() });
  const signedInEmail = normalizeInvitationEmail(session?.user?.email);
  const matchesAccount = !!signedInEmail && signedInEmail === invitation?.emailNormalized;

  return <PublicShell><main className="product-ui product-invitation-page">
    <section className="product-invitation-card" aria-labelledby="invitation-title">
      {invitation ? <>
        <p className="product-eyebrow">Workspace invitation</p>
        <h1 id="invitation-title">Join {invitation.workspace.name}</h1>
        <p className="product-invitation-copy">You’ve been invited as a <strong>{invitation.role.toLowerCase()}</strong> using <strong>{invitation.emailNormalized}</strong>.</p>
        <p className="product-help">Invitations expire {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(invitation.expiresAt)}.</p>
        {!session ? <>
          <p className="product-invitation-copy">Sign in with the invited email address to review and accept.</p>
          <InvitationSignIn callbackURL={`/accept-invitation/${encodeURIComponent(token)}`} />
        </> : matchesAccount && session.user.emailVerified ? <InvitationAcceptButton token={token} /> : !matchesAccount ? <div><p role="alert">You’re signed in as {session.user.email}. Switch to the invited account to continue.</p><InvitationSwitchAccount /></div> : <div><p role="alert">Verify your email before accepting this invitation.</p><InvitationSwitchAccount /></div>}
      </> : <>
        <p className="product-eyebrow">Workspace invitation</p>
        <h1 id="invitation-title">This invitation isn’t available</h1>
        <p className="product-invitation-copy">It may have expired, been revoked, or already been accepted. Ask a workspace admin for a new invitation.</p>
        <Link className={buttonVariants({ variant: "outline" })} href="/">Return to Waitlyze</Link>
      </>}
    </section>
  </main></PublicShell>;
}
