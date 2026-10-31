import { Suspense } from 'react';
import BhaturaAuthPage from '@/components/branded/bhatura-and-co/auth/BhaturaAuthPage';

export const metadata = {
  title: 'Login to Your Account | Bhatura & Co - Chhole Bhature & More',
  description:
    'Log in to your Bhatura & Co account to order your favourite North Indian food, track orders and enjoy exclusive offers.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF3E7]" />}>
      <BhaturaAuthPage mode="login" />
    </Suspense>
  );
}
