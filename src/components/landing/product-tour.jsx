"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, BrushIcon, ChartLineData01Icon, GlobeIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

import { useEffect, useRef, useState } from "react";
const views = [
  { title: "Design", heading: "Make it yours.", copy: "Start with a template. Edit your page and preview it on any screen.", link: "Try the form", href: "#preview", media: "design", icon: BrushIcon, alt: "Waitlyze builder editing a sample headline, then switching to the mobile preview." },
  { title: "Publish", heading: "Your website. Or ours.", copy: "Embed it with a simple script, or share a page hosted by Waitlyze.", link: "Explore the signup options", href: "#features", media: "publish", icon: GlobeIcon, alt: "Waitlyze publication options: copy a hosted page link or the website embed script." },
  { title: "Understand", heading: "Find your momentum.", copy: "See visitors, signups, and verification. Compare date ranges or explore the data table.", link: "Explore the features", href: "#features", media: "understand", icon: ChartLineData01Icon, alt: "Waitlyze analytics with dummy activity, changing the date range and switching from chart to table." },
];

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
  const canPlay = playing && reducedMotion === false && visible && inView && !failed;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(preference.matches);
    const syncVisibility = () => setVisible(!document.hidden);
    syncMotion(); syncVisibility();
    preference.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .2 });
    observer.observe(rootRef.current);
    return () => { preference.removeEventListener("change", syncMotion); document.removeEventListener("visibilitychange", syncVisibility); observer.disconnect(); };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    if (canPlay) void video.play().catch(() => { if (!cancelled) setPlaying(false); });
    else video.pause();
    return () => { cancelled = true; };
  }, [canPlay, selected]);

  function select(index, keyboard = false) {
    if (index === selected) { if (keyboard) { setPlaying(false); tabsRef.current[index]?.focus(); } return; }
    setSelected(index); setFailed(false);
    if (keyboard) { setPlaying(false); tabsRef.current[index]?.focus(); }
    if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";
  }
  function onKeyDown(event) {
    const next = event.key === "ArrowRight" ? (selected + 1) % views.length : event.key === "ArrowLeft" ? (selected + views.length - 1) % views.length : event.key === "Home" ? 0 : event.key === "End" ? views.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); select(next, true);
  }

  return <div className="wl-product-tour" data-theme={view.media} ref={rootRef} onMouseEnter={() => setPlaying(false)} onMouseLeave={() => setPlaying(true)} onFocusCapture={(event) => { if (event.target.matches(":focus-visible")) setPlaying(false); }}>
    <div className="wl-tour-toolbar">
      <div className="wl-tour-controls" role="tablist" aria-label="Product walkthrough" onKeyDown={onKeyDown}>{views.map((item, index) => <Button key={item.title} ref={(node) => { tabsRef.current[index] = node; }} id={`tour-tab-${item.media}`} type="button" role="tab" aria-selected={index === selected} tabIndex={index === selected ? 0 : -1} aria-controls="product-view" onClick={(event) => { select(index); if (event.detail > 0) setPlaying(true); }}><HugeiconsIcon icon={item.icon} size={17} aria-hidden="true" />{item.title}<span className="wl-tour-progress" aria-hidden="true"><i ref={index === selected ? progressRef : null} /></span></Button>)}</div>
    </div>
    <div id="product-view" className="wl-tour-view" role="tabpanel" aria-labelledby={`tour-tab-${view.media}`}>
      <div className="wl-tour-copy" aria-live={playing ? "off" : "polite"}><div><h3>{view.heading}</h3><p>{view.copy}</p></div><a className="wl-text-link" href={view.href}>{view.link}<HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" /></a></div>
      <div className="wl-tour-media"><video key={view.media} ref={videoRef} muted playsInline preload={inView && reducedMotion === false ? "metadata" : "none"} poster={`/product-tour/${view.media}.webp`} aria-label={view.alt} onTimeUpdate={(event) => { const video = event.currentTarget; if (progressRef.current && video.duration) progressRef.current.style.transform = `scaleX(${video.currentTime / video.duration})`; }} onEnded={() => { if (canPlay) select((selected + 1) % views.length); }} onError={() => setFailed(true)}><source src={`/product-tour/${view.media}.mp4`} type="video/mp4" /></video></div>
      {failed ? <p className="wl-tour-media-error">Playback is unavailable. Use the tabs to explore the product screens.</p> : null}
    </div>
  </div>;
}
