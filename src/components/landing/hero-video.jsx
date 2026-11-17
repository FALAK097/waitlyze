"use client";

import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Interactive Hero Video Player
 *
 * Enables YouTube-style click-to-play / click-to-pause directly on the video screen
 * with an animated feedback ripple in the center, while preserving native controls,
 * captions, keyboard shortcuts, and responsive aspect ratio.
 */
export function HeroVideo({
  poster,
  src,
  captionsSrc,
  width = 1920,
  height = 1080,
  ariaLabel = "Waitlyze launch film",
  className = "",
}) {
  const videoRef = useRef(null);
  const [, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimerRef = useRef(null);

  const triggerFeedback = useCallback((type) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback({ type, key: Date.now() });
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
    }, 600);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video
        .play()
        .then(() => {
          triggerFeedback("play");
        })
        .catch(() => {});
    } else {
      video.pause();
      triggerFeedback("pause");
    }
  }, [triggerFeedback]);

  const handleVideoClick = useCallback(
    (e) => {
      const video = videoRef.current;
      if (!video) return;

      // Ignore clicks within the bottom control bar area (~56px) so scrubbing,
      // volume slider, captions, and native fullscreen buttons are unaffected.
      const rect = video.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      if (clickY > rect.height - 56) {
        return;
      }

      togglePlayback();
    },
    [togglePlayback],
  );

  const handleKeyDown = useCallback(
    (e) => {
      // YouTube 'k' shortcut to toggle play/pause when the player has focus
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlayback();
      }
    },
    [togglePlayback],
  );

  return (
    <figure className={`wl-launch-film relative ${className}`.trim()}>
      <div className="relative w-full overflow-hidden rounded-xl">
        <video
          ref={videoRef}
          controls
          playsInline
          preload="none"
          poster={poster}
          width={width}
          height={height}
          aria-label={ariaLabel}
          onClick={handleVideoClick}
          onKeyDown={handleKeyDown}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="cursor-pointer"
        >
          <source src={src} type="video/mp4" />
          <track kind="captions" src={captionsSrc} srcLang="en" label="English" />
          <a href={src}>Watch the Waitlyze launch film</a>
        </video>

        {/* YouTube-style center play/pause indicator badge */}
        {feedback && (
          <div
            key={feedback.key}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="wl-video-feedback-badge flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950/75 text-white shadow-xl backdrop-blur-xs">
              <HugeiconsIcon
                icon={feedback.type === "play" ? PlayIcon : PauseIcon}
                size={28}
                className="fill-current text-white"
              />
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}
