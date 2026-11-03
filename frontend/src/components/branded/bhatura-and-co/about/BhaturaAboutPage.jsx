'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Users,
  ChefHat,
  Leaf,
  Heart,
  Star,
  CookingPot,
  ThumbsUp,
} from 'lucide-react';
import BhaturaHeader from '../BhaturaHeader';
import BhaturaFooter from '../BhaturaFooter';
import AddressModal from '@/components/shared/AddressModal';

const IMG = '/assets/images/branded/bhatura-and-co';

/* ── Decorative Mandala Watermark ── */
const MandalaWatermark = ({ className = '', strokeColor = '#C99158' }) => (
  <svg
    viewBox="0 0 200 200"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="100" cy="100" r="92" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" />
    <circle cx="100" cy="100" r="76" stroke={strokeColor} strokeWidth="1.2" />
    <circle cx="100" cy="100" r="60" stroke={strokeColor} strokeWidth="0.9" strokeDasharray="2 2" />
    <circle cx="100" cy="100" r="44" stroke={strokeColor} strokeWidth="1.1" />
    <circle cx="100" cy="100" r="26" stroke={strokeColor} strokeWidth="1.2" />
    {Array.from({ length: 12 }).map((_, idx) => {
      const angle = idx * 30;
      return (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <path
            d="M100 8 Q108 32 100 56 Q92 32 100 8 Z"
            stroke={strokeColor}
            strokeWidth="0.85"
            fill="none"
          />
        </g>
      );
    })}
  </svg>
);

const COMMITMENT_ITEMS = [
  {
    icon: Leaf,
    line1: 'Fresh & Handpicked',
    line2: 'Ingredients',
  },
  {
    icon: Star,
    line1: 'Authentic',
    line2: 'North Indian Flavours',
  },
  {
    icon: CookingPot,
    line1: 'Traditional',
    line2: 'Cooking Style',
  },
  {
    icon: Heart,
    line1: 'Great Value',
    line2: 'Delicious & Affordable',
  },
  {
    icon: Users,
    line1: 'Hygienic Preparation',
    line2: 'and Clean Kitchen',
  },
  {
    icon: ThumbsUp,
    line1: 'Warm & Friendly',
    line2: 'Ambience',
  },
];

const WHY_CHOOSE_CARDS = [
  {
    image: `${IMG}/about_why_signature.jpg`,
    title: 'Signature Dishes',
    subtitle: 'Timeless classics\nloved by thousands',
  },
  {
    image: `${IMG}/about_why_variety.jpg`,
    title: 'Wide Variety',
    subtitle: 'From curries to snacks\nand beverages',
  },
  {
    image: `${IMG}/about_why_ambience.jpg`,
    title: 'Warm Ambience',
    subtitle: 'Perfect for families,\nfriends and celebrations',
  },
];

