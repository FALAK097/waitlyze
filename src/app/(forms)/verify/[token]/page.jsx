import { VerifyAction } from "./verify-action";
import "../../public-page.css";

export const metadata = { title: "Confirm your email | Waitlyze", robots: { index: false, follow: false } };

export default async function VerifySignupPage({ params, searchParams }) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const candidate = query?.returnTo;
  const returnPath = typeof candidate === "string" && /^\/w\/[A-Za-z0-9_-]+$/.test(candidate) ? candidate : "/";
  return <VerifyAction token={token} returnPath={returnPath} />;
}
