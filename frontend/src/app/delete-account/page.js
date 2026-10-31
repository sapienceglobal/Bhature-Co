import React from 'react';
import BhaturaHeader from '@/components/branded/bhatura-and-co/BhaturaHeader';
import BhaturaFooter from '@/components/branded/bhatura-and-co/BhaturaFooter';
import CustomerAccountDeletionSection from '@/components/branded/lassi-lounge/sections/CustomerAccountDeletionSection';

export const metadata = {
  title: 'Delete Customer Account & Data | Bhatura & Co',
  description: 'Permanent customer account deletion and personal data removal request portal for Bhatura & Co food delivery users.',
  alternates: {
    canonical: '/delete-account',
  },
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDF8EE]">
      <BhaturaHeader />
      <main className="flex-1">
        <CustomerAccountDeletionSection />
      </main>
      <BhaturaFooter />
    </div>
  );
}
