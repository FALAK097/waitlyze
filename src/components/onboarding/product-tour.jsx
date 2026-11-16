"use client";

import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Cancel01Icon,
  ChartHistogramIcon,
  MailValidation01Icon,
  PaintBrush01Icon,
  Share08Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trackClientEvent } from "@/lib/posthog/client";
import { POSTHOG_EVENTS } from "@/lib/posthog/events.mjs";
import { cn } from "@/lib/utils";

const TOUR_STEPS = [
  {
    id: "welcome",
    label: "Welcome",
    eyebrow: "Your launch, in motion",
    title: "Turn early interest into momentum.",
    description:
      "Build the page, grow through verified referrals, and see what is working from one calm workspace.",
    scene: WelcomeScene,
  },
  {
    id: "build",
    label: "Build",
    eyebrow: "Shape the experience",
    title: "Start from a real page, not a blank canvas.",
    description:
      "Compose your signup, confirmation, and referral moments in the same focused builder.",
    scene: BuildScene,
  },
  {
    id: "grow",
    label: "Grow",
    eyebrow: "Create the loop",
    title: "Every signup can bring the next.",
    description:
      "Verification protects the audience. Referral links, points, and rewards keep it moving.",
    scene: GrowScene,
  },
  {
    id: "learn",
    label: "Learn",
    eyebrow: "Read the signal",
    title: "Know what turns interest into momentum.",
    description:
      "Follow visitors, verified signups, conversion, and sources without leaving the launch.",
    scene: LearnScene,
  },
];

function BrandMark({ className }) {
  return (
    <span
      className={cn("inline-flex h-6 -skew-x-12 items-center gap-1", className)}
      aria-hidden="true"
    >
      <i className="block h-3.5 w-1.25 rounded-xs bg-product-accent-solid" />
      <i className="block h-5.5 w-1.25 rounded-xs bg-product-accent-solid" />
      <i className="block h-4.25 w-1.25 rounded-xs bg-product-accent-solid" />
    </span>
  );
}

function DotGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-35"
      style={{
        backgroundImage: "radial-gradient(circle, hsl(210 4% 58% / 0.36) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
      aria-hidden="true"
    />
  );
}

