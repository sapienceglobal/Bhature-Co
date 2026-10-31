'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function BhaturaStorySection() {
  return (
    <section className="pt-8 pb-12 lg:pt-2 lg:pb-14 bg-[#FCF5EB] relative z-30 overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          
          {/* Left Column: Typography */}
          <div className="lg:col-span-6 flex flex-col items-start max-w-xl">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#D48228] uppercase tracking-[0.2em] mb-2">
              <span>OUR STORY</span>
              <span className="w-8 h-[2px] bg-[#D48228]" />
            </div>

            <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-[46px] font-black text-[#1C1917] leading-[1.15] mb-4">
              More Than Just Food
            </h2>

            <p className="text-[#44403C] text-sm sm:text-base lg:text-[17px] leading-relaxed mb-6 font-['Poppins']">
              At Bhatura&Co, we bring you the authentic taste of North India, made with traditional recipes, fresh ingredients and a whole lot of love. From fluffy bhature to rich curries, every dish is a celebration of flavour and culture.
            </p>

            <Link
              href="/about-us"
              className="px-8 py-3.5 rounded-full bg-[#8B1E1E] hover:bg-[#701515] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>About Us</span>
              <span className="text-white font-black text-sm">→</span>
            </Link>
          </div>

          {/* Right Column: Two Polaroid Photo Frames with Authentic Angles & Real Generated Imagery */}
          <div className="lg:col-span-6 relative flex justify-center items-center lg:-mt-28">
            <div className="relative w-full max-w-[600px] h-[320px] sm:h-[400px] flex items-center justify-center">
              
              {/* Left Polaroid: Chef actively kneading fresh bhatura dough (rises into offer section) */}
              <div 
                className="absolute left-0 top-0 z-10 w-[58%] bg-white p-2.5 sm:p-3 rounded-md shadow-2xl transform -rotate-[5deg] hover:-rotate-1 hover:scale-[1.03] transition-transform duration-300"
              >
                <div className="relative aspect-[1/1] rounded-sm overflow-hidden bg-[#EFE8DC]">
                  <Image
                    src="/assets/images/branded/bhatura-and-co/story_chef_kneading.jpg"
                    alt="Artisan Chef Kneading Fresh Bhatura Dough"
                    fill
                    sizes="340px"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Right Polaroid: Traditional Indian Spice Bowls */}
              <div 
                className="absolute right-0 top-14 sm:top-20 z-0 w-[54%] bg-white p-2.5 sm:p-3 rounded-md shadow-xl transform rotate-[5deg] hover:rotate-1 hover:scale-[1.03] transition-transform duration-300"
              >
                <div className="relative aspect-[1/1] rounded-sm overflow-hidden bg-[#EFE8DC]">
                  <Image
                    src="/assets/images/branded/bhatura-and-co/story_spice_bowls.jpg"
                    alt="Authentic Indian Spice Bowls & Aromatics"
                    fill
                    sizes="320px"
                    className="object-cover"
                  />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
