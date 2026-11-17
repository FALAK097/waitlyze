"use client";

import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Cancel01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { TOUR_EASE, TourScene, TourStage } from "@/components/onboarding/tour-stage";
import { TOUR_CHAPTERS, TOUR_SHOTS, TOUR_SLIDES } from "@/components/onboarding/tour-steps";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trackClientEvent } from "@/lib/posthog/client";
import { POSTHOG_EVENTS } from "@/lib/posthog/events.mjs";
import { cn } from "@/lib/utils";

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

function Rail({ slides, index, onPick, onSkip, last }) {
  const at = slides[index];
  const starts = useMemo(() => slides.flatMap((s, i) => (s.si === 0 ? [i] : [])), [slides]);

  return (
    <nav
      aria-label="Tour chapters"
      className="flex w-52 shrink-0 flex-col border-r border-product-border-subtle bg-product-bg-inset/65 px-3.5 py-5 max-[920px]:hidden [@media(max-height:620px)]:hidden"
    >
      <div className="flex items-center gap-2.5 px-2">
        <BrandMark />
        <span className="text-sm font-semibold tracking-tight text-product-text-primary">
          Waitlyze
        </span>
      </div>

      <ol className="mt-6 flex-1 space-y-1 overflow-y-auto pr-0.5">
        {TOUR_CHAPTERS.map((chapter, ci) => {
          const current = ci === at.ci;
          const passed = ci < at.ci;
          return (
            <li key={chapter.id}>
              <button
                type="button"
                onClick={() => onPick(starts[ci])}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "group w-full rounded-[9px] px-2 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus",
                  current
                    ? "bg-white shadow-[0_1px_3px_rgba(0,22,13,0.05)] ring-1 ring-product-border-subtle"
                    : "hover:bg-white/75",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "inline-flex size-5.5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold tabular-nums transition-colors",
                      current
                        ? "bg-product-accent-solid text-product-text-primary"
                        : passed
                          ? "bg-[#e8f5ee] text-[#196642] ring-1 ring-[#196642]/20"
                          : "bg-white text-product-text-muted ring-1 ring-product-border-subtle",
                    )}
                  >
                    {passed ? (
                      <HugeiconsIcon icon={Tick02Icon} className="size-3" aria-hidden="true" />
                    ) : (
                      ci + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[12.5px] transition-colors",
                      current
                        ? "font-semibold text-product-text-primary"
                        : passed
                          ? "font-medium text-product-text-secondary"
                          : "text-product-text-muted group-hover:text-product-text-primary",
                    )}
                  >
                    {chapter.name}
                  </span>
                </span>

                {current && chapter.slides.length > 1 && (
                  <span className="mt-1.5 ml-8 flex gap-1" aria-hidden="true">
                    {chapter.slides.map((s, si) => (
                      <span
                        key={s.id}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors duration-300",
                          si <= at.si ? "bg-[#196642]" : "bg-product-border-subtle",
                        )}
                      />
                    ))}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      {!last && (
        <div className="mt-3 border-t border-product-border-subtle px-2 pt-3">
          <button
            type="button"
            onClick={onSkip}
            className="rounded text-[12px] font-medium text-product-text-muted underline-offset-2 transition-colors hover:text-product-text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus"
          >
            Skip tour
          </button>
        </div>
      )}
    </nav>
  );
}

function ChapterStrip({ slides, index, onPick }) {
  const at = slides[index];
  const stripRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const starts = useMemo(() => slides.flatMap((s, i) => (s.si === 0 ? [i] : [])), [slides]);

  useEffect(() => {
    const container = stripRef.current;
    if (!container) return;
    const activeChip = container.querySelector('[data-active="true"]');
    if (activeChip instanceof HTMLElement) {
      activeChip.scrollIntoView({
        behavior: reduceMotion ? "instant" : "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [at.ci, reduceMotion]);

  return (
    <nav aria-label="Tour chapters" className="min-w-0 flex-1" data-no-swipe>
      <div
        ref={stripRef}
        className="flex [scrollbar-width:none] items-center gap-1 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden"
      >
        {starts.map((start, ci) => {
          const chapter = slides[start].chapter;
          const current = ci === at.ci;
          const passed = ci < at.ci;
          return (
            <button
              key={chapter.id}
              type="button"
              data-active={current ? "true" : undefined}
              aria-current={current ? "step" : undefined}
              onClick={() => onPick(start)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus",
                current
                  ? "bg-white font-semibold text-product-text-primary shadow-xs ring-1 ring-product-border-control"
                  : passed
                    ? "bg-[#e8f5ee]/80 font-medium text-[#196642] hover:bg-[#e8f5ee]"
                    : "font-medium text-product-text-muted hover:bg-white/70 hover:text-product-text-primary",
              )}
            >
              {passed && <HugeiconsIcon icon={Tick02Icon} className="size-3" aria-hidden="true" />}
              <span>{chapter.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SlideCopy({ slide, titleId, firstName }) {
  const isWelcome = slide.id === "overview";
  const lead = isWelcome && firstName ? `Welcome, ${firstName}.` : slide.lead;
  const count = slide.chapter.slides.length;

  return (
    <div className="grid shrink-0 grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center gap-8 px-7 py-5 max-[920px]:grid-cols-1 max-[920px]:gap-4 max-[920px]:px-5 max-[920px]:py-4 [@media(max-height:620px)]:grid-cols-1 [@media(max-height:620px)]:gap-3 [@media(max-height:620px)]:px-5 [@media(max-height:620px)]:py-3.5">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.1em] text-[#196642] uppercase">
          {slide.chapter.name}
          {count > 1 && ` · ${slide.si + 1} of ${count}`}
        </p>

        <h2
          id={titleId}
          className="mt-1.5 font-product-display text-[clamp(1.3rem,2.1vw,1.65rem)] leading-[1.14] font-medium tracking-[-0.03em]"
        >
          <span className="text-product-text-muted">{lead} </span>
          <span className="text-product-text-primary">{slide.title}</span>
        </h2>

        <p className="mt-2 max-w-135 text-[13.5px] leading-[1.55] text-product-text-secondary">
          {slide.body}
        </p>
      </div>

      <ul className="space-y-2">
        {slide.points.map((point) => (
          <li
            key={point}
            className="flex items-center gap-2.5 text-[13px] leading-[1.4] text-product-text-secondary"
          >
            <span className="inline-flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#e8f5ee] text-[#196642] ring-1 ring-[#196642]/15">
              <HugeiconsIcon icon={Tick02Icon} className="size-2.5" aria-hidden="true" />
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProductTour({ entry, onClose, open, userName }) {
  const [stepIndex, setStepIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const directionRef = useRef(1);
  const touchRef = useRef(null);
  const primaryButtonRef = useRef(null);
  const titleId = useId();

  const slide = TOUR_SLIDES[stepIndex];
  const lastStep = stepIndex === TOUR_SLIDES.length - 1;
  const nextSlide = TOUR_SLIDES[stepIndex + 1];
  const firstName = userName?.trim()?.split(/\s+/)[0];

  const goTo = useCallback(
    (nextIndex) => {
      const bounded = Math.max(0, Math.min(TOUR_SLIDES.length - 1, nextIndex));
      directionRef.current = bounded >= stepIndex ? 1 : -1;
      setStepIndex(bounded);
    },
    [stepIndex],
  );

  const finish = useCallback(
    (outcome) => {
      onClose({
        outcome,
        chapterId: slide.chapter.id,
        stepId: slide.id,
        stepIndex,
      });
    },
    [onClose, slide.chapter.id, slide.id, stepIndex],
  );

  useEffect(() => {
    trackClientEvent(POSTHOG_EVENTS.ONBOARDING_TOUR_STARTED, { entry });
    const id = window.requestAnimationFrame(() => {
      primaryButtonRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [entry]);

  useEffect(() => {
    trackClientEvent(POSTHOG_EVENTS.ONBOARDING_TOUR_STEP_VIEWED, {
      entry,
      chapter_id: slide.chapter.id,
      step_id: slide.id,
      step_number: stepIndex + 1,
    });
  }, [entry, slide.chapter.id, slide.id, stepIndex]);

  useEffect(() => {
    for (const src of TOUR_SHOTS) {
      const img = new Image();
      img.src = src;
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable=true]")
      )
        return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(stepIndex + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(stepIndex - 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [goTo, stepIndex]);

  function handleOpenChange(nextOpen) {
    if (!nextOpen) finish("skipped");
  }

  function handleTouchStart(event) {
    const touch = event.touches[0];
    touchRef.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function handleTouchEnd(event) {
    const from = touchRef.current;
    touchRef.current = null;
    if (!from) return;
    if (event.target instanceof HTMLElement && event.target.closest("[data-no-swipe]")) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - from.x;
    const dy = touch.clientY - from.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && !lastStep) goTo(stepIndex + 1);
    else if (dx > 0 && stepIndex > 0) goTo(stepIndex - 1);
  }

  const primaryLabel = lastStep
    ? "Explore Waitlyze"
    : stepIndex === 0
      ? "Show me around"
      : nextSlide?.si === 0
        ? `Next: ${nextSlide.chapter.name}`
        : "Next";

  const share = ((stepIndex + 1) / TOUR_SLIDES.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-labelledby={titleId}
        overlayClassName="bg-product-text-primary/35 supports-backdrop-filter:backdrop-blur-[2px]"
        className="product-ui flex h-[min(780px,calc(100dvh-2rem))] w-[min(1220px,calc(100vw-2rem))]! max-w-none! gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-[0_32px_90px_-28px_rgba(0,22,13,0.32)] ring-1 ring-product-border-subtle duration-200 max-[920px]:h-[calc(100dvh-1rem)] max-[920px]:w-[calc(100vw-1rem)]! [@media(max-height:620px)]:h-[calc(100dvh-1rem)]"
      >
        <DialogTitle className="sr-only">Waitlyze product tour</DialogTitle>

        {/* Persistent live region outside AnimatePresence for screen readers */}
        <p aria-live="polite" className="sr-only">
          {slide.chapter.name}:{" "}
          {slide.id === "overview" && firstName ? `Welcome, ${firstName}. ` : `${slide.lead} `}
          {slide.title}
        </p>

        <Rail
          slides={TOUR_SLIDES}
          index={stepIndex}
          onPick={goTo}
          onSkip={() => finish("skipped")}
          last={lastStep}
        />

        <div className="relative flex min-w-0 flex-1 flex-col bg-white">
          {/* Desktop floating Skip/Close button */}
          <button
            type="button"
            onClick={() => finish(lastStep ? "completed" : "skipped")}
            className="absolute top-5 right-5 z-20 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/95 px-3 text-[12px] font-medium text-product-text-secondary shadow-xs ring-1 ring-product-border-subtle backdrop-blur-sm transition-colors hover:bg-white hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus max-[920px]:hidden [@media(max-height:620px)]:hidden"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" aria-hidden="true" />
            <span>{lastStep ? "Close" : "Skip tour"}</span>
          </button>

          {/* Compact / mobile / short-viewport top chapter strip */}
          <div className="hidden h-12 shrink-0 items-center gap-2 border-b border-product-border-subtle bg-product-bg-inset/50 px-3 max-[920px]:flex [@media(max-height:620px)]:flex">
            <BrandMark className="mr-1 shrink-0" />
            <ChapterStrip slides={TOUR_SLIDES} index={stepIndex} onPick={goTo} />
            <button
              type="button"
              onClick={() => finish(lastStep ? "completed" : "skipped")}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-medium text-product-text-secondary ring-1 ring-product-border-subtle transition-colors hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" aria-hidden="true" />
              <span>{lastStep ? "Close" : "Skip"}</span>
            </button>
          </div>

          {/* Animated slide stage + copy */}
          <div
            className="relative min-h-0 flex-1 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence initial={false} custom={directionRef.current}>
              <motion.div
                key={slide.id}
                custom={directionRef.current}
                variants={{
                  enter: (direction) => ({
                    opacity: 0,
                    x: reduceMotion ? 0 : direction * 18,
                  }),
                  center: { opacity: 1, x: 0 },
                  exit: (direction) => ({
                    opacity: 0,
                    x: reduceMotion ? 0 : direction * -18,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduceMotion ? 0 : 0.22, ease: TOUR_EASE }}
                className="absolute inset-0 flex flex-col bg-white max-[920px]:overflow-y-auto max-[920px]:overscroll-contain [@media(max-height:620px)]:overflow-y-auto [@media(max-height:620px)]:overscroll-contain"
              >
                <div className="min-h-0 flex-1 p-3 pb-0 max-[920px]:h-[clamp(190px,38dvh,310px)] max-[920px]:flex-none max-[920px]:p-2.5 max-[920px]:pb-0 [@media(max-height:620px)]:h-[clamp(165px,42dvh,235px)] [@media(max-height:620px)]:flex-none">
                  <TourStage className="rounded-[12px] ring-1 ring-product-border-subtle">
                    <TourScene id={slide.scene} />
                  </TourStage>
                </div>

                <SlideCopy slide={slide} titleId={titleId} firstName={firstName} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <footer className="flex h-15 shrink-0 items-center gap-4 border-t border-product-border-subtle bg-white px-6 max-sm:h-14 max-sm:gap-2.5 max-sm:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-3 max-sm:gap-2">
              <div
                className="h-1.5 w-32 max-w-full min-w-8 shrink-0 overflow-hidden rounded-full bg-product-bg-inset max-sm:w-14 max-sm:min-w-6"
                aria-hidden="true"
              >
                <motion.div
                  className="h-full rounded-full bg-[#196642]"
                  initial={false}
                  animate={{ width: `${share}%` }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: TOUR_EASE }}
                />
              </div>
              <span className="shrink-0 text-[12px] font-medium whitespace-nowrap text-product-text-muted tabular-nums">
                <span className="max-sm:hidden">{slide.chapter.name} · </span>
                {stepIndex + 1} of {TOUR_SLIDES.length}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {stepIndex > 0 && (
                <Button
                  variant="product-outline"
                  size="lg"
                  className="h-10 rounded-full px-3.5 max-sm:w-10 max-sm:px-0"
                  onClick={() => goTo(stepIndex - 1)}
                  aria-label="Previous slide"
                >
                  <HugeiconsIcon icon={ArrowLeft02Icon} aria-hidden="true" />
                  <span className="max-sm:sr-only">Back</span>
                </Button>
              )}

              <Button
                ref={primaryButtonRef}
                variant="product-accent"
                size="lg"
                className="h-10 rounded-full px-5 font-semibold"
                onClick={() => (lastStep ? finish("completed") : goTo(stepIndex + 1))}
              >
                <span className="max-sm:hidden">{primaryLabel}</span>
                <span className="sm:hidden">
                  {lastStep ? "Explore Waitlyze" : stepIndex === 0 ? "Start tour" : "Next"}
                </span>
                <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden="true" />
              </Button>
            </div>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
