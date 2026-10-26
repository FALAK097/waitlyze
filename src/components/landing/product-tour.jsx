"use client";

import {
  ArrowUpRight01Icon,
  BrushIcon,
  ChartLineData01Icon,
  GlobeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
const views = [
  {
    title: "Design",
    heading: "Make it yours.",
    copy: "Start with a template. Edit your page and preview it on any screen.",
    link: "Try the form",
    href: "#preview",
    media: "design",
    icon: BrushIcon,
    alt: "Waitlyze builder editing a sample headline, then switching to the mobile preview.",
  },
  {
    title: "Publish",
    heading: "Your website. Or ours.",
    copy: "Embed it with a simple script, or share a page hosted by Waitlyze.",
    link: "Explore the signup options",
    href: "#features",
    media: "publish",
    icon: GlobeIcon,
    alt: "Waitlyze publication options: copy a hosted page link or the website embed script.",
  },
  {
    title: "Understand",
    heading: "Find your momentum.",
    copy: "See visitors, signups, and verification. Compare date ranges or explore the data table.",
    link: "Explore the features",
    href: "#features",
    media: "understand",
    icon: ChartLineData01Icon,
    alt: "Waitlyze analytics with dummy activity, changing the date range and switching from chart to table.",
  },
];

// Each walkthrough view carries its own accent and wash, the way the old
// stylesheet swapped them through the data-theme attribute.
const tourThemes = {
  design: { accent: "text-lime-700", wash: "bg-lime-50", bar: "bg-lime-700" },
  publish: { accent: "text-indigo-800", wash: "bg-indigo-50", bar: "bg-indigo-800" },
  understand: { accent: "text-pink-800", wash: "bg-pink-50", bar: "bg-pink-800" },
};

export default function ProductTour() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(null);
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState(false);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const tabsRef = useRef([]);
  const view = views[selected];
  const theme = tourThemes[view.media];
  const canPlay = playing && reducedMotion === false && visible && inView && !failed;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(preference.matches);
    const syncVisibility = () => setVisible(!document.hidden);
    syncMotion();
    syncVisibility();
    preference.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(rootRef.current);
    return () => {
      preference.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    if (canPlay)
      void video.play().catch(() => {
        if (!cancelled) setPlaying(false);
      });
    else video.pause();
    return () => {
      cancelled = true;
    };
  }, [canPlay, selected]);

  function select(index, keyboard = false) {
    if (index === selected) {
      if (keyboard) {
        setPlaying(false);
        tabsRef.current[index]?.focus();
      }
      return;
    }
    setSelected(index);
    setFailed(false);
    if (keyboard) {
      setPlaying(false);
      tabsRef.current[index]?.focus();
    }
    if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";
  }
  function onKeyDown(event) {
    const next =
      event.key === "ArrowRight"
        ? (selected + 1) % views.length
        : event.key === "ArrowLeft"
          ? (selected + views.length - 1) % views.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? views.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    select(next, true);
  }

  return (
    <div
      className="mt-9"
      data-theme={view.media}
      ref={rootRef}
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
      onFocusCapture={(event) => {
        if (event.target.matches(":focus-visible")) setPlaying(false);
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div
          className="no-scrollbar flex max-w-full gap-2 overflow-x-auto max-sm:flex-1 max-sm:justify-between max-sm:gap-4"
          role="tablist"
          aria-label="Product walkthrough"
          onKeyDown={onKeyDown}
        >
          {views.map((item, index) => (
            <button
              key={item.title}
              ref={(node) => {
                tabsRef.current[index] = node;
              }}
              id={`tour-tab-${item.media}`}
              type="button"
              role="tab"
              aria-selected={index === selected}
              tabIndex={index === selected ? 0 : -1}
              aria-controls="product-view"
              onClick={(event) => {
                select(index);
                if (event.detail > 0) setPlaying(true);
              }}
              className={cn(
                "relative inline-flex min-h-12 shrink-0 items-center justify-center gap-2.5 overflow-hidden rounded-md bg-transparent px-3 py-3 text-sm font-semibold text-product-text-secondary transition duration-120 hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 active:scale-95 sm:px-6",
                index === selected && cn(theme.wash, theme.accent),
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={17}
                aria-hidden="true"
                className={cn("shrink-0", tourThemes[item.media].accent)}
              />
              {item.title}
              <span className="absolute bottom-0 left-0 h-0.5 w-full" aria-hidden="true">
                <i
                  ref={index === selected ? progressRef : null}
                  className={cn(
                    "block h-full w-full origin-left scale-x-0 transition-transform duration-200",
                    tourThemes[item.media].bar,
                  )}
                />
              </span>
            </button>
          ))}
        </div>
      </div>
      <div
        id="product-view"
        className="mt-8 grid grid-cols-1 gap-6"
        role="tabpanel"
        aria-labelledby={`tour-tab-${view.media}`}
      >
        <div
          className="flex items-center justify-between gap-6 max-md:block"
          aria-live={playing ? "off" : "polite"}
        >
          <div>
            <h3 className="font-product-display text-3xl leading-tight font-semibold tracking-tighter">
              {view.heading}
            </h3>
            <p className="mt-2.5 max-w-84 text-body text-product-text-secondary">{view.copy}</p>
          </div>
          <a
            className="group inline-flex shrink-0 items-center gap-2.5 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
            href={view.href}
          >
            {view.link}
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              size={15}
              aria-hidden="true"
              className="shrink-0 transition-transform duration-180 group-hover:translate-x-0.5"
            />
          </a>
        </div>
        <div
          className={cn("rounded-xl p-3 transition-colors duration-150 md:p-6 xl:p-9", theme.wash)}
        >
          <video
            key={view.media}
            ref={videoRef}
            muted
            playsInline
            preload={inView && reducedMotion === false ? "metadata" : "none"}
            aria-label={view.alt}
            className="block aspect-video w-full rounded-lg bg-white object-contain"
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              if (progressRef.current && video.duration)
                progressRef.current.style.transform = `scaleX(${video.currentTime / video.duration})`;
            }}
            onEnded={() => {
              if (canPlay) select((selected + 1) % views.length);
            }}
            onError={() => setFailed(true)}
          >
            <source src={`/product-tour/${view.media}.mp4`} type="video/mp4" />
          </video>
        </div>
        {failed ? (
          <p className="text-xs text-product-text-secondary">
            Playback is unavailable. Use the tabs to explore the product screens.
          </p>
        ) : null}
      </div>
    </div>
  );
}
