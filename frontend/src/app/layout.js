import './globals.css';
import { Providers } from '@/components/shared/Providers';

export const metadata = {
  title: 'Bhatura & Co | Chhole Bhature & More — New Jersey',
  description: 'Authentic Amritsari Chhole Bhature, stuffed bhature, rich Punjabi lassi, and fresh tandoori breads in New Jersey.',
  icons: {
    icon: '/assets/images/branded/bhatura-and-co/logo-full.png'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8B1E1E',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-brand="bhatura-and-co">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700&family=Poppins:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased selection:bg-[#D4AF37]/30 selection:text-[#5C0612] bg-[#FDF8EE] min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
