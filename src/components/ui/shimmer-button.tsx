import React, { CSSProperties, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  borderWidth?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "100px",
      background = "rgba(0, 0, 0, 1)",
      borderWidth = "2px",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--duration": shimmerDuration,
            "--bg": background,
            "--border-width": borderWidth,
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 text-white [border-radius:var(--radius)] dark:text-black",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* Animated border */}
        <div className="absolute inset-0 overflow-hidden [border-radius:var(--radius)]">
          <div 
            className="absolute -inset-[25%] opacity-70"
            style={{
              background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
              width: "150%",
              height: "300%",
              animation: `shimmer-smooth var(--duration) linear infinite`,
              transformOrigin: "0% 0%",
            }}
          />
        </div>
        
        {/* Inner content background */}
        <div className="absolute inset-[var(--border-width)] z-0 [background:var(--bg)] [border-radius:calc(var(--radius)_-_var(--border-width))]" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Highlight */}
        <div
          className={cn(
            "absolute inset-[var(--border-width)] z-0",
            "rounded-[calc(var(--radius)_-_var(--border-width))] shadow-[inset_0_-8px_10px_#ffffff1f]",
            "transform-gpu transition-all duration-300 ease-in-out",
            "group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]",
            "group-active:shadow-[inset_0_-10px_10px_#ffffff3f]",
          )}
        />
      </button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";