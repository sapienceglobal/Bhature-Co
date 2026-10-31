import LassiOffersPage from '@/components/branded/lassi-lounge/LassiOffersPage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bhaturaandco.com';

export const metadata = {
  title: 'Offers & Deals | Bhatura & Co',
  description: 'View active coupons, special promotions, and exclusive discounts for Bhatura & Co.',
  alternates: {
    canonical: `${siteUrl}/offers`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function OffersPage() {
  return <LassiOffersPage />;
}
