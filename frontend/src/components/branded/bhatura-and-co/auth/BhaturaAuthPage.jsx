'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import {
  User, Phone, Mail, Lock, Eye, EyeOff, ArrowRight, Check, Loader2, QrCode, X,
  Tag, Heart, Clock, Crown, Leaf, ChefHat, Truck, Bike, Gift, AlertCircle,
} from 'lucide-react';
import BhaturaHeader from '../BhaturaHeader';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

const IMG = '/assets/images/branded/bhatura-and-co';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Form Field Input with Leading Icon, Red Error State & Inline Error Message ── */
const Field = ({ icon: Icon, right, error, className = '', ...props }) => (
  <div className="w-full">
    <div
      className={`flex items-center h-10 sm:h-[42px] rounded-lg border bg-white px-3.5 transition-all shadow-2xs ${
        error
          ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
          : 'border-[#E6DACB] focus-within:border-[#8B1E1E] focus-within:ring-1 focus-within:ring-[#8B1E1E]'
      } ${className}`}
    >
      <Icon size={18} className={`shrink-0 mr-2.5 transition-colors ${error ? 'text-red-500' : 'text-[#8C8074]'}`} />
      <input
        {...props}
        className="w-full bg-transparent text-sm text-[#1C1917] placeholder:text-[#9C9084] focus:outline-none"
      />
      {right}
    </div>
    {error && (
      <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
        <AlertCircle size={13} className="shrink-0 text-red-500" />
        <span>{error}</span>
      </p>
    )}
  </div>
);

