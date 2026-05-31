"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function SignUpForm({ className, ...props }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(error.message || "Registration failed. Please try again.");
      } else {
        toast.success("Account created successfully!");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Sign-up error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
      toast.error("Google authentication failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-0 shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Sign up with your Google account or email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="grid gap-6">
              {/* Google OAuth */}
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Image src="/images/google.svg" alt="Google" width={16} height={16} />
                  )}
                  Continue with Google
                </Button>
              </div>

              {/* Divider */}
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>

              {/* Name + Email + Password */}
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </div>

              {/* Sign in link */}
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/sign-in" className="underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        By clicking Sign up, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
      </div>
    </div>
  );
}
