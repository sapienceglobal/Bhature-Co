import React from 'react';
import BhaturaHeader from '@/components/branded/bhatura-and-co/BhaturaHeader';
import BhaturaFooter from '@/components/branded/bhatura-and-co/BhaturaFooter';
import PrivacyPolicySection from '@/components/branded/lassi-lounge/sections/PrivacyPolicySection';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bhaturaandco.com';

export const metadata = {
  title: 'Privacy Policy | Bhatura & Co',
  description: 'Privacy Policy and Data Protection guidelines for Bhatura & Co. Learn how we handle customer data securely.',
  alternates: {
    canonical: `${siteUrl}/privacy-policy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDF8EE]">
      <BhaturaHeader />
      <main className="flex-1">
        <PrivacyPolicySection />
      </main>
      <BhaturaFooter />
    </div>
  );
}
