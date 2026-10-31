const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bhaturaandco.com';

export const metadata = {
  title: 'Events & Parties | Bhatura & Co',
  description:
    'Host special events and private parties at Bhatura & Co. Enjoy authentic North Indian catering in an elegant setting.',
  alternates: {
    canonical: `${siteUrl}/events`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Events & Parties | Bhatura & Co',
    description:
      'Celebrate special moments with authentic North Indian cuisine at Bhatura & Co.',
    url: `${siteUrl}/events`,
  },
};

export default function EventsLayout({ children }) {
  return children;
}
