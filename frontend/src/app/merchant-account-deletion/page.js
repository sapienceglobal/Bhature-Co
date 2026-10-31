import React from 'react';
import MerchantPublicHeader from '@/components/merchant-public/MerchantPublicHeader';
import MerchantPublicFooter from '@/components/merchant-public/MerchantPublicFooter';
import MerchantAccountDeletionSection from '@/components/branded/lassi-lounge/sections/MerchantAccountDeletionSection';

export const metadata = {
  title: 'Merchant & Partner Account Deletion | Bhatura & Co',
  description: 'Merchant partner and restaurant manager account deletion portal for Bhatura & Co store operations and mobile merchant app users.',
  alternates: {
    canonical: '/merchant-account-deletion',
  },
};

export default function MerchantAccountDeletionPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDF8EE]">
      <MerchantPublicHeader />
      <main className="flex-1">
        <MerchantAccountDeletionSection />
      </main>
      <MerchantPublicFooter />
    </div>
  );
}
