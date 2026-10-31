'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

const reviews = [
  {
    name: 'Priya S.',
    avatar: '/assets/images/branded/bhatura-and-co/avatar_priya.png',
    quote: '"The best Chole Bhature I\'ve had outside Delhi! Authentic taste and super fast delivery."',
    rating: 5
  },
  {
    name: 'Rahul M.',
    avatar: '/assets/images/branded/bhatura-and-co/avatar_rahul.png',
    quote: '"Every dish is flavourful and reminds me of home. Highly recommended!"',
    rating: 5
  },
  {
    name: 'Anjali K.',
    avatar: '/assets/images/branded/bhatura-and-co/avatar_anjali.png',
    quote: '"Amazing food, great portions and always fresh. Bhatura&Co is our family\'s favourite!"',
    rating: 5
  }
];

export default function BhaturaReviewsSection() {
  return (
    <section className="py-8 sm:py-10 bg-gradient-to-b from-[#FDF7EE] to-[#FBF2E6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#C0262D] uppercase tracking-[0.15em] mb-1">
              <span>WHAT OUR CUSTOMERS SAY</span>
              <span className="w-8 h-[2px] bg-[#D48228]" />
            </div>
            <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-[38px] font-black text-[#1C1917] leading-tight">
              Loved by Foodies
            </h2>
          </div>

          <Link
            href="/about-us"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-[#C0262D] text-[#C0262D] bg-white/60 hover:bg-[#C0262D] hover:text-white text-xs sm:text-sm font-bold transition-all duration-200 self-start sm:self-auto shadow-sm"
          >
            <span>View All Reviews</span>
            <span className="font-bold">→</span>
          </Link>
        </div>

        {/* 3 Review Cards */}
        <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 gap-4 md:gap-5 pb-2 -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {reviews.map((rev) => (
            <div
              key={rev.name}
              className="w-[85vw] max-w-[330px] shrink-0 snap-center md:w-auto md:max-w-none bg-white rounded-xl p-4 sm:p-5 border border-[#F0E6D8] shadow-[0_4px_16px_rgba(139,30,30,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-start gap-4"
            >
              <div className="relative w-16 h-16 min-w-[64px] rounded-full overflow-hidden shrink-0 bg-[#FAF0E1] shadow-sm">
                <Image src={rev.avatar} alt={rev.name} fill className="object-cover" sizes="64px" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm text-[#44403C] italic leading-relaxed font-['Poppins'] mb-2">
                  {rev.quote}
                </p>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-[#1C1917]">{rev.name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} size={16} className="fill-[#F5B014] text-[#F5B014]" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
