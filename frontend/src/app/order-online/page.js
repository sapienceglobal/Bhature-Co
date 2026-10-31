import { Suspense } from 'react';
import BhaturaOrderOnlinePage from '@/components/branded/bhatura-and-co/order-online/BhaturaOrderOnlinePage';

export const metadata = {
  title: 'Order Online | Bhatura & Co — Authentic North Indian Food Delivered',
  description:
    'Order authentic Chole Bhature, stuffed Parathas, rich Curries, Biryani and Lassi online from Bhatura & Co for fast doorstep delivery or pickup.',
};

export default function OrderOnlineRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFDF7]" />}>
      <BhaturaOrderOnlinePage />
    </Suspense>
  );
}
