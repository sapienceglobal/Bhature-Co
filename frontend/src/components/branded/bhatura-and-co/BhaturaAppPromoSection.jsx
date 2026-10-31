'use client';

import Image from 'next/image';

export default function BhaturaAppPromoSection() {
  const perks = [
    {
      title: 'Exclusive App Offers',
      icon: (
        <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M12.97 2.59a1.5 1.5 0 0 0-1.94 0l-7.5 6.25a1.5 1.5 0 0 0-.53 1.15v10.51a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V9.99a1.5 1.5 0 0 0-.53-1.15l-7.5-6.25z"/>
        </svg>
      )
    },
    {
      title: 'Easy Reordering',
      icon: (
        <svg className="w-5 h-5 fill-none stroke-current stroke-2 text-white" viewBox="0 0 24 24">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
        </svg>
      )
    },
    {
      title: 'Track Your Orders',
      icon: (
        <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
        </svg>
      )
    },
    {
      title: 'Faster Checkout',
      icon: (
        <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
        </svg>
      )
    }
  ];

  return (
    <section className="relative bg-gradient-to-r from-[#F9E4CC] via-[#F8DFC2] to-[#F9E4CC] border-t border-[#F0D2B0] overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left: Heading & Store Buttons */}
            <div className="lg:col-span-5 flex flex-col items-start z-10 py-10 lg:py-12">
              <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-[40px] font-black text-[#C0262D] leading-tight mb-3">
                Order Faster with Our App
              </h2>
              <p className="text-sm sm:text-base text-[#44403C] mb-6 leading-relaxed">
                Get exclusive offers, easy reordering and a better experience on the Bhatura&amp;Co mobile app.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <a href="#" aria-label="Get it on Google Play" className="flex items-center gap-3 h-[52px] px-4 rounded-xl bg-black border border-white/20 text-white shadow-md hover:scale-105 transition-transform">
                  <svg viewBox="0 0 24 26" className="w-7 h-7">
                    <path d="M1 1.5 13.5 13 1 24.5c-.4-.3-.6-.8-.6-1.4V2.9c0-.6.2-1.1.6-1.4z" fill="#00D7FE" />
                    <path d="M17.7 8.8 13.5 13 1 1.5c.4-.3 1-.4 1.6-.1l15.1 7.4z" fill="#00F076" />
                    <path d="M17.7 17.2 2.6 24.6c-.6.3-1.2.2-1.6-.1L13.5 13l4.2 4.2z" fill="#F8364A" />
                    <path d="m22.4 11.5-4.7-2.7L13.5 13l4.2 4.2 4.7-2.7c1.1-.6 1.1-2.4 0-3z" fill="#FFD400" />
                  </svg>
                  <span className="flex flex-col leading-none text-left">
                    <span className="text-[10px] uppercase tracking-wide">Get it on</span>
                    <span className="text-[19px] font-semibold mt-0.5">Google Play</span>
                  </span>
                </a>
                <a href="#" aria-label="Download on the App Store" className="flex items-center gap-3 h-[52px] px-4 rounded-xl bg-black border border-white/20 text-white shadow-md hover:scale-105 transition-transform">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                    <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.77-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.39-3.66zM14.1 5.86c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.27z" />
                  </svg>
                  <span className="flex flex-col leading-none text-left">
                    <span className="text-[10px]">Download on the</span>
                    <span className="text-[19px] font-semibold mt-0.5">App Store</span>
                  </span>
                </a>
              </div>
            </div>

            {/* Center: 3D phone with leaves, popping above the band */}
            <div className="lg:col-span-4 relative flex justify-center items-end self-stretch">
              <div
                className="relative w-full max-w-[340px] aspect-square lg:-mt-16 hover:scale-105 transition-transform duration-500"
                style={{
                  WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 80%, transparent 100%)',
                  maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 80%, transparent 100%)',
                }}
              >
                <Image
                  src="/assets/images/branded/bhatura-and-co/app_phone_leaves.jpg"
                  alt="Bhatura & Co Mobile App"
                  fill
                  sizes="340px"
                  className="object-contain mix-blend-multiply"
                />
              </div>
            </div>

            {/* Right: 4 Perks */}
            <div className="lg:col-span-3 flex flex-col gap-4 pb-10 lg:pb-0">
              {perks.map((p) => (
                <div key={p.title} className="flex items-center gap-3">
                  <div className="rounded-full bg-[#C0262D] ring-4 ring-[#C0262D]/15 flex items-center justify-center shrink-0 shadow-sm" style={{ width: '38px', height: '38px' }}>
                    {p.icon}
                  </div>
                  <span className="text-sm sm:text-[15px] font-bold text-[#1C1917]">{p.title}</span>
                </div>
              ))}
            </div>

        </div>
      </div>
    </section>
  );
}
