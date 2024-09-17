"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Shield } from "lucide-react";
import Image from "next/image";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

const schema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
});

export default function OTPVerify() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      otp: "",
    },
  });

  const [isVerified, setIsVerified] = useState(false);

  const onSubmit = async (data) => {
    console.log("OTP submitted:", data.otp);
    setIsVerified(true);
    toast({
      title: "OTP Verified",
      description: "Your account has been verified successfully.",
    });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden w-1/2 lg:block">
        <Image
          src="/images/verification.svg"
          alt="OTP Verification Image"
          width={108}
          height={108}
          className="w-[30rem] h-[30rem] mt-20 mx-auto"
        />
      </div>
      <div className="flex flex-col justify-center w-full px-8 py-12 lg:w-1/2 sm:px-16">
        <Link
          href="/register"
          className="absolute flex items-center transition-colors text-foreground top-4 right-4 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Register
        </Link>
        <div className="w-full max-w-md mx-auto">
          <h2 className="mb-2 text-3xl font-bold">Verify Your Account</h2>
          <p className="mb-8 text-muted-foreground">
            Enter the 6-digit code sent to your email to verify your account.
          </p>
          {!isVerified ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <Controller
                  name="otp"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <InputOTP
                      value={value}
                      onChange={onChange}
                      maxLength={6}
                      className="flex justify-center"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  )}
                />
                {errors.otp && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.otp.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full p-4 text-lg text-white rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <div className="mb-4 text-primary">
                <Shield className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Account Verified</h3>
              <p className="mb-6 text-muted-foreground">
                Your account has been successfully verified. You can now access
                all features.
              </p>
              <Link href="/dashboard" className="block mb-4">
                <Button
                  variant="outline"
                  className="inline-flex items-center rounded-full hover:bg-primary dark:hover:bg-transparent hover:border-primary"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the code?{" "}
              <Button
                variant="link"
                className="p-0 text-primary hover:underline"
              >
                Resend OTP
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
