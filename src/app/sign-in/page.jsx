import { SignInForm } from "@/components/auth/sign-in-form";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Sign In | Waitlyze",
  description: "Sign in to your Waitlyze account.",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <Image src="/images/logo.svg" alt="Waitlyze" width={28} height={28} />
          Waitlyze
        </Link>
        <SignInForm />
      </div>
    </div>
  );
}
