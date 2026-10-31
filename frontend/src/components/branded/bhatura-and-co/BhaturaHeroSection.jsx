'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Bike, ShoppingBag, UtensilsCrossed, MapPin } from 'lucide-react';

export default function BhaturaHeroSection({ onOpenAddressModal }) {
  const [orderMode, setOrderMode] = useState('delivery');
  const [addressInput, setAddressInput] = useState('');
  const router = useRouter();

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    router.push('/order-online');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FCF1E3] via-[#FAF0E1] via-60% to-[#E8BE90] min-h-[500px] lg:min-h-[560px] flex items-center">

      {/* 2. Desktop 3D Hero Dish Artwork (maroon arc + steam baked in, left edge fades into cream) */}
      <div
        className="hidden lg:block absolute top-0 right-0 h-full w-[58%] xl:w-[54%] 2xl:w-[50%] pointer-events-none select-none z-0 overflow-hidden"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 18%)',
          maskImage: 'linear-gradient(to right, transparent 0%, #000 18%)',
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src="/assets/images/branded/bhatura-and-co/hero_dish_3d_v2.jpg"
            alt="Fluffy Bature with Pindi Chhole, Onion, Lemon and Steam"
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover object-center"
          />
        </div>
      </div>

      {/* 4. Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 lg:py-16 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left Column: Typography, Badges, Order Controls */}
          <div className="lg:col-span-7 flex flex-col items-start text-left max-w-xl lg:max-w-none">

            {/* Tagline */}
            <span className="text-xs sm:text-sm font-bold text-[#D48228] tracking-[0.2em] uppercase mb-2">
              Authentic North Indian Food
            </span>

            {/* Main Headline */}
            <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-[54px] font-black text-[#1C1917] leading-[1.1] mb-3 tracking-tight">
              Fluffy Bature.{' '}
              <span className="text-[#8B1E1E]">Rich Traditions.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[#57534E] text-sm sm:text-base lg:text-lg max-w-lg mb-6 leading-relaxed font-['Poppins']">
              Freshly prepared North Indian delicacies, delivered to your doorstep.
            </p>

            {/* 3 Feature Badges with Red Outlined Icons */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-5 sm:mb-7 w-full max-w-lg">

              {/* Badge 1: Premium Ingredients */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[#1C1917]">
                <div className="w-7 h-7 rounded-full bg-[#8B1E1E]/10 flex items-center justify-center shrink-0 text-[#8B1E1E]">
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.5 3 8 7 9.5 0-4 1.5-8 5-11.5 3.5-3.5 7.5-5 11.5-5C25.5 5 12 2 12 2z" />
                    <path d="M9 15c3-3 6-5 10-6" />
                  </svg>
                </div>
                <span className="leading-tight">Premium Ingredients</span>
              </div>

              {/* Badge 2: Traditional Recipes */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[#1C1917]">
                <div className="w-7 h-7 rounded-full bg-[#8B1E1E]/10 flex items-center justify-center shrink-0 text-[#8B1E1E]">
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path d="M6 18h12M6 14h12M7 14c-1.5 0-3-1.5-3-3.5 0-1.8 1.4-3.3 3.2-3.5C7.7 5.2 9.7 4 12 4s4.3 1.2 4.8 3C18.6 7.2 20 8.7 20 10.5c0 2-1.5 3.5-3 3.5" />
                  </svg>
                </div>
                <span className="leading-tight">Traditional Recipes</span>
              </div>

              {/* Badge 3: Fast & Reliable Delivery */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[#1C1917]">
                <div className="w-7 h-7 rounded-full bg-[#8B1E1E]/10 flex items-center justify-center shrink-0 text-[#8B1E1E]">
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <span className="leading-tight">Fast & Reliable Delivery</span>
              </div>

            </div>

            {/* Mobile Hero Dish Preview (Shown only on small screens) */}
            <div className="lg:hidden w-full mb-6 relative rounded-2xl overflow-hidden shadow-xl aspect-[5/4]">
              <Image
                src="/assets/images/branded/bhatura-and-co/hero_dish_3d_v2.jpg"
                alt="Fluffy Bature with Pindi Chhole"
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Order Mode Tab Pill Bar */}
            <div className="flex sm:inline-flex w-full sm:w-auto justify-between sm:justify-start items-center rounded-2xl bg-[#1E1B18] p-1.5 shadow-md mb-4">
              <button
                type="button"
                onClick={() => setOrderMode('delivery')}
                className={'flex flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ' + (orderMode === 'delivery' ? 'bg-[#F26522] text-white shadow-sm' : 'text-white/80 hover:text-white')}
              >
                <Bike size={16} /> Delivery
              </button>
              <span className="h-4 w-px bg-white/20 mx-1" />
              <button
                type="button"
                onClick={() => setOrderMode('pickup')}
                className={'flex flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ' + (orderMode === 'pickup' ? 'bg-[#F26522] text-white shadow-sm' : 'text-white/80 hover:text-white')}
              >
                <ShoppingBag size={16} /> Pickup
              </button>
              <span className="h-4 w-px bg-white/20 mx-1" />
              <button
                type="button"
                onClick={() => setOrderMode('dinein')}
                className={'flex flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ' + (orderMode === 'dinein' ? 'bg-[#F26522] text-white shadow-sm' : 'text-white/80 hover:text-white')}
              >
                <UtensilsCrossed size={16} /> Dine-in
              </button>
            </div>

            {/* Address Search Bar */}
            <form onSubmit={handleOrderSubmit} className="w-full max-w-lg">
              <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-[#E8DEC8] p-1.5 sm:p-2">
                <div className="pl-3 pr-2 text-[#DC2626]">
                  <MapPin size={22} className="fill-[#DC2626] text-white" />
                </div>
                <input
                  type="text"
                  placeholder="Enter your delivery address"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onClick={onOpenAddressModal}
                  className="w-full bg-transparent py-2.5 pr-3 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:outline-none font-medium"
                />
                <button
                  type="submit"
                  className="shrink-0 px-4 sm:px-6 py-3 rounded-xl bg-[#8B1E1E] hover:bg-[#701515] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Order Now</span>
                  <span className="text-[#D4AF37] font-black">→</span>
                </button>
              </div>
            </form>

          </div>

          {/* Desktop Right Column Spacer to reserve layout space */}
          <div className="hidden lg:block lg:col-span-5 pointer-events-none" />

        </div>
      </div>

      {/* 5. Bottom Smooth Organic Wave Transition into Categories */}
      <div className="absolute bottom-0 left-0 right-0 h-14 sm:h-20 pointer-events-none z-10 overflow-hidden">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Soft shadow under the wave lip */}
          <path
            d="M0,30 C360,62 720,66 1080,44 C1260,33 1360,26 1440,24"
            fill="none"
            stroke="#C9935E"
            strokeWidth="6"
            className="opacity-25"
            style={{ filter: 'blur(3px)' }}
          />
          {/* Wave Fill matching Category Section background (#FDF7ED) */}
          <path
            d="M0,30 C360,62 720,66 1080,44 C1260,33 1360,26 1440,24 L1440,80 L0,80 Z"
            fill="#FDF7ED"
          />
          {/* Light highlight line on the wave lip */}
          <path
            d="M0,30 C360,62 720,66 1080,44 C1260,33 1360,26 1440,24"
            fill="none"
            stroke="#FFFDF8"
            strokeWidth="3"
          />
        </svg>
      </div>
    </section>
  );
}