function WelcomeScene() {
  const nodes = [
    { icon: PaintBrush01Icon, label: "Hosted page" },
    { icon: MailValidation01Icon, label: "Verified signup" },
    { icon: Share08Icon, label: "Referral loop" },
    { icon: ChartHistogramIcon, label: "Clear signal" },
  ];
  return (
    <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-product-bg-inset px-8 py-10 max-sm:px-5 max-sm:py-7">
      <DotGrid />
      <div className="relative w-full max-w-190">
        <div className="mb-10 flex items-center justify-center gap-2 text-caption font-semibold text-product-text-primary max-sm:mb-7">
          <BrandMark />
          <span>Waitlyze</span>
        </div>
        <div className="relative grid grid-cols-4 gap-4 max-[680px]:grid-cols-2 max-[680px]:gap-y-7">
          <div className="absolute top-9 right-[12.5%] left-[12.5%] h-px bg-product-border-control max-[680px]:hidden" />
          {nodes.map((node, index) => (
            <div key={node.label} className="relative flex flex-col items-center gap-3 text-center">
              <span className="relative grid size-18 place-items-center rounded-full bg-white text-product-text-primary shadow-[0_8px_30px_hsl(0_0%_0%/0.08)] max-sm:size-14">
                <HugeiconsIcon
                  icon={node.icon}
                  className="size-6 max-sm:size-5"
                  aria-hidden="true"
                />
                {index === 2 && (
                  <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-product-accent-solid text-[10px] font-bold">
                    +3
                  </span>
                )}
              </span>
              <span className="text-caption font-medium text-product-text-secondary max-sm:text-micro">
                {node.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 flex w-fit items-center gap-2 rounded-full bg-product-text-primary px-4 py-2 text-micro font-semibold text-white max-sm:mt-7">
          <span className="size-2 rounded-full bg-product-accent-solid" />
          Ready before launch day
        </div>
      </div>
    </div>
  );
}

function BuilderPreview() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[18px] bg-[#071b14] text-white shadow-[0_18px_60px_hsl(155_100%_4%/0.22)]">
      <div className="flex items-center justify-between px-5 py-3 text-[10px] font-semibold tracking-[0.14em] text-white/60 uppercase">
        <span>Acme early access</span>
        <span className="size-2 rounded-full bg-product-accent-solid" />
      </div>
      <div className="grid flex-1 place-items-center px-7 py-6 text-center">
        <div className="max-w-70">
          <span className="text-[10px] font-semibold tracking-[0.18em] text-product-accent-solid uppercase">
            Private beta
          </span>
          <p className="mt-3 text-[clamp(1.3rem,3vw,2rem)] leading-[1.05] font-semibold tracking-tight">
            The calmer way to ship.
          </p>
          <div className="mx-auto mt-5 flex max-w-64 items-center rounded-lg bg-white p-1 text-left text-[10px] text-product-text-muted">
            <span className="flex-1 px-2">you@company.com</span>
            <span className="rounded-md bg-product-accent-solid px-2.5 py-2 font-bold text-product-text-primary">
              Join
            </span>
          </div>
          <p className="mt-3 text-[9px] text-white/45">Join 2,418 people already waiting.</p>
        </div>
      </div>
    </div>
  );
}

function BuildScene() {
  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-product-bg-inset p-6 max-sm:p-4">
      <DotGrid />
      <div className="relative mx-auto flex h-full max-w-215 flex-col">
        <div className="mb-4 flex items-center justify-between text-[10px] font-semibold tracking-[0.13em] text-product-text-muted uppercase">
          <span>Page builder</span>
          <span>Saved just now</span>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[9rem_minmax(0,1fr)_9rem] gap-4 max-[680px]:grid-cols-[minmax(0,1fr)]">
          <div className="flex flex-col gap-2 rounded-xl bg-white p-3 text-micro shadow-[0_6px_24px_hsl(0_0%_0%/0.06)] max-[680px]:hidden">
            <span className="mb-1 font-semibold text-product-text-primary">Blocks</span>
            {["Hero", "Signup", "Social proof", "FAQ"].map((item, index) => (
              <span
                key={item}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-product-text-secondary",
                  index === 1 && "bg-product-bg-inset font-medium text-product-text-primary",
                )}
              >
                <span className="size-1.5 rounded-full bg-product-border-control" />
                {item}
              </span>
            ))}
          </div>
          <BuilderPreview />
          <div className="flex flex-col gap-3 rounded-xl bg-white p-3 text-micro shadow-[0_6px_24px_hsl(0_0%_0%/0.06)] max-[680px]:hidden">
            <span className="font-semibold text-product-text-primary">Design</span>
            <span className="text-product-text-muted">Accent</span>
            <div className="flex gap-2">
              <span className="size-7 rounded-full bg-product-accent-solid ring-2 ring-product-text-primary ring-offset-2" />
              <span className="size-7 rounded-full bg-product-text-primary" />
              <span className="size-7 rounded-full bg-product-border-subtle" />
            </div>
            <span className="mt-2 text-product-text-muted">Radius</span>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-product-bg-inset p-1 text-center">
              <span className="py-1">S</span>
              <span className="rounded-md bg-white py-1 font-semibold text-product-text-primary">
                M
              </span>
              <span className="py-1">L</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-5 text-[10px] font-medium text-product-text-secondary max-[420px]:gap-3">
          <span className="text-product-text-primary">Hosted page</span>
          <span>After signup</span>
          <span>Publish &amp; share</span>
        </div>
      </div>
    </div>
  );
}

