import React from 'react';
import MerchantPublicHeader from '@/components/merchant-public/MerchantPublicHeader';
import MerchantPublicFooter from '@/components/merchant-public/MerchantPublicFooter';
import MerchantPortalSection from '@/components/branded/lassi-lounge/sections/MerchantPortalSection';

export const metadata = {
  title: 'Merchant & Restaurant Operations Hub | Bhatura & Co',
  description: 'Official portal and Android application overview for Bhatura & Co restaurant managers, chefs, and partner dispatchers.',
  alternates: {
    canonical: '/merchant-portal',
  },
};

export default function MerchantPortalPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDF8EE]">
      <MerchantPublicHeader />
      <main className="flex-1">
        <MerchantPortalSection />
      </main>
      <MerchantPublicFooter />
    </div>
  );
}
