"use client";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  ...props
}) {
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState("TOP");

  const rotateDirection = (currentDirection) => {
    const directions = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const currentIndex = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  };

  const movingMap = {
    TOP: "radial-gradient(20.7% 50% at 50% 0%, #ff7e5f 0%, rgba(255, 126, 95, 0.3) 50%, rgba(255, 126, 95, 0) 100%)",
    LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, #ff7e5f 0%, rgba(255, 126, 95, 0.3) 50%, rgba(255, 126, 95, 0) 100%)",
    BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, #ff7e5f 0%, rgba(255, 126, 95, 0.3) 50%, rgba(255, 126, 95, 0) 100%)",
    RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, #ff7e5f 0%, rgba(255, 126, 95, 0.3) 50%, rgba(255, 126, 95, 0) 100%)",
  };

  const highlight = "radial-gradient(75% 181.16% at 50% 50%, #ff7e5f 0%, rgba(255, 126, 95, 0.6) 60%, rgba(255, 126, 95, 0) 100%)";

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered]);
  return (
    <Tag
      onMouseEnter={(event) => {
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "flex overflow-visible relative flex-col flex-nowrap gap-10 justify-center content-center items-center p-px rounded-full transition-all duration-700 bg-gradient-to-r from-[#ff7e5f]/20 via-[#ff7e5f]/10 to-[#ff7e5f]/20 hover:from-[#ff7e5f]/30 hover:via-[#ff7e5f]/20 hover:to-[#ff7e5f]/30 dark:from-white/20 dark:to-white/20 h-min box-decoration-clone w-fit",
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          "z-10 px-4 py-2 w-auto text-white bg-black rounded-[inherit]",
          className
        )}
      >
        {children}
      </div>
      <motion.div
        className={cn(
          "overflow-hidden absolute inset-0 z-0 flex-none rounded-[inherit]"
        )}
        style={{
          filter: "blur(2px)",
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered
            ? [movingMap[direction], highlight]
            : movingMap[direction],
        }}
        transition={{
          duration: 3,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      <div className="bg-black absolute z-1 flex-none inset-[2px] rounded-[100px]" />
    </Tag>
  );
}
