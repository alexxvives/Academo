"use client";

import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface VideoIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const VideoIcon = forwardRef<HTMLDivElement, VideoIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("inline-flex", className)} {...props}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M23 7l-7 5 7 5V7z"
            fill="currentColor"
          />
          <rect
            x="1"
            y="5"
            width="15"
            height="14"
            rx="2"
            fill="currentColor"
          />
        </svg>
      </div>
    );
  }
);

VideoIcon.displayName = "VideoIcon";

export { VideoIcon };
