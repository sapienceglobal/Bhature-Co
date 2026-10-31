'use client';

import { useState } from 'react';
import BhaturaHeader from './BhaturaHeader';
import BhaturaHeroSection from './BhaturaHeroSection';
import BhaturaCategoriesSection from './BhaturaCategoriesSection';
import BhaturaMostLovedDishes from './BhaturaMostLovedDishes';
import BhaturaSpecialOfferBanner from './BhaturaSpecialOfferBanner';
import BhaturaStorySection from './BhaturaStorySection';
import BhaturaFeaturesStrip from './BhaturaFeaturesStrip';
import BhaturaReviewsSection from './BhaturaReviewsSection';
import BhaturaAppPromoSection from './BhaturaAppPromoSection';
import BhaturaFooter from './BhaturaFooter';
import AddressModal from '@/components/shared/AddressModal';

export default function BhaturaLanding() {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDF8EE] text-[#1C1917] flex flex-col selection:bg-[#D4AF37]/30 selection:text-[#5C0612]">
      {/* 1. Header */}
      <BhaturaHeader onOpenAddressModal={() => setIsAddressModalOpen(true)} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <BhaturaHeroSection onOpenAddressModal={() => setIsAddressModalOpen(true)} />

        {/* 3. Delicious Categories */}
        <BhaturaCategoriesSection />

        {/* 4. Most Loved Dishes */}
        <BhaturaMostLovedDishes />

        {/* 5. Special Offer Banner */}
        <BhaturaSpecialOfferBanner />

        {/* 6. Our Story */}
        <BhaturaStorySection />

        {/* 7. Value Features Strip */}
        <BhaturaFeaturesStrip />

        {/* 8. Loved by Foodies Reviews */}
        <BhaturaReviewsSection />

        {/* 9. Order Faster with Our App */}
        <BhaturaAppPromoSection />
      </main>

      {/* 10. Footer */}
      <BhaturaFooter />

      {/* Shared Address / Geolocation Modal */}
      {isAddressModalOpen && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          onSelectAddress={(addr) => {
            console.log('Selected address:', addr);
            setIsAddressModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
