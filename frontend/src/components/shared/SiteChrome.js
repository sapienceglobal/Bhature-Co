'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import BhaturaHeader from '@/components/branded/bhatura-and-co/BhaturaHeader';
import BhaturaFooter from '@/components/branded/bhatura-and-co/BhaturaFooter';
import CartSidebar from '@/components/ui/CartSidebar';
import MobileBottomNav from '@/components/shared/MobileBottomNav';

import WhatsAppWidget from '@/components/common/WhatsAppWidget';

const SINGLE_MODE = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const isAdminOrMerchant = pathname.startsWith('/admin') || pathname.startsWith('/merchant') || pathname.startsWith('/restaurant-panel');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/reset-password') || pathname.startsWith('/forgot-password') || pathname.startsWith('/verify-otp');
  const isStandalonePage = pathname.startsWith('/payment-success');
  const isMerchantPublicPage = pathname.startsWith('/merchant-') || pathname === '/merchant-portal';

  if (isAuthPage || isAdminOrMerchant || isStandalonePage || isMerchantPublicPage) {
    return (
      <div className="flex flex-col min-h-screen">
        {children}
      </div>
    );
  }

  // industry Standard: Wrap everything in a flex-col with min-h-screen
  if (SINGLE_MODE && !isAdminOrMerchant) {
    return (
      <div className="flex flex-col min-h-screen pb-16 lg:pb-0 relative">
        <BhaturaHeader />
        <CartSidebar />
        <MobileBottomNav />
        {children}
        <BhaturaFooter />
        <WhatsAppWidget />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-16 lg:pb-0 relative">
      <Header />
      <CartSidebar />
      <MobileBottomNav />
      {children}
      <Footer />
      <WhatsAppWidget />
    </div>
  );
}