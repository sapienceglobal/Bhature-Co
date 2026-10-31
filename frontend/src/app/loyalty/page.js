import LassiLoyaltyPage from '@/components/branded/lassi-lounge/LassiLoyaltyPage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bhaturaandco.com';

export const metadata = {
  title: 'Loyalty Rewards | Bhatura & Co',
  description: 'Join Bhatura & Co Rewards to earn points, free treats, and exclusive discounts on every order.',
  alternates: {
    canonical: `${siteUrl}/loyalty`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoyaltyPage() {
  return <LassiLoyaltyPage />;
}
