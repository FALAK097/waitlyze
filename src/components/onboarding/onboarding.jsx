"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function OnboardingDialog({ userId, isOnboarded, onComplete }) {
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOnboarded) {
      setIsOpen(true);
    }
  }, [isOnboarded]);

  const handleContinue = useCallback(() => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
      router.push("/waitlists/new");
    }
  }, [step]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        handleContinue();
      } else if (e.key === "ArrowLeft") {
        setStep((prev) => (prev > 1 ? prev - 1 : prev));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleContinue]);

  const stepContent = [
    {
      id: "welcome",
      title: "Welcome to Waitlyze! ",
      description:
        "Create stunning waitlist pages that perfectly match your brand and build anticipation for your product launch.",
      image: "/images/onboarding/welcome.png",
    },
    {
      id: "designer",
      title: "No-Code Designer",
      description:
        "Design beautiful waitlist forms with our intuitive no-code designer. Customize colors, styles, and branding elements in real-time.",
      image: "/images/onboarding/designer.png",
    },
    {
      id: "integration",
      title: "Easy Integration",
      description:
        "Embed your waitlist widget into your existing website or use our hosted page. Perfect whether you have a website or not!",
      image: "/images/onboarding/integration.png",
    },
    {
      id: "analytics",
      title: "Track Your Growth",
      description:
        "Monitor signups, track visitor analytics, and understand your audience with detailed insights about your waitlist's performance.",
      image: "/images/onboarding/analytics.png",
    },
  ];

  const totalSteps = stepContent.length;

  const handleComplete = async () => {
    await onComplete(userId);
    setIsOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) return;
        setIsOpen(open);
        if (open) setStep(1);
      }}
    >
      <DialogContent className="max-w-[500px] gap-0 p-0 [&>button:last-child]:hidden">
        <div className="p-2">
          <Image
            className="h-[200px] w-full rounded-lg object-cover"
            src={stepContent[step - 1].image}
            width={500}
            height={200}
            alt={`Step ${step} - ${stepContent[step - 1].title}`}
            priority
          />
        </div>
        <div className="space-y-6 px-6 pt-3 pb-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{stepContent[step - 1].title}</DialogTitle>
            <DialogDescription className="text-base">
              {stepContent[step - 1].description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex justify-center space-x-2 max-sm:order-1">
              {stepContent.map((content) => (
                <Button
                  key={content.id}
                  type="button"
                  onClick={() => setStep(stepContent.indexOf(content) + 1)}
                  className={cn(
                    "h-2 cursor-pointer rounded-full transition-all duration-300 focus:outline-none",
                    stepContent.indexOf(content) + 1 === step
                      ? "w-4 bg-primary"
                      : "w-2 bg-primary/20 hover:bg-primary/40",
                  )}
                />
              ))}
            </div>
            <DialogFooter className="sm:space-x-2">
              {step < totalSteps ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={async () => {
                      await handleComplete();
                    }}
                  >
                    Skip
                  </Button>
                  <Button className="group" type="button" onClick={handleContinue} variant="ghost">
                    Next
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="ml-2 opacity-60 transition-transform group-hover:translate-x-0.5"
                      size={16}
                      strokeWidth={2}
                    />
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={handleContinue}>
                  Create waitlist now
                </Button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