export default function BhaturaAboutPage() {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FBF6EB] text-[#1C1917] flex flex-col selection:bg-[#D4AF37]/30 selection:text-[#5C0612]">
      {/* ═══ 1. HEADER ═══ */}
      <BhaturaHeader onOpenAddressModal={() => setIsAddressModalOpen(true)} />

      <main className="flex-1">
        {/* ═══ 2. HERO BANNER ("Rooted In Authentic Flavours") ═══ */}
        <section className="relative overflow-hidden bg-[#180A05] min-h-[300px] sm:min-h-[360px] lg:min-h-[410px] flex items-center">
          <Image
            src={`${IMG}/contact_hero_bg.jpg`}
            alt="Authentic Chole Bhature platter at Bhatura & Co"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          {/* Soft atmospheric gradient on the left so text stays ultra-legible while right dish pops */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 via-48% to-transparent" />

          {/* Hero Left Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 sm:py-12">
            <div className="max-w-xl">
              <span className="block text-xs sm:text-sm font-bold text-[#F5C253] tracking-[0.22em] uppercase">
                ABOUT US
              </span>

              <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-[54px] font-black leading-[1.08] mt-2 mb-3.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                <span className="text-white block">Rooted In</span>
                <span className="text-[#F5C253] block mt-0.5">Authentic Flavours</span>
              </h1>

              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-md font-normal">
                Bringing the true taste of North India to your table
                <br className="hidden sm:inline" /> with love, tradition and the finest ingredients.
              </p>

              {/* Golden Ornamental Divider matching UI Reference */}
              <div className="flex items-center gap-2.5 mt-4 w-56 sm:w-64 text-[#E5B84B]">
                <span className="h-[1px] flex-1 bg-gradient-to-r from-[#E5B84B]/40 to-[#E5B84B]" />
                <svg
                  viewBox="0 0 36 14"
                  className="w-7 h-3 shrink-0 fill-none stroke-current"
                  strokeWidth="1.4"
                >
                  <polygon points="18,2 23,7 18,12 13,7" fill="currentColor" fillOpacity="0.25" />
                  <circle cx="9" cy="7" r="2" />
                  <circle cx="27" cy="7" r="2" />
                  <circle cx="4" cy="7" r="1" fill="currentColor" />
                  <circle cx="32" cy="7" r="1" fill="currentColor" />
                </svg>
                <span className="h-[1px] flex-1 bg-gradient-to-l from-[#E5B84B]/40 to-[#E5B84B]" />
              </div>
            </div>
          </div>

          {/* Smooth Curved Wave Transition at Bottom of Hero (arches up on left, dips under platter on right) */}
          <div className="absolute -bottom-[1px] left-0 right-0 h-8 sm:h-10 lg:h-11 pointer-events-none z-10">
            <svg viewBox="0 0 1440 44" preserveAspectRatio="none" className="w-full h-full block">
              <path
                d="M0,26 C180,0 380,4 680,22 C940,37 1180,38 1440,10 L1440,44 L0,44 Z"
                fill="#FBF6EB"
              />
            </svg>
          </div>
        </section>

        {/* ═══ 3. OUR STORY ("A Culinary Journey Inspired by Tradition") ═══ */}
        <section className="relative bg-[#FBF6EB] pt-3 sm:pt-5 pb-6 sm:pb-8 overflow-hidden">
          {/* Subtle Mandala Watermarks on Sides */}
          <div className="hidden xl:block absolute -left-24 top-12 w-56 h-56 opacity-20 pointer-events-none">
            <MandalaWatermark className="w-full h-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0 items-center relative">
              {/* ── Left Column: Story Copy + CTA (5 cols) ── */}
              <div className="lg:col-span-5 relative z-20 flex flex-col items-start lg:pr-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#9E141D] uppercase tracking-[0.18em]">
                    OUR STORY
                  </span>
                  <span className="w-12 h-[1.5px] bg-[#9E141D]/60" />
                </div>

                <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-[42px] font-black mt-1.5 leading-[1.12]">
                  <span className="text-[#1C1917] block">A Culinary Journey</span>
                  <span className="text-[#9E141D] block mt-0.5">Inspired by Tradition</span>
                </h2>

                <p className="text-xs sm:text-sm lg:text-[14.5px] text-[#44403C] mt-4 leading-relaxed max-w-xl">
                  Bhatura&amp;Co was born from a simple idea — to bring the rich and authentic
                  flavours of North Indian street food to food lovers everywhere. What started as a
                  passion for traditional recipes has grown into a dining destination where every
                  dish is prepared with genuine ingredients, time-honoured techniques and a lot of
                  love.
                </p>

                <p className="text-xs sm:text-sm lg:text-[14.5px] text-[#44403C] mt-3.5 leading-relaxed max-w-xl">
                  From our signature Chole Bhature to a wide range of North Indian delicacies, we
                  aim to create a warm and memorable dining experience that feels like home.
                </p>

                <div className="mt-6">
                  <Link
                    href="/menu"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#9E141D] hover:bg-[#7F0E16] text-white text-xs sm:text-sm font-bold shadow-[0_6px_16px_rgba(158,20,29,0.28)] transition-all hover:-translate-y-0.5"
                  >
                    <span>Our Menu</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* ── Right Column: Unified Continuous Skyline + Tilted 3-Photo Collage + Spices (7 cols) ── */}
              <div className="lg:col-span-7 relative z-10 flex justify-center lg:justify-end lg:-ml-20 xl:-ml-24 lg:-mt-4">
                <div className="relative w-full max-w-[760px] aspect-[607/386]">
                  <Image
                    src={`${IMG}/about_story_unified.png`}
                    alt="Bhatura & Co Dining Ambience, Signature Chole, Fluffy Bhature, and Heritage Skyline"
                    fill
                    priority
                    sizes="(min-width: 1024px) 62vw, 100vw"
                    className="object-contain object-right-bottom select-none pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 4. 4 STATS & TRUST STRIP (10K+ | 50+ | Fresh Ingredients | 4.8/5) ═══ */}
        <section className="bg-[#FBF6EB] pb-9 sm:pb-11">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#F6ECDC] rounded-2xl border border-[#EADBC7] shadow-[0_6px_22px_rgba(92,6,18,0.04)] px-5 py-6 sm:px-7 sm:py-7">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-0 lg:divide-x lg:divide-[#DFCBB2]">
                {/* Stat 1: 10K+ Happy Customers */}
                <div className="flex items-start gap-3.5 lg:pr-6">
                  <span className="w-12 h-12 rounded-full bg-[#9E141D] text-white flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(158,20,29,0.28)] ring-4 ring-[#9E141D]/10 mt-0.5">
                    <Users size={22} />
                  </span>
                  <div>
                    <span className="block text-2xl sm:text-[28px] font-black text-[#9E141D] leading-none">
                      10K+
                    </span>
                    <h3 className="font-['Playfair_Display'] text-xs sm:text-sm font-bold text-[#1C1917] mt-1">
                      Happy Customers
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#6B635B] mt-0.5 leading-snug">
                      Serving food lovers
                      <br />
                      every day
                    </p>
                  </div>
                </div>

                {/* Stat 2: 50+ Delicious Dishes */}
                <div className="flex items-start gap-3.5 lg:px-6">
                  <span className="w-12 h-12 rounded-full bg-[#9E141D] text-white flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(158,20,29,0.28)] ring-4 ring-[#9E141D]/10 mt-0.5">
                    <ChefHat size={22} />
                  </span>
                  <div>
                    <span className="block text-2xl sm:text-[28px] font-black text-[#9E141D] leading-none">
                      50+
                    </span>
                    <h3 className="font-['Playfair_Display'] text-xs sm:text-sm font-bold text-[#1C1917] mt-1">
                      Delicious Dishes
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#6B635B] mt-0.5 leading-snug">
                      Authentic North Indian
                      <br />
                      flavours
                    </p>
                  </div>
                </div>

                {/* Stat 3: Fresh Ingredients */}
                <div className="flex items-start gap-3.5 lg:px-6">
                  <span className="w-12 h-12 rounded-full bg-[#9E141D] text-white flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(158,20,29,0.28)] ring-4 ring-[#9E141D]/10 mt-0.5">
                    <Leaf size={21} />
                  </span>
                  <div>
                    <h3 className="font-['Playfair_Display'] text-sm sm:text-base font-extrabold text-[#1C1917] leading-snug">
                      Fresh Ingredients
                    </h3>
                    <p className="text-xs text-[#44403C] mt-1 leading-snug">
                      Quality you can trust
                    </p>
                    <p className="text-[11px] sm:text-xs text-[#6B635B] mt-0.5 leading-snug">
                      Sourced with care
                    </p>
                  </div>
                </div>

                {/* Stat 4: 4.8/5 Customer Satisfaction */}
                <div className="flex items-start gap-3.5 lg:pl-6">
                  <span className="w-12 h-12 rounded-full bg-[#9E141D] text-white flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(158,20,29,0.28)] ring-4 ring-[#9E141D]/10 mt-0.5">
                    <Heart size={21} className="fill-white" />
                  </span>
                  <div>
                    <span className="block text-2xl sm:text-[28px] font-black text-[#9E141D] leading-none">
                      4.8/5
                    </span>
                    <h3 className="font-['Playfair_Display'] text-xs sm:text-sm font-bold text-[#1C1917] mt-1">
                      Customer Satisfaction
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#6B635B] mt-0.5 leading-snug">
                      Loved for our taste
                      <br />
                      and service
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 5. OUR COMMITMENT ("Quality Ingredients Authentic Taste" — Split Maroon Banner) ═══ */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#45070B] via-[#3A0509] to-[#2B0306] text-white">
          {/* Decorative Golden Mandala Watermarks on Right Edges */}
          <div className="hidden lg:block absolute -right-20 -top-20 w-56 h-56 opacity-25 pointer-events-none">
            <MandalaWatermark className="w-full h-full" strokeColor="#D4AF37" />
          </div>
          <div className="hidden lg:block absolute -right-20 -bottom-20 w-56 h-56 opacity-25 pointer-events-none">
            <MandalaWatermark className="w-full h-full" strokeColor="#D4AF37" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* ── Left Half: Full-Bleed Chef Kneading Dough with Spices ── */}
            <div className="lg:col-span-6 relative min-h-[320px] sm:min-h-[400px] lg:min-h-[460px]">
              <Image
                src={`${IMG}/about_commitment_chef.jpg`}
                alt="Artisan Chef preparing fresh Bhatura dough with handpicked Indian spices"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center"
              />
              {/* Subtle right-edge blend into maroon on desktop */}
              <div className="hidden lg:block absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent to-[#41060A]" />
            </div>

            {/* ── Right Half: Commitment Copy + 6 Golden Feature Badges ── */}
            <div className="lg:col-span-6 flex items-center py-10 sm:py-12 px-5 sm:px-10 lg:px-12 xl:px-14 relative z-10">
              <div className="max-w-xl w-full">
                {/* Eyebrow */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#F5C253] uppercase tracking-[0.2em]">
                    OUR COMMITMENT
                  </span>
                  <span className="w-12 h-[1.5px] bg-[#F5C253]/60" />
                </div>

                {/* Heading */}
                <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-[42px] font-black mt-1.5 leading-[1.12]">
                  <span className="text-white block">Quality Ingredients</span>
                  <span className="text-[#F5C253] block mt-0.5">Authentic Taste</span>
                </h2>

                {/* Description */}
                <p className="text-xs sm:text-sm text-white/85 mt-3.5 leading-relaxed">
                  We believe great food starts with great ingredients. Our recipes are crafted using
                  fresh, handpicked ingredients, traditional spices and authentic North Indian
                  cooking methods to bring you the same taste you love and remember.
                </p>

                {/* 6 Golden-Badged Features Grid (2 cols x 3 rows) */}
                <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6 gap-y-3.5 sm:gap-y-4 mt-6 sm:mt-7">
                  {COMMITMENT_ITEMS.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <div key={item.line1} className="flex items-center gap-3.5">
                        <span className="w-11 h-11 rounded-full border-[1.8px] border-[#E5B84B] bg-[#5A0A10] text-[#F5C253] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
                          <IconComp size={19} />
                        </span>
                        <div className="text-xs sm:text-[13px] font-medium text-white/95 leading-snug">
                          <span className="block">{item.line1}</span>
                          <span className="block">{item.line2}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 6. WHY CHOOSE BHATURA&CO ("More Than Just Food It's an Experience") ═══ */}
        <section className="relative bg-[#FBF6EB] py-10 sm:py-14 overflow-hidden">
          {/* Subtle Mandala Corner Ornaments */}
          <div className="hidden lg:block absolute -left-20 -bottom-20 w-52 h-52 opacity-20 pointer-events-none">
            <MandalaWatermark className="w-full h-full" />
          </div>
          <div className="hidden lg:block absolute -right-20 -bottom-20 w-52 h-52 opacity-20 pointer-events-none">
            <MandalaWatermark className="w-full h-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* ── Left Column: Copy + Plan Your Visit CTA (5 cols) ── */}
              <div className="lg:col-span-5 flex flex-col items-start">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#9E141D] uppercase tracking-[0.18em]">
                    WHY CHOOSE BHATURA&amp;CO
                  </span>
                  <span className="w-12 h-[1.5px] bg-[#9E141D]/60" />
                </div>

                <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-[40px] font-black mt-1.5 leading-[1.12]">
                  <span className="text-[#1C1917] block">More Than Just Food</span>
                  <span className="text-[#9E141D] block mt-0.5">It&apos;s an Experience</span>
                </h2>

                <p className="text-xs sm:text-sm text-[#44403C] mt-3.5 leading-relaxed">
                  Whether it&apos;s our fluffy bhature, flavourful curries, crispy snacks or
                  refreshing beverages, we strive to give you an authentic North Indian food
                  experience that keeps you coming back for more. At Bhatura&amp;Co, it&apos;s not
                  just a meal — it&apos;s a celebration of taste, culture and togetherness.
                </p>

                <Link
                  href="/book-a-table"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#9E141D] hover:bg-[#7F0E16] text-white text-xs sm:text-sm font-bold shadow-[0_6px_16px_rgba(158,20,29,0.28)] transition-all hover:-translate-y-0.5"
                >
                  <span>Plan Your Visit</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* ── Right Column: 3 Experience Cards (7 cols) ── */}
              <div className="lg:col-span-7 flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 gap-3.5 sm:gap-5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {WHY_CHOOSE_CARDS.map((card) => (
                  <div
                    key={card.title}
                    className="w-[225px] shrink-0 snap-start sm:w-auto group bg-[#FFFDF9] rounded-2xl overflow-hidden border border-[#EFE2D2] shadow-[0_6px_20px_rgba(92,6,18,0.06)] hover:shadow-[0_12px_28px_rgba(139,30,30,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-44 sm:h-40 md:h-44 w-full overflow-hidden bg-[#2A1810]">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 100vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-3.5 sm:p-4">
                      <h3 className="font-['Playfair_Display'] text-xs sm:text-sm font-bold text-[#1C1917] leading-snug">
                        {card.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[#6B635B] mt-1 leading-relaxed whitespace-pre-line">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ 7. FOOTER ═══ */}
      <BhaturaFooter />

      {/* ═══ 8. ADDRESS MODAL ═══ */}
      {isAddressModalOpen && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          onSelectAddress={() => setIsAddressModalOpen(false)}
        />
      )}
    </div>
  );
}