function GrowScene() {
  const people = [
    { initial: "A", tone: "bg-[#f2d8ca]", x: "left-[4%] top-[46%]" },
    { initial: "M", tone: "bg-[#d8e6cc]", x: "left-[21%] top-[12%]" },
    { initial: "J", tone: "bg-[#d2e2ef]", x: "right-[21%] top-[12%]" },
    { initial: "S", tone: "bg-[#ead7ee]", x: "right-[4%] top-[46%]" },
  ];
  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-[#071b14] px-8 py-8 text-white max-sm:px-4">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, hsl(75 99% 56% / .3), transparent 55%)",
        }}
      />
      <div className="relative mx-auto h-full max-w-190">
        <svg
          className="absolute inset-0 size-full text-white/20"
          viewBox="0 0 760 360"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M380 180 C250 180 220 70 145 70"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="5 7"
          />
          <path
            d="M380 180 C510 180 540 70 615 70"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="5 7"
          />
          <path
            d="M380 180 C220 180 140 260 55 260"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="5 7"
          />
          <path
            d="M380 180 C540 180 620 260 705 260"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="5 7"
          />
        </svg>
        {people.map((person) => (
          <div
            key={person.initial}
            className={cn("absolute flex flex-col items-center gap-2", person.x)}
          >
            <span
              className={cn(
                "grid size-12 place-items-center rounded-full text-sm font-bold text-product-text-primary shadow-lg",
                person.tone,
              )}
            >
              {person.initial}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-medium text-white/55">
              <HugeiconsIcon
                icon={Tick02Icon}
                className="size-3 text-product-accent-solid"
                aria-hidden="true"
              />
              Verified
            </span>
          </div>
        ))}
        <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
          <span className="grid size-24 place-items-center rounded-full bg-product-accent-solid text-product-text-primary shadow-[0_0_0_16px_hsl(75_99%_56%/0.08)] max-sm:size-20">
            <HugeiconsIcon icon={Share08Icon} className="size-8" aria-hidden="true" />
          </span>
          <strong className="mt-5 text-base">Referral loop</strong>
          <span className="mt-1 text-[10px] text-white/50">Verified credit · live ranking</span>
        </div>
        <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full bg-white/9 px-5 py-2 text-[10px] text-white/70 backdrop-blur-sm max-sm:gap-2 max-sm:px-3">
          <span className="font-semibold text-product-accent-solid">+10 points</span>
          <span className="h-3 w-px bg-white/20" />
          <span>1 reward closer</span>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ points, className }) {
  return (
    <svg
      className={cn("h-12 w-full", className)}
      viewBox="0 0 260 48"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={points}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function LearnScene() {
  const sources = [
    { label: "Direct", value: 74, width: "74%" },
    { label: "Referrals", value: 58, width: "58%" },
    { label: "Social", value: 31, width: "31%" },
  ];
  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-product-bg-inset px-7 py-7 max-sm:px-4 max-sm:py-5">
      <DotGrid />
      <div className="relative mx-auto flex h-full max-w-215 flex-col rounded-[18px] bg-white p-6 shadow-[0_12px_44px_hsl(0_0%_0%/0.09)] max-sm:p-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-micro font-semibold tracking-[0.14em] text-product-text-muted uppercase">
              Launch pulse
            </p>
            <p className="mt-1 text-sm font-semibold text-product-text-primary">Last 30 days</p>
          </div>
          <span className="flex items-center gap-1.5 text-micro font-medium text-product-success-text">
            <span className="size-2 rounded-full bg-product-accent-solid" />
            Live
          </span>
        </div>
        <div className="grid grid-cols-3 gap-5 max-[520px]:gap-3">
          {[
            ["Visitors", "8,420", "+18%"],
            ["Verified", "2,146", "+24%"],
            ["Conversion", "25.5%", "+3.1"],
          ].map(([label, value, delta]) => (
            <div key={label} className="min-w-0">
              <span className="block text-[9px] font-medium text-product-text-muted max-[420px]:truncate">
                {label}
              </span>
              <strong className="mt-1 block text-[clamp(1rem,2.5vw,1.65rem)] leading-none tracking-tight text-product-text-primary">
                {value}
              </strong>
              <span className="mt-1.5 block text-[9px] font-semibold text-product-success-text">
                {delta}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 grid min-h-0 flex-1 grid-cols-[1.45fr_1fr] gap-7 max-[580px]:grid-cols-1 max-[580px]:gap-4">
          <div className="flex min-h-0 flex-col justify-end">
            <Sparkline
              className="h-full min-h-18 text-product-text-primary"
              points="M0 42 C34 40 42 28 72 31 S118 39 143 22 S185 28 210 12 S242 14 260 3"
            />
            <div className="mt-2 flex justify-between text-[8px] text-product-text-muted">
              <span>Oct 18</span>
              <span>Nov 16</span>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <p className="text-[9px] font-semibold tracking-[0.12em] text-product-text-muted uppercase">
              Top sources
            </p>
            {sources.map((source) => (
              <div
                key={source.label}
                className="grid grid-cols-[3.5rem_1fr_1.2rem] items-center gap-2 text-[9px] text-product-text-secondary"
              >
                <span>{source.label}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-product-bg-inset">
                  <span
                    className="block h-full rounded-full bg-product-accent-solid"
                    style={{ width: source.width }}
                  />
                </span>
                <span className="text-right font-semibold text-product-text-primary">
                  {source.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductTour({ entry, onClose, open, userName }) {
  const [stepIndex, setStepIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const directionRef = useRef(1);
  const step = TOUR_STEPS[stepIndex];
  const Scene = step.scene;
  const lastStep = stepIndex === TOUR_STEPS.length - 1;
  const firstName = userName?.trim()?.split(/\s+/)[0];

  const goTo = useCallback(
    (nextIndex) => {
      const bounded = Math.max(0, Math.min(TOUR_STEPS.length - 1, nextIndex));
      directionRef.current = bounded >= stepIndex ? 1 : -1;
      setStepIndex(bounded);
    },
    [stepIndex],
  );

  const finish = useCallback(
    (outcome) => {
      onClose({ outcome, stepId: step.id, stepIndex });
    },
    [onClose, step.id, stepIndex],
  );

  useEffect(() => {
    trackClientEvent(POSTHOG_EVENTS.ONBOARDING_TOUR_STARTED, { entry });
  }, [entry]);

  useEffect(() => {
    trackClientEvent(POSTHOG_EVENTS.ONBOARDING_TOUR_STEP_VIEWED, {
      entry,
      step_id: step.id,
      step_number: stepIndex + 1,
    });
  }, [entry, step.id, stepIndex]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable=true]")
      )
        return;
      if (event.key === "ArrowRight") goTo(stepIndex + 1);
      if (event.key === "ArrowLeft") goTo(stepIndex - 1);
    }
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [goTo, stepIndex]);

  function handleOpenChange(nextOpen) {
    if (!nextOpen) finish("skipped");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-product-text-primary/38 supports-backdrop-filter:backdrop-blur-[2px]"
        className="product-ui grid h-[min(780px,calc(100dvh-2rem))] w-[min(1180px,calc(100vw-2rem))]! max-w-none! grid-cols-[196px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_84px] gap-0 overflow-hidden rounded-2xl bg-product-bg-surface p-0 shadow-[0_28px_90px_hsl(155_100%_4%/0.32)] ring-0 duration-200 max-[760px]:h-[calc(100dvh-1rem)] max-[760px]:w-[calc(100vw-1rem)]! max-[760px]:grid-cols-1 max-[760px]:grid-rows-[auto_minmax(0,1fr)_76px]"
      >
        <DialogTitle className="sr-only">Waitlyze product tour</DialogTitle>

        <aside className="row-span-2 flex min-h-0 flex-col bg-product-bg-inset px-5 py-6 max-[760px]:row-span-1 max-[760px]:flex-row max-[760px]:items-center max-[760px]:gap-4 max-[760px]:overflow-hidden max-[760px]:px-4 max-[760px]:py-3">
          <div className="mb-8 flex items-center gap-2.5 max-[760px]:mr-auto max-[760px]:mb-0">
            <BrandMark />
            <span className="text-sm font-semibold text-product-text-primary">Waitlyze</span>
          </div>
          <nav
            aria-label="Tour chapters"
            className="flex flex-1 flex-col gap-1 max-[760px]:min-w-0 max-[760px]:flex-row max-[760px]:overflow-x-auto"
          >
            {TOUR_STEPS.map((item, index) => {
              const active = index === stepIndex;
              const visited = index < stepIndex;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => goTo(index)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-lg px-2 text-left text-caption text-product-text-muted transition-colors hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus max-[760px]:shrink-0 max-[760px]:px-2.5",
                    active &&
                      "bg-white font-semibold text-product-text-primary shadow-[0_1px_4px_hsl(0_0%_0%/0.06)]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full bg-product-border-subtle text-[10px] font-semibold text-product-text-secondary transition-colors",
                      active && "bg-product-accent-solid text-product-text-primary",
                      visited && "bg-product-text-primary text-white",
                    )}
                  >
                    {visited ? (
                      <HugeiconsIcon icon={Tick02Icon} className="size-3.5" aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <p className="mt-auto text-micro leading-relaxed text-product-text-muted max-[760px]:hidden">
            Use <kbd className="font-mono text-product-text-secondary">←</kbd>{" "}
            <kbd className="font-mono text-product-text-secondary">→</kbd> to move
          </p>
        </aside>

        <main className="relative grid min-h-0 grid-rows-[minmax(160px,1.35fr)_minmax(0,.65fr)] overflow-hidden max-[760px]:grid-rows-[minmax(180px,1fr)_auto]">
          <button
            type="button"
            onClick={() => finish("skipped")}
            className="absolute top-4 right-4 z-20 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white/90 px-3 text-caption font-medium text-product-text-secondary shadow-sm backdrop-blur-sm transition-colors hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus max-sm:top-3 max-sm:right-3"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" aria-hidden="true" />
            <span className="max-sm:sr-only">Skip tour</span>
          </button>

          <div className="min-h-0 overflow-hidden">
            <AnimatePresence initial={false} mode="wait" custom={directionRef.current}>
              <motion.div
                key={step.id}
                custom={directionRef.current}
                variants={{
                  enter: (direction) => ({ opacity: 0, x: reduceMotion ? 0 : direction * 18 }),
                  center: { opacity: 1, x: 0 },
                  exit: (direction) => ({ opacity: 0, x: reduceMotion ? 0 : direction * -12 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <Scene />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex min-h-0 items-center overflow-y-auto px-[clamp(1.5rem,5vw,4.5rem)] py-7 max-[760px]:items-start max-[760px]:py-5">
            <p aria-live="polite" className="sr-only">
              {step.id === "welcome" && firstName ? `Welcome, ${firstName}. ` : ""}
              {step.title}
            </p>
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={`${step.id}-copy`}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -5 }}
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
                className="max-w-170"
              >
                <p className="text-micro font-semibold tracking-[0.16em] text-product-success-text uppercase">
                  {step.eyebrow}
                </p>
                <h2 className="mt-2 font-product-display text-[clamp(1.65rem,3vw,2.65rem)] leading-[1.03] font-medium tracking-[-0.035em] text-product-text-primary">
                  {step.id === "welcome" && firstName ? `Welcome, ${firstName}. ` : ""}
                  {step.title}
                </h2>
                <p className="mt-3 max-w-145 text-[clamp(.82rem,1.25vw,.95rem)] leading-relaxed text-product-text-secondary">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="col-start-2 flex items-center gap-6 px-8 max-[760px]:col-start-1 max-[760px]:gap-3 max-[760px]:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 max-sm:gap-2">
            <div
              className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-product-bg-inset max-sm:min-w-6"
              aria-hidden="true"
            >
              <motion.div
                className="h-full rounded-full bg-product-text-primary"
                animate={{ width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="shrink-0 text-micro font-medium text-product-text-muted max-sm:hidden">
              {stepIndex + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button
                variant="product-ghost"
                size="xl"
                className="min-w-11 px-3 max-sm:w-11 max-sm:px-0"
                onClick={() => goTo(stepIndex - 1)}
              >
                <HugeiconsIcon icon={ArrowLeft02Icon} aria-hidden="true" />
                <span className="max-sm:sr-only">Back</span>
              </Button>
            )}
            <Button
              variant="product-accent"
              size="xl"
              className="min-w-34 rounded-full px-5"
              onClick={() => (lastStep ? finish("completed") : goTo(stepIndex + 1))}
            >
              {lastStep ? "Explore Waitlyze" : "Continue"}
              <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden="true" />
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
