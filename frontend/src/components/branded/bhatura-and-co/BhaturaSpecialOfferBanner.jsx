'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BhaturaSpecialOfferBanner() {
  const [copied, setCopied] = useState(false);
  const couponCode = 'BHATURA20';

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    toast.success('Coupon BHATURA20 copied! 🎉', { duration: 2000 });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section
      className="relative overflow-visible z-20 pt-4 pb-14 lg:pt-0 lg:pb-12"
      style={{
        background:
          'radial-gradient(ellipse 45% 70% at 72% 55%, #F4DFC4 0%, transparent 70%), linear-gradient(180deg, #F6E7D5 0%, #F9EDDE 50%, #F7E8D6 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Content */}
          <div className="lg:col-span-6 flex flex-col items-start z-10">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#D48228] uppercase tracking-[0.2em] mb-2">
              <span>SPECIAL OFFER</span>
              <span className="w-8 h-[2px] bg-[#D48228]" />
            </div>

            <h2 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-[54px] font-black text-[#8B1E1E] leading-tight mb-2">
              Get 20% Off
            </h2>
            <p className="text-base sm:text-xl font-bold text-[#1C1917] mb-7">
              On Your First Order
            </p>

            {/* Coupon Box & Order Now Button */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#D4AF37]/50 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">Use Code</span>
                <span className="text-sm font-black text-[#1C1917] tracking-wider">{couponCode}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 text-gray-400 hover:text-[#8B1E1E] transition-colors"
                  title="Copy Code"
                >
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>

              <Link
                href="/menu"
                className="px-7 py-3 rounded-xl bg-[#8B1E1E] hover:bg-[#701515] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
              >
                <span>Order Now</span>
                <span className="text-[#D4AF37] font-black">→</span>
              </Link>
            </div>
          </div>

          {/* Right Food Plate: Big 3D Platter gently dipping across wave */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end items-center mt-4 lg:mt-0 z-20">
            <div 
              className="relative w-full max-w-[680px] aspect-[4/3] lg:-my-6 lg:scale-[1.12] hover:scale-[1.15] transition-transform duration-500"
              style={{
                WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 80%, transparent 100%)',
                maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 80%, transparent 100%)',
              }}
            >
              <Image
                src="/assets/images/branded/bhatura-and-co/offer_plate_3d_v2.jpg"
                alt="Delicious Bhature Offer Platter"
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-contain mix-blend-multiply"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Smooth Organic Wave Divider matching Our Story (#FCF5EB) */}
      <div className="absolute bottom-0 left-0 right-0 h-14 sm:h-20 pointer-events-none z-10 overflow-hidden">
        <svg viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,28 C300,58 640,64 960,40 C1180,24 1340,30 1440,36" fill="none" stroke="#C9935E" strokeWidth="6" className="opacity-25" style={{ filter: 'blur(3px)' }} />
          <path d="M0,28 C300,58 640,64 960,40 C1180,24 1340,30 1440,36 L1440,80 L0,80 Z" fill="#FCF5EB" />
          <path d="M0,28 C300,58 640,64 960,40 C1180,24 1340,30 1440,36" fill="none" stroke="#FFFDF8" strokeWidth="3" />
        </svg>
      </div>
    </section>
  );
}