const EyeToggle = ({ show, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={show ? 'Hide password' : 'Show password'}
    className="text-[#8C8074] hover:text-[#8B1E1E] shrink-0 ml-2 cursor-pointer transition-colors"
  >
    {show ? <Eye size={18} /> : <EyeOff size={18} />}
  </button>
);

const Checkbox = ({ checked, onChange, id, children }) => (
  <label htmlFor={id} className="flex items-center gap-2.5 cursor-pointer select-none text-[13px] text-[#44403C]">
    <input id={id} type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <span
      className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center border transition-all ${
        checked ? 'bg-[#B0151D] border-[#B0151D]' : 'bg-white border-[#CDBFAE]'
      }`}
    >
      {checked && <Check size={12} strokeWidth={3.5} className="text-white" />}
    </span>
    <span>{children}</span>
  </label>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="#111">
    <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.72-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.86-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.65-.39 6.57 1.1 8.72.73 1.05 1.6 2.23 2.73 2.19 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.29-.88-2.3-3.49zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.68.97.07 1.96-.49 2.56-1.23z" />
  </svg>
);

/* Decorative Indian mandala for corners */
const Mandala = ({ className = '' }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" stroke="#D8B587" strokeWidth="1">
    {Array.from({ length: 16 }).map((_, i) => (
      <ellipse key={i} cx="100" cy="100" rx="16" ry="68" transform={`rotate(${i * 11.25} 100 100)`} />
    ))}
    <circle cx="100" cy="100" r="24" strokeWidth="1.2" />
    <circle cx="100" cy="100" r="44" strokeDasharray="3 4" />
    <circle cx="100" cy="100" r="75" strokeWidth="1" />
    <circle cx="100" cy="100" r="92" strokeDasharray="2 3" strokeWidth="1.2" />
  </svg>
);

/* ── Side Perks on Right Edge ── */
const SIDE_PERKS = [
  { icon: Bike, label: 'Fast & Reliable\nDelivery' },
  { icon: Gift, label: 'Exclusive\nOffers & Deals' },
  { icon: Clock, label: 'Easy\nReordering' },
  { icon: Heart, label: 'Your Favourite\nItems Saved', filled: true },
];

/* ── Left Hero Configurations ── */
const HERO = {
  register: {
    title: (
      <>
        <span>Create Your</span>
        <br />
        <span className="text-[#F2B544]">Bhatura</span>
        <span className="text-[#F2B544]">&amp;Co</span>
        <br />
        <span>Account</span>
      </>
    ),
    sub: 'Join us to enjoy delicious North Indian food, exclusive offers and a faster ordering experience.',
    align: 'left',
    perks: [
      { icon: Tag, label: 'Exclusive\nOffers & Discounts' },
      { icon: Heart, label: 'Save Your\nFavourite Orders' },
      { icon: Clock, label: 'Track Your\nOrders Easily' },
      { icon: Crown, label: 'Faster\nCheckout' },
    ],
  },
  login: {
    title: (
      <>
        <span className="text-[28px] sm:text-[34px] lg:text-[40px] block font-medium">Welcome to</span>
        <span className="text-white">Bhatura</span>
        <span className="text-[#F2B544]">&amp;Co</span>
      </>
    ),
    tagline: 'Authentic North Indian Food, Delivered to You',
    sub: 'Freshly prepared with love, tradition and the finest ingredients.',
    align: 'center',
    perks: [
      { icon: Leaf, label: 'Fresh\nIngredients' },
      { icon: ChefHat, label: 'Authentic\nFlavours' },
      { icon: Heart, label: 'Hygienic\nCooking' },
      { icon: Truck, label: 'Fast & Reliable\nDelivery' },
    ],
  },
};

export default function BhaturaAuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/';
  const { login, register, socialLogin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loginTab, setLoginTab] = useState('password'); // 'password' | 'otp'
  const [rememberMe, setRememberMe] = useState(true);
  const [agree, setAgree] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const googleWrapRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [forgotError, setForgotError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
    identifier: '',
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const goAfterAuth = (user) => {
    const role = user?.role;
    if (role === 'admin' || role === 'superadmin') {
      window.location.href = '/admin';
    } else if (role === 'merchant' || role === 'restaurant_owner' || role === 'staff') {
      window.location.href = '/merchant';
    } else {
      window.location.href = redirectTo;
    }
  };

  /* ── Register handler: calls backend register → redirects to /verify-otp ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, phone, email, password, confirm } = form;
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your full name';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      newErrors.phone = 'Please enter your mobile number';
    } else if (cleanPhone.length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!EMAIL_RE.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Please enter a password';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirm) {
      newErrors.confirm = 'Please confirm your password';
    } else if (password !== confirm) {
      newErrors.confirm = 'Passwords do not match';
    }

    if (!agree) {
      newErrors.agree = 'Please agree to the Terms & Conditions and Privacy Policy';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      const res = await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'customer',
        agreedToTerms: true,
      });

      toast.success(res?.message || 'Account created! Please verify your email with the OTP.');
      router.push(
        `/verify-otp?email=${encodeURIComponent(res?.email || email.trim().toLowerCase())}&redirect=${encodeURIComponent(
          redirectTo
        )}`
      );
    } catch (err) {
      toast.error(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Login handler: accepts either email or mobile number ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    const id = form.identifier.trim();

    if (loginTab === 'otp') {
      return handleOtpLogin();
    }

    const newErrors = {};
    if (!id) {
      newErrors.identifier = 'Please enter your email address or mobile number';
    }
    if (!form.password) {
      newErrors.password = 'Please enter your password';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      const data = await login(id, form.password, rememberMe);

      if (data?.requires2fa) {
        toast('Two-factor authentication required');
        router.push(`/merchant/login?tempToken=${encodeURIComponent(data.tempToken || '')}`);
        return;
      }

      toast.success(`Welcome back${data?.name ? `, ${data.name.split(' ')[0]}` : ''}!`);
      goAfterAuth(data);
    } catch (err) {
      const msg = err?.message || 'Login failed';
      if (/verif/i.test(msg)) {
        toast.error('Please verify your email first. We sent you a new code.');
        authAPI.resendOtp(id.toLowerCase()).catch(() => {});
        router.push(
          `/verify-otp?email=${encodeURIComponent(id.toLowerCase())}&redirect=${encodeURIComponent(redirectTo)}`
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── "Login with OTP": sends email code via backend & opens verify screen ── */
  const handleOtpLogin = async () => {
    const id = form.identifier.trim();
    if (!id) return toast.error('Please enter your registered email address');

    try {
      setLoading(true);
      await authAPI.resendOtp(id.toLowerCase());
      toast.success('Verification code sent to your email');
      router.push(`/verify-otp?email=${encodeURIComponent(id)}&redirect=${encodeURIComponent(redirectTo)}`);
    } catch (err) {
      toast.error(err?.message || 'Could not send OTP. Please login with password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (cred) => {
    try {
      setLoading(true);
      const user = await socialLogin('google', cred.credential, 'customer');
      toast.success('Signed in with Google');
      goAfterAuth(user);
    } catch (err) {
      toast.error(err?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address');
      return;
    }
    if (!EMAIL_RE.test(forgotEmail.trim())) {
      setForgotError('Please enter a valid email address');
      return;
    }
    setForgotError('');

    try {
      setForgotLoading(true);
      await authAPI.forgotPassword(forgotEmail.trim().toLowerCase());
      toast.success('Password reset link sent to your email');
      setForgotOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Could not send reset link');
    } finally {
      setForgotLoading(false);
    }
  };

  const hero = HERO[mode];

  return (
    <div className="min-h-screen bg-[#FBF3E7] text-[#1C1917] flex flex-col selection:bg-[#D4AF37]/30 selection:text-[#5C0612]">
      {/* ═══ 1. SHARED FLOATING HEADER ═══ */}
      <BhaturaHeader />

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Subtle decorative mandalas on cream background corners */}
        <Mandala className="hidden lg:block absolute -top-16 right-[-50px] w-64 h-64 opacity-40 pointer-events-none" />
        <Mandala className="hidden lg:block absolute -bottom-20 right-[-30px] w-72 h-72 opacity-40 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-[51%_49%] flex-1 lg:h-[calc(100vh-70px)] lg:overflow-hidden">
          
          {/* ══════════════════════════════════════════════════════════════
              LEFT COLUMN: FOOD HERO (BHATURE PLATTER + CHOLE)
          ══════════════════════════════════════════════════════════════ */}
          <section className="relative overflow-hidden min-h-[250px] sm:min-h-[340px] lg:min-h-0 bg-[#140904] flex flex-col justify-between">
            <Image
              src={`${IMG}/auth_hero.jpg`}
              alt="Chole Bhature at Bhatura & Co"
              fill
              priority
              sizes="(min-width: 1024px) 51vw, 100vw"
              className="object-cover object-bottom"
            />

            {/* Dark gradient overlay for pristine text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/55 via-50% to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />

            {/* Traditional Indian Scalloped Ogee Arch Separator (Login mode) */}
            {!isRegister && (
              <svg
                className="hidden lg:block absolute top-0 right-[-1px] h-full w-12 z-20 pointer-events-none"
                viewBox="0 0 48 700"
                preserveAspectRatio="none"
              >
                <path
                  d="M48,0 L24,0 C12,40 32,70 18,110 C4,150 28,180 14,220 C0,260 26,290 12,330 C0,370 28,400 14,440 C0,480 28,510 14,550 C2,590 26,620 16,660 L24,700 L48,700 Z"
                  fill="#FBF3E7"
                />
                <path
                  d="M24,0 C12,40 32,70 18,110 C4,150 28,180 14,220 C0,260 26,290 12,330 C0,370 28,400 14,440 C0,480 28,510 14,550 C2,590 26,620 16,660 L24,700"
                  fill="none"
                  stroke="#D9A45C"
                  strokeWidth="2.5"
                />
              </svg>
            )}

            {/* Smooth elegant curve for Register mode */}
            {isRegister && (
              <svg
                className="hidden lg:block absolute top-0 right-[-1px] h-full w-14 z-20 pointer-events-none"
                viewBox="0 0 60 700"
                preserveAspectRatio="none"
              >
                <path d="M60,0 L36,0 C18,150 10,350 30,700 L60,700 Z" fill="#FBF3E7" />
              </svg>
            )}

            {/* Hero Text Block */}
            <div
              className={`relative z-10 px-6 sm:px-10 lg:px-[11%] pt-8 sm:pt-10 lg:pt-8 ${
                hero.align === 'center' ? 'text-center' : 'text-left'
              }`}
            >
              <h1 className="font-['Playfair_Display'] font-black text-white leading-[1.08] text-4xl sm:text-5xl lg:text-[54px] drop-shadow-md">
                {hero.title}
              </h1>

              {hero.tagline && (
                <p className="font-['Playfair_Display'] font-bold text-white text-xl sm:text-2xl lg:text-[25px] leading-snug mt-2.5 drop-shadow-sm">
                  {hero.tagline}
                </p>
              )}

              <p
                className={`text-white/90 text-sm sm:text-base lg:text-[17px] leading-relaxed mt-2.5 drop-shadow-sm ${
                  hero.align === 'center' ? 'max-w-md mx-auto' : 'max-w-lg'
                }`}
              >
                {hero.sub}
              </p>

              {/* 4 Feature Badges with Vertical Golden Divider Lines */}
              <div
                className={`grid grid-cols-4 mt-6 sm:mt-8 pt-2 ${
                  hero.align === 'center' ? 'max-w-lg mx-auto' : 'max-w-lg'
                }`}
              >
                {hero.perks.map(({ icon: Icon, label }, i) => (
                  <div
                    key={label}
                    className={`flex flex-col items-center text-center px-1.5 ${
                      i > 0 ? 'border-l border-[#F2B544]/35' : ''
                    }`}
                  >
                    <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-[1.5px] border-[#F2B544] flex items-center justify-center text-[#F2B544] bg-black/25 shadow-xs">
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <span className="mt-2 text-[11px] sm:text-xs font-semibold text-white leading-tight whitespace-pre-line drop-shadow-xs">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom spacer so bhature plate remains proudly displayed */}
            <div className="h-6 sm:h-14 lg:h-24 pointer-events-none" />
          </section>

          {/* ══════════════════════════════════════════════════════════════
              RIGHT COLUMN: WHITE AUTH CARD + SIDE PERKS COLUMN
          ══════════════════════════════════════════════════════════════ */}
          <section className="relative z-20 -mt-5 lg:mt-0 flex items-center justify-center px-3.5 sm:px-6 lg:px-8 pb-24 md:pb-8 pt-2 lg:py-2">
            <div className="w-full max-w-[620px] flex items-center justify-center gap-5 xl:gap-8">
              
              {/* ── Main White Floating Card ── */}
              <div className="w-full max-w-[440px] sm:max-w-[460px] bg-white rounded-[26px] border border-[#EFE3D3] shadow-[0_12px_45px_rgba(92,6,18,0.08)] px-6 sm:px-7 py-4 sm:py-5">
                
                {/* Logo Emblem */}
                <div className="flex justify-center">
                  <Image
                    src={`${IMG}/logo-emblem.png`}
                    alt="Bhatura & Co"
                    width={180}
                    height={56}
                    unoptimized className="h-11 w-auto object-contain"
                    priority
                  />
                </div>

                {/* Card Title & Subtitle */}
                <h2 className="font-['Playfair_Display'] text-[23px] sm:text-[26px] font-black text-[#1C1917] text-center mt-0.5 leading-tight">
                  {isRegister ? 'Create Your Account' : 'Login to Your Account'}
                </h2>
                <p className="text-[12.5px] text-[#6B625A] text-center mt-0.5 mb-3 leading-snug">
                  {isRegister
                    ? 'Sign up to order your favourite food, track orders and get exclusive offers.'
                    : 'Order your favourite food, track orders and enjoy exclusive offers.'}
                </p>

                {/* ── Register Form ── */}
                {isRegister ? (
                  <form onSubmit={handleRegister} className="space-y-2" noValidate>
                    {/* Full Name & Mobile Number side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <Field
                        icon={User}
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        placeholder="Full Name*"
                        autoComplete="name"
                        required
                        error={errors.name}
                      />
                      <Field
                        icon={Phone}
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={onChange}
                        placeholder="Mobile Number*"
                        autoComplete="tel"
                        required
                        error={errors.phone}
                      />
                    </div>

                    {/* Email */}
                    <Field
                      icon={Mail}
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                      placeholder="Email Address*"
                      autoComplete="email"
                      required
                      error={errors.email}
                    />

                    {/* Password */}
                    <Field
                      icon={Lock}
                      name="password"
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={onChange}
                      placeholder="Password*"
                      autoComplete="new-password"
                      required
                      error={errors.password}
                      right={<EyeToggle show={showPw} onClick={() => setShowPw((s) => !s)} />}
                    />

                    {/* Confirm Password */}
                    <Field
                      icon={Lock}
                      name="confirm"
                      type={showPw2 ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={onChange}
                      placeholder="Confirm Password*"
                      autoComplete="new-password"
                      required
                      error={errors.confirm}
                      right={<EyeToggle show={showPw2} onClick={() => setShowPw2((s) => !s)} />}
                    />

                    {/* Terms Agreement Checkbox */}
                    <div className="pt-0.5">
                      <Checkbox id="agree" checked={agree} onChange={(e) => {
                        setAgree(e.target.checked);
                        if (errors.agree) setErrors((prev) => ({ ...prev, agree: '' }));
                      }}>
                        I agree to the{' '}
                        <Link href="/terms" className="text-[#B0151D] font-semibold underline hover:text-[#8B1E1E]">
                          Terms &amp; Conditions
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy-policy" className="text-[#B0151D] font-semibold underline hover:text-[#8B1E1E]">
                          Privacy Policy
                        </Link>
                        .
                      </Checkbox>
                      {errors.agree && (
                        <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle size={13} className="shrink-0 text-red-500" />
                          <span>{errors.agree}</span>
                        </p>
                      )}
                    </div>

                    <SubmitBtn loading={loading} label="Create Account" />
                  </form>
                ) : (
                  /* ── Login Form ── */
                  <form onSubmit={handleLogin} className="space-y-3" noValidate>
                    {/* Tabs: Email / Mobile vs Login with OTP */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setLoginTab('password')}
                        className={`h-11 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                          loginTab === 'password'
                            ? 'bg-[#9E141D] text-white border-transparent shadow-sm'
                            : 'bg-white text-[#1C1917] border-[#E6DACB] hover:border-[#8B1E1E]'
                        }`}
                      >
                        <Mail size={16} /> Email / Mobile
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginTab('otp')}
                        className={`h-11 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                          loginTab === 'otp'
                            ? 'bg-[#9E141D] text-white border-transparent shadow-sm'
                            : 'bg-white text-[#1C1917] border-[#E6DACB] hover:border-[#8B1E1E]'
                        }`}
                      >
                        <QrCode size={16} /> Login with OTP
                      </button>
                    </div>

                    {/* Email / Mobile Field */}
                    <Field
                      icon={Mail}
                      name="identifier"
                      type={loginTab === 'otp' ? 'email' : 'text'}
                      value={form.identifier}
                      onChange={onChange}
                      placeholder={loginTab === 'otp' ? 'Enter registered email address' : 'Email address or Mobile Number'}
                      autoComplete="username"
                      required
                      error={errors.identifier}
                    />

                    {/* Password + Remember Me + Forgot Password */}
                    {loginTab === 'password' && (
                      <>
                        <Field
                          icon={Lock}
                          name="password"
                          type={showPw ? 'text' : 'password'}
                          value={form.password}
                          onChange={onChange}
                          placeholder="Password"
                          autoComplete="current-password"
                          required
                          error={errors.password}
                          right={<EyeToggle show={showPw} onClick={() => setShowPw((s) => !s)} />}
                        />
                        <div className="flex items-center justify-between pt-0.5">
                          <Checkbox id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
                            Remember me
                          </Checkbox>
                          <button
                            type="button"
                            onClick={() => {
                              setForgotEmail(form.identifier.includes('@') ? form.identifier : '');
                              setForgotOpen(true);
                            }}
                            className="text-[13px] font-semibold text-[#B0151D] hover:underline cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      </>
                    )}

                    <SubmitBtn loading={loading} label={loginTab === 'otp' ? 'Send OTP' : 'Login'} />
                  </form>
                )}

                {/* OR divider */}
                <div className="flex items-center gap-3 my-2.5">
                  <span className="flex-1 h-px bg-[#E9DDCD]" />
                  <span className="text-xs font-bold text-[#8C8074]">OR</span>
                  <span className="flex-1 h-px bg-[#E9DDCD]" />
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Google Login button */}
                  <div ref={googleWrapRef} className="relative h-11">
                    <div className="absolute inset-0 h-11 rounded-lg border border-[#E6DACB] bg-white flex items-center justify-center gap-2 text-[12px] sm:text-[13px] font-semibold text-[#1C1917] pointer-events-none shadow-2xs">
                      <GoogleIcon /> Continue with Google
                    </div>
                    <div className="absolute inset-0 opacity-0 overflow-hidden [&>div]:!w-full [&_iframe]:!w-full">
                      <GoogleLogin
                        onSuccess={handleGoogle}
                        onError={() => toast.error('Google sign-in failed')}
                        width="320"
                        text="continue_with"
                      />
                    </div>
                  </div>

                  {/* Apple Login button */}
                  <button
                    type="button"
                    onClick={() => toast('Apple sign-in is coming soon')}
                    className="h-11 rounded-lg border border-[#E6DACB] bg-white flex items-center justify-center gap-2 text-[12px] sm:text-[13px] font-semibold text-[#1C1917] hover:border-[#8B1E1E] transition shadow-2xs cursor-pointer"
                  >
                    <AppleIcon /> Continue with Apple
                  </button>
                </div>

                {/* Footer Switcher */}
                <p className="text-center text-sm text-[#1C1917] mt-3">
                  {isRegister ? 'Already have an account?' : 'Don\u2019t have an account?'}{' '}
                  <Link
                    href={`${isRegister ? '/login' : '/register'}${
                      redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''
                    }`}
                    className="font-bold text-[#B0151D] hover:underline ml-1"
                  >
                    {isRegister ? 'Login' : 'Sign Up'}
                  </Link>
                </p>
              </div>

              {/* ── Side Perks Column on Screen Edge ── */}
              <aside className="hidden lg:flex flex-col w-[120px] shrink-0">
                {SIDE_PERKS.map(({ icon: Icon, label, filled }, i) => (
                  <div
                    key={label}
                    className={`flex flex-col items-center text-center py-4 ${
                      i > 0 ? 'border-t border-[#E7D6BF]' : ''
                    }`}
                  >
                    <Icon
                      size={32}
                      className="text-[#B0151D]"
                      fill={filled ? '#B0151D' : 'none'}
                      strokeWidth={1.8}
                    />
                    <span className="mt-2 text-[12px] font-bold text-[#1C1917] leading-tight whitespace-pre-line">
                      {label}
                    </span>
                  </div>
                ))}
              </aside>

            </div>
          </section>

        </div>
      </main>

      {/* ═══ FORGOT PASSWORD MODAL ═══ */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setForgotOpen(false)}
        >
          <form
            onSubmit={handleForgot}
            onClick={(e) => e.stopPropagation()}
            noValidate
            className="relative w-full max-w-sm bg-[#FFFDF8] rounded-2xl p-6 sm:p-7 border border-[#ECDCC8] shadow-2xl text-left animate-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#78716C] transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h3 className="font-['Playfair_Display'] text-2xl font-black text-[#8B1E1E]">Forgot Password?</h3>
            <p className="text-xs sm:text-sm text-[#6B625A] mt-1 mb-4 leading-relaxed">
              Enter your registered email address and we&apos;ll send you a password reset link.
            </p>

            <Field
              icon={Mail}
              type="email"
              value={forgotEmail}
              onChange={(e) => {
                setForgotEmail(e.target.value);
                if (forgotError) setForgotError('');
              }}
              placeholder="Enter your email address"
              required
              error={forgotError}
            />

            <SubmitBtn loading={forgotLoading} label="Send Reset Link" className="mt-4" />
          </form>
        </div>
      )}
    </div>
  );
}

function SubmitBtn({ loading, label, className = '' }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full h-10 sm:h-11 rounded-lg bg-[#9E141D] hover:bg-[#830F16] active:scale-[0.99] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(158,20,29,0.30)] transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Please wait…</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <ArrowRight size={17} />
        </>
      )}
    </button>
  );
}
