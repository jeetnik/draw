'use client';

import { GoogleGeminiEffect } from '@/components/ui/google-gemini-effect';
import Navbar from '@/components/NavBar';
import { WobbleCardDemo } from '../components/WobbleCardD';
import { MacbookScroll } from '@/components/ui/macbook-scroll';

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        
        {/* GoogleGeminiEffect Section */}
        <div className="h-[100vh] w-full bg-black dark:border dark:border-white/[0.1] rounded-md relative pt-30">
          <GoogleGeminiEffect />
        </div>
<MacbookScroll/>
        {/* WobbleCardDemo Section */}
        <div className="h-[100vh] w-full bg-black dark:border dark:border-white/[0.1] rounded-md relative pt-20">
          <WobbleCardDemo />
        </div>

      </div>
    </>
  );
}
