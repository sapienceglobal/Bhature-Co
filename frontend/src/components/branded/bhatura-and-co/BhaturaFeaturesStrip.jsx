'use client';

export default function BhaturaFeaturesStrip() {
  const features = [
    {
      title: 'Authentic Taste',
      subtitle: 'Traditional North Indian flavours',
      icon: (
        <svg className="w-7 h-7 fill-[#C0262D]" viewBox="0 0 24 24">
          <path d="M12 2C8.69 2 6 4.69 6 8c0 1.25.38 2.41 1.03 3.38L6.5 15h11l-.53-3.62C17.62 10.41 18 9.25 18 8c0-3.31-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4 0 .74-.2 1.44-.56 2.03L14.7 11h-5.4l-.74-.97A3.978 3.978 0 0 1 8 8c0-2.21 1.79-4 4-4zM7 17h10v2H7v-2zm1 3h8v1.5H8V20z"/>
        </svg>
      )
    },
    {
      title: 'Hygienic & Freshly Cooked',
      subtitle: 'Quality food you can trust',
      icon: (
        <svg className="w-7 h-7 fill-none stroke-[#C0262D] stroke-2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <line x1="5.64" y1="5.64" x2="18.36" y2="18.36" />
        </svg>
      )
    },
    {
      title: 'Fast & Reliable Delivery',
      subtitle: 'Hot and fresh at your doorstep',
      icon: (
        <svg className="w-7 h-7 fill-[#C0262D]" viewBox="0 0 24 24">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      )
    },
    {
      title: 'Great Value',
      subtitle: 'Delicious food, affordable prices',
      icon: (
        <svg className="w-7 h-7 fill-[#C0262D]" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    }
  ];

  return (
    <section className="py-5 sm:py-6 bg-gradient-to-b from-[#F8E6D0] to-[#F6E1C8] border-y border-[#EED6BA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((item) => (
            <div key={item.title} className="flex items-center gap-2.5 sm:gap-4">
              <div 
                className="w-11 h-11 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 border-2 border-[#F0A050] bg-[#FFF8EF] shadow-sm"
              >
                {item.icon}
              </div>
              <div>
                <h4 className="text-xs sm:text-[15px] font-bold text-[#1C1917] leading-tight">
                  {item.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-[#78716C] mt-1 leading-tight">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
