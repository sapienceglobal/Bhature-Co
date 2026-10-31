import React from 'react';
import BhaturaHeader from '@/components/branded/bhatura-and-co/BhaturaHeader';
import BhaturaFooter from '@/components/branded/bhatura-and-co/BhaturaFooter';
import TermsConditionsSection from '@/components/branded/lassi-lounge/sections/TermsConditionsSection';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bhaturaandco.com';

export const metadata = {
  title: 'Terms & Conditions | Bhatura & Co',
  description: 'Terms and Conditions for using Bhatura & Co customer and online ordering services.',
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDF8EE]">
      <BhaturaHeader />
      <main className="flex-1">
        <TermsConditionsSection />
      </main>
      <BhaturaFooter />
    </div>
  );
}
