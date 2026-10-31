'use client';

import { useState } from 'react';
import BhaturaHeader from './BhaturaHeader';
import BhaturaHeroSection, { parseAddressString } from './BhaturaHeroSection';
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
          onSelect={(locationData) => {
            const { address, lat, lng, addressDetails, flatNo } = locationData || {};
            if (address) {
              const addr = addressDetails || {};
              const streetBase = `${addr.house_number || ''} ${addr.road || ''}`.trim();
              const parsed = parseAddressString(address, {
                street: streetBase || undefined,
                addressLine2: flatNo || undefined,
                city: addr.city || addr.town || addr.village || addr.suburb || undefined,
                state: addr.state ? addr.state.substring(0, 2).toUpperCase() : undefined,
                zipCode: addr.postcode ? addr.postcode.substring(0, 5) : undefined,
                lat: lat ?? null,
                lng: lng ?? null,
                label: 'Pinned Location',
              });
              try {
                localStorage.setItem('bhatura_selected_address', JSON.stringify(parsed));
                localStorage.setItem('bhatura_order_mode', 'delivery');
                window.dispatchEvent(new Event('bhatura-address-updated'));
              } catch {
                /* ignore */
              }
            }
            setIsAddressModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
