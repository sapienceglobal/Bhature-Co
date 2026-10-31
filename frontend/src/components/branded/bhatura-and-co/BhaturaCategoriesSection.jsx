'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getCategory3DImage } from '@/lib/category3DHelper';
import { restaurantAPI } from '@/lib/api';

const DEFAULT_CATEGORIES = [
  { name: 'Chole Bhature' },
  { name: 'Parathas' },
  { name: 'Curries' },
  { name: 'Rice & Biryani' },
  { name: 'Snacks' },
  { name: 'Beverages' },
];

const RESTAURANT_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co';

export default function BhaturaCategoriesSection() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    let alive = true;
    restaurantAPI.getById(RESTAURANT_ID)
      .then((res) => {
        const cats = res?.data?.menu || [];
        const valid = cats.filter((c) => (c.items || []).filter((i) => i.isAvailable !== false).length > 0);
        if (alive && valid.length > 0) {
          setCategories(valid.slice(0, 6));
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <section className="pt-4 pb-20 sm:pb-24 bg-gradient-to-b from-[#FDF7ED] via-[#FCF4E8] to-[#FAEEDF] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-9 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#D48228] uppercase tracking-[0.2em] mb-1.5">
              <span>EXPLORE OUR MENU</span>
              <span className="w-8 h-[2px] bg-[#D48228]" />
            </div>
            <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#6D1318] tracking-tight">
              Delicious Categories
            </h2>
          </div>

          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#8B1E1E] text-[#8B1E1E] hover:bg-[#8B1E1E] hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 self-start sm:self-auto shadow-sm"
          >
            <span>View Full Menu</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* 6 Circular Categories Grid with 3D Pop-Out Dishes */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-7">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/menu?category=${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center group text-center"
            >
              {/* Circular 3D Card with Golden Ring and Depth Shadows */}
              <div 
                className="relative w-[96px] h-[96px] sm:w-[124px] sm:h-[124px] rounded-full p-1 bg-gradient-to-b from-[#F2D1A0] via-[#E5B580] to-[#C99158] shadow-[0_6px_18px_rgba(139,30,30,0.12)] group-hover:shadow-[0_12px_28px_rgba(139,30,30,0.22)] group-hover:scale-105 transition-all duration-300"
              >
                {/* Inner radial gradient backdrop */}
                <div 
                  className="relative w-full h-full rounded-full flex items-center justify-center overflow-visible"
                  style={{
                    background: 'radial-gradient(circle at 50% 40%, #FFFDF9 0%, #FDE9D3 65%, #F7D4AA 100%)',
                  }}
                >
                  {/* Soft elliptical contact shadow beneath floating 3D dish */}
                  <div
                    className="absolute bottom-2.5 w-16 h-2 rounded-full pointer-events-none transition-opacity duration-300 group-hover:opacity-75"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 75%)',
                      filter: 'blur(2px)',
                    }}
                  />

                  {/* 3D Cutout Dish Image popping out with depth shadow */}
                  <img
                    src={getCategory3DImage(cat.name)}
                    alt={cat.name}
                    className="w-[68px] h-[68px] sm:w-[88px] sm:h-[88px] object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.24)] group-hover:drop-shadow-[0_12px_18px_rgba(139,30,30,0.35)] -mt-1 group-hover:scale-115 group-hover:-translate-y-1.5 transition-all duration-300 pointer-events-none"
                  />
                </div>
              </div>

              {/* Category Name Label */}
              <span className="mt-2.5 sm:mt-3.5 text-xs sm:text-base font-bold text-[#1C1917] group-hover:text-[#8B1E1E] transition-colors leading-snug">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

      </div>

      {/* Wave into Most Loved peach band */}
      <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1440 64" fill="none" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,22 C360,50 760,52 1100,30 C1260,20 1360,18 1440,22 L1440,64 L0,64 Z" fill="#F7E6D2" />
          <path d="M0,22 C360,50 760,52 1100,30 C1260,20 1360,18 1440,22" fill="none" stroke="#FFFDF8" strokeWidth="3" />
        </svg>
      </div>
    </section>
  );
}
