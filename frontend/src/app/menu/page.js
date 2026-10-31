import { Suspense } from 'react';
import BhaturaMenuPage from '@/components/branded/bhatura-and-co/menu/BhaturaMenuPage';

export const metadata = {
  title: 'Menu | Bhatura & Co — Authentic North Indian Food',
  description: 'Explore the Bhatura & Co menu: Chole Bhature, Parathas, Curries, Rice & Biryani, Snacks, Beverages and more. Order online for delivery or pickup.',
};

export default function MenuPage() {
  return (
    <Suspense fallback={null}>
      <BhaturaMenuPage />
    </Suspense>
  );
}
