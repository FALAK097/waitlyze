"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import GoogleIcon from "@/components/icons/GoogleIcon";

const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Load checkbox state from local storage on component mount
  useEffect(() => {
    const agreed = localStorage.getItem("agreeToTerms");
    if (agreed === "true") {
      setAgreeToTerms(true);
    }
  }, []);

  const onSubmit = (data) => {
    if (!agreeToTerms) {
      // Display a message if the checkbox isn't checked
      toast({
        title: "Please agree to the terms & policies.",
        description: "You must agree to the terms & policies to continue.",
        variant: "destructive",
      });
      return;
    }
    console.log(data);
    // Handle registration logic here
  };

  const handleCheckboxChange = (event) => {
    const isChecked = event.target.checked;
    setAgreeToTerms(isChecked);
    // Update local storage
    localStorage.setItem("agreeToTerms", isChecked ? "true" : "false");
  };

  return (
    <div className="flex flex-col justify-center min-h-screen py-10 bg-gradient-to-br from-primary/20 to-accent/20 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-8">
        <Link
          href="/login"
          className="flex items-center text-primary hover:text-primary/80"
        >
          <ChevronLeft className="mr-1" />
          Back
        </Link>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-4xl font-extrabold text-center text-foreground">
          Create Your Account
        </h2>
        <p className="mt-2 text-sm text-center text-muted-foreground">
          Sign up to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="px-4 py-8 shadow-lg bg-card sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                {...register("name")}
                type="text"
                className="mt-1"
              />
              {errors.name && (
                <p className="text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                {...register("email")}
                type="email"
                autoComplete="email"
                className="mt-1"
              />
              {errors.email && (
                <p className="text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                {...register("password")}
                type="password"
                autoComplete="current-password"
                className="mt-1"
              />
              {errors.password && (
                <p className="text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex flex-col">
              <p className="flex items-center text-sm text-muted-foreground">
                <Input
                  id="agreeToTerms"
                  type="checkbox"
                  className="w-4 h-4 mr-2 cursor-pointer"
                  checked={agreeToTerms}
                  onChange={handleCheckboxChange}
                />
                <Label
                  htmlFor="agreeToTerms"
                  className="cursor-pointer text-muted-foreground"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="underline hover:text-brand underline-offset-4"
                  >
                    Terms
                  </Link>{" "}
                  &{" "}
                  <Link
                    href="/privacy"
                    className="underline hover:text-brand underline-offset-4"
                  >
                    Privacy
                  </Link>
                </Label>
              </p>
            </div>

            <div>
              <Button type="submit" className="w-full text-lg font-semibold">
                Sign up
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                className="flex items-center justify-center w-full bg-white hover:bg-white hover:text-accent"
              >
                <GoogleIcon className="w-5 h-5 mr-2" />
                Sign in with Google
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium transition-colors text-primary hover:text-primary/80"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
