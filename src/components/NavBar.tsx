"use client";
import { useState } from "react";
import { Tv } from "lucide-react";
import { IconBrandGithub, IconBrandTwitter, IconBrandLinkedin } from "@tabler/icons-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-black text-white border-b-2 shadow-md mt-4">
      <div className="flex items-center justify-between p-3 w-full max-w-[95%] mx-auto">
        {/* Logo and brand */}
        <div className="flex items-center gap-2">
          <Tv className="h-7 w-7" />
          <span className="font-bold text-xl">Slate</span>
        </div>
        
        {/* Social media icons with links */}
        <div className="flex items-center gap-6">
          <a 
            href="https://github.com/jeetnik" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            <IconBrandGithub className="h-7 w-7 cursor-pointer" />
          </a>
          <a 
            href="https://www.linkedin.com/in/saijeet-nikam" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            <IconBrandLinkedin className="h-7 w-7 cursor-pointer" />
          </a>
          <a 
            href="https://x.com/nikamsaijeet" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            <IconBrandTwitter className="h-7 w-7 cursor-pointer" />
          </a>
        </div>
      </div>
    </nav>
  );
}