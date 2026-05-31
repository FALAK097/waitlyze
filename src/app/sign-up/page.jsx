import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata = {
  title: "Sign Up | Waitlyze",
  description: "Create your Waitlyze account.",
};

export default function SignUpPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-background">
      {/* Decorative premium background elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />

      <SignUpForm />
    </div>
  );
}
