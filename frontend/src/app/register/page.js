import { Suspense } from 'react';
import BhaturaAuthPage from '@/components/branded/bhatura-and-co/auth/BhaturaAuthPage';

export const metadata = {
  title: 'Create Your Account | Bhatura & Co - Chhole Bhature & More',
  description:
    'Sign up for Bhatura & Co to enjoy delicious North Indian food, exclusive offers and a faster ordering experience.',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF3E7]" />}>
      <BhaturaAuthPage mode="register" />
    </Suspense>
  );
}
