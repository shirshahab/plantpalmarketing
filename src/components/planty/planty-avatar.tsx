"use client";

import { useState } from "react";
import Image from "next/image";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANTY_SRC = "/assets/planty/planty-happy.png";

type PlantySize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<PlantySize, string> = {
  sm: "h-14 w-14 sm:h-[56px] sm:w-[56px]",
  md: "h-[72px] w-[72px] sm:h-20 sm:w-20",
  lg: "h-[72px] w-[72px] sm:h-24 sm:w-24",
};

/** Official Planty mascot with leaf-icon fallback if the image fails to load. */
export function PlantyAvatar({
  size = "md",
  className,
  showLabel = false,
  label = "Planty",
}: {
  size?: PlantySize;
  className?: string;
  showLabel?: boolean;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#74c365] bg-[#dcfce7] shadow-md",
          SIZE_CLASS[size]
        )}
      >
        {failed ? (
          <Leaf className="h-1/2 w-1/2 text-[#2d6a4f]" aria-hidden />
        ) : (
          <Image
            src={PLANTY_SRC}
            alt="Planty, PlantPal mascot"
            fill
            className="object-contain object-center p-0.5"
            sizes="96px"
            onError={() => setFailed(true)}
            priority={size === "lg"}
          />
        )}
        {showLabel && (
          <span className="absolute -bottom-0.5 rounded-full bg-brand-primary px-1.5 text-[8px] font-bold text-white">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
