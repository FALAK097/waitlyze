import { redirect } from "next/navigation";

// The Builder is the landing tab for a waitlist.
export default async function WaitlistRootPage({ params }) {
  const { id } = await params;
  redirect(`/waitlists/${id}/edit`);
}
