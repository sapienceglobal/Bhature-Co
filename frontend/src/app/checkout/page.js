import { Suspense } from 'react';
import BhaturaCheckoutPage from '@/components/branded/bhatura-and-co/checkout/BhaturaCheckoutPage';

export const metadata = {
  title: 'Checkout | Bhatura & Co - Chhole Bhature & More',
  description: 'Complete your online order from Bhatura & Co and enjoy authentic North Indian flavours delivered fresh to your doorstep.',
};

export default function CheckoutRoutePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF3E8]" />}>
      <BhaturaCheckoutPage />
    </Suspense>
  );
}

