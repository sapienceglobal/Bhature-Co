import React from 'react';
import MerchantPublicHeader from '@/components/merchant-public/MerchantPublicHeader';
import MerchantPublicFooter from '@/components/merchant-public/MerchantPublicFooter';
import MerchantPrivacyPolicySection from '@/components/branded/lassi-lounge/sections/MerchantPrivacyPolicySection';

export const metadata = {
  title: 'Merchant & Partner Privacy Policy | Bhatura & Co',
  description: 'Data protection, hardware permissions, and privacy guidelines for Bhatura & Co restaurant partners and mobile merchant app users.',
  alternates: {
    canonical: '/merchant-privacy-policy',
  },
};

export default function MerchantPrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDF8EE]">
      <MerchantPublicHeader />
      <main className="flex-1">
        <MerchantPrivacyPolicySection />
      </main>
      <MerchantPublicFooter />
    </div>
  );
}
