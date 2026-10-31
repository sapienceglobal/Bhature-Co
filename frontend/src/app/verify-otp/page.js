'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ArrowRight, RotateCcw, ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import BhaturaHeader from '@/components/branded/bhatura-and-co/BhaturaHeader';

const IMG = '/assets/images/branded/bhatura-and-co';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  const redirectTo = searchParams?.get('redirect') || '/';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      router.replace('/login');
    }
  }, [email, router]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    if (value.length > 1) {
      const digits = value.slice(0, 6 - index).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const lastIndex = Math.min(index + digits.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.verifyOtp(email.toLowerCase(), otpValue);
      toast.success(res?.message || 'Email verified successfully! Welcome to Bhatura & Co 🎉');
      // Full page reload to populate real auth state
      window.location.href = redirectTo;
    } catch (err) {
      toast.error(err?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendLoading) return;
    try {
      setResendLoading(true);
      await authAPI.resendOtp(email.toLowerCase());
      toast.success('A new OTP has been sent to your email');
      setSecondsLeft(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF3E7] text-[#1C1917] flex flex-col">
      <BhaturaHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-[26px] border border-[#EFE3D3] shadow-[0_12px_45px_rgba(92,6,18,0.08)] p-6 sm:p-8 text-center">
          
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <Image
              src={`${IMG}/logo-emblem.png`}
              alt="Bhatura & Co"
              width={180}
              height={56}
              className="h-14 w-auto object-contain mix-blend-multiply"
              priority
            />
          </div>

          <div className="w-12 h-12 rounded-full bg-[#8B1E1E]/10 text-[#8B1E1E] flex items-center justify-center mx-auto mb-3">
            <Mail size={22} />
          </div>

          <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-black text-[#1C1917] mb-1">
            Verify Your Email
          </h1>
          <p className="text-xs sm:text-sm text-[#6B625A] mb-6 leading-relaxed">
            We&apos;ve sent a 6-digit verification code to<br />
            <strong className="text-[#1C1917]">{email}</strong>
          </p>

          <form onSubmit={handleVerify} className="space-y-6">
            {/* 6 Digit Input Boxes */}
            <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 sm:w-12 h-13 sm:h-14 text-center text-xl font-bold rounded-lg border-2 border-[#E6DACB] bg-[#FFFDF9] text-[#1C1917] focus:border-[#8B1E1E] focus:outline-none focus:ring-1 focus:ring-[#8B1E1E] transition-all"
                />
              ))}
            </div>

            {/* Verify CTA */}
            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full h-12 rounded-lg bg-[#9E141D] hover:bg-[#830F16] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(158,20,29,0.30)] transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <span>Verify &amp; Continue</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 pt-5 border-t border-[#F0E6D8] text-center text-xs sm:text-sm">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="font-bold text-[#8B1E1E] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                {resendLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                <span>Resend Code</span>
              </button>
            ) : (
              <span className="text-[#8C8074]">
                Didn&apos;t receive the code? Resend in{' '}
                <strong className="text-[#8B1E1E] font-bold">{secondsLeft}s</strong>
              </span>
            )}
          </div>

          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[#8C8074] hover:text-[#8B1E1E] transition"
            >
              <ArrowLeft size={13} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF3E7]" />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
