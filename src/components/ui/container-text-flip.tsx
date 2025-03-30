"use client";

import React, { useState, useEffect, useId } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export interface ContainerTextFlipProps {
  /** Array of words to cycle through in the animation */
  words?: string[];
  /** Time in milliseconds between word transitions */
  interval?: number;
  /** Additional CSS classes to apply to the container */
  className?: string;
  /** Additional CSS classes to apply to the text */
  textClassName?: string;
  /** Duration of the transition animation in milliseconds */
  animationDuration?: number;
}

export function ContainerTextFlip({
  words = ["Draw", "Ask", "Discover"],
  interval = 2000,
  className,
  textClassName,
  animationDuration = 700,
}: ContainerTextFlipProps) {
  // Generate a unique ID for this component instance
  const id = useId();
  // Track the current word being displayed
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  // Track the width of the container for smooth transitions
  const [width, setWidth] = useState(100);
  // Reference to the text element to measure its width
  const textRef = React.useRef(null);
  
  // Function to update container width based on the current word
  const updateWidthForWord = () => {
    if (textRef.current) {
      // Add some padding to the text width (30px on each side)
      // @ts-ignore
      const textWidth = textRef.current.scrollWidth + 30;
      setWidth(textWidth);
    }
  };
  
  // Update width whenever the word changes
  useEffect(() => {
    updateWidthForWord();
  }, [currentWordIndex]);
  
  // Set up interval to cycle through words
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
      // Width will be updated in the effect that depends on currentWordIndex
    }, interval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [words, interval]);
  
  return (
    <motion.div
      layout
      layoutId={`words-here-${id}`}
      animate={{ width }}
      transition={{ duration: animationDuration / 2000 }}
      className={cn(
        // Decreased text size from text-4xl/text-7xl to text-3xl/text-5xl
        "relative inline-block rounded-lg pt-2 pb-3 text-center text-3xl font-bold text-black md:text-5xl dark:text-white",
        "[background:linear-gradient(to_bottom,var(--color-gray-100),var(--color-gray-200))]",
        "shadow-[inset_0_-1px_var(--color-gray-300),inset_0_0_0_1px_var(--color-gray-300),_0_4px_8px_var(--color-gray-300)]",
        "dark:[background:linear-gradient(to_bottom,var(--color-neutral-700),var(--color-neutral-800))]",
        "dark:shadow-[inset_0_-1px_#10171e,inset_0_0_0_1px_hsla(205,89%,46%,.24),_0_4px_8px_#00000052]",
        className,
      )}
      key={words[currentWordIndex]}
    >
      <motion.div
        transition={{
          duration: animationDuration / 1000,
          ease: "easeInOut",
        }}
        className={cn("inline-block", textClassName)}
        ref={textRef}
        layoutId={`word-div-${words[currentWordIndex]}-${id}`}
      >
        <motion.div className="inline-block">
          {words[currentWordIndex].split("").map((letter, index) => (
            <motion.span
              key={index}
              initial={{
                opacity: 0,
                filter: "blur(10px)",
              }}
              animate={{
                opacity: 1,
                filter: "blur(0px)",
              }}
              transition={{
                delay: index * 0.02,
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}