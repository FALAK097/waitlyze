import { headers } from "next/headers";
import Link from "next/link";

import PublicShell from "@/components/landing/public-shell";
import {
  InvitationAcceptButton,
  InvitationSignIn,
  InvitationSwitchAccount,
} from "@/components/product/invitation-acceptance";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  loadWorkspaceInvitation,
  normalizeInvitationEmail,
} from "@/lib/workspaces/invitations.mjs";

export const metadata = {
  title: "Workspace invitation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function AcceptInvitationPage({ params }) {
  const { token } = await params;
  const requestHeaders = await headers();
  const [invitation, session] = await Promise.all([
    loadWorkspaceInvitation(prisma, token),
    auth.api.getSession({ headers: requestHeaders }),
  ]);
  const signedInEmail = normalizeInvitationEmail(session?.user?.email);
  const matchesAccount = !!signedInEmail && signedInEmail === invitation?.emailNormalized;

  return (
    <PublicShell>
      <main
        id="main-content"
        tabIndex={-1}
        className="product-ui mx-auto grid w-full max-w-155 place-items-start justify-items-center pt-14 pb-22"
      >
        <section className="grid w-full gap-4" aria-labelledby="invitation-title">
          {invitation ? (
            <>
              <p className="product-eyebrow">Workspace invitation</p>
              <h1
                id="invitation-title"
                className="text-2xl! leading-tight wrap-anywhere md:text-3xl!"
              >
                Join {invitation.workspace.name}
              </h1>
              <p className="text-sm wrap-anywhere text-product-text-secondary [&_strong]:text-product-text-primary">
                You’ve been invited as a <strong>{invitation.role.toLowerCase()}</strong> using{" "}
                <strong>{invitation.emailNormalized}</strong>.
              </p>
              <p className="mb-4! text-sm leading-relaxed text-product-text-secondary">
                Invitations expire{" "}
                {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                  invitation.expiresAt,
                )}
                .
              </p>
              {!session ? (
                <>
                  <p className="text-sm wrap-anywhere text-product-text-secondary [&_strong]:text-product-text-primary">
                    Sign in with the invited email address to review and accept.
                  </p>
                  <InvitationSignIn
                    callbackURL={`/accept-invitation/${encodeURIComponent(token)}`}
                  />
                </>
              ) : matchesAccount && session.user.emailVerified ? (
                <InvitationAcceptButton token={token} />
              ) : !matchesAccount ? (
                <div>
                  <p role="alert">
                    You’re signed in as {session.user.email}. Switch to the invited account to
                    continue.
                  </p>
                  <InvitationSwitchAccount />
                </div>
              ) : (
                <div>
                  <p role="alert">Verify your email before accepting this invitation.</p>
                  <InvitationSwitchAccount />
                </div>
              )}
            </>
          ) : (
            <>
              <p className="product-eyebrow">Workspace invitation</p>
              <h1
                id="invitation-title"
                className="text-2xl! leading-tight wrap-anywhere md:text-3xl!"
              >
                This invitation isn’t available
              </h1>
              <p className="text-sm wrap-anywhere text-product-text-secondary [&_strong]:text-product-text-primary">
                It may have expired, been revoked, or already been accepted. Ask a workspace admin
                for a new invitation.
              </p>
              <Link prefetch={false} className={buttonVariants({ variant: "outline" })} href="/">
                Return to Waitlyze
              </Link>
            </>
          )}
        </section>
      </main>
    </PublicShell>
  );
}
