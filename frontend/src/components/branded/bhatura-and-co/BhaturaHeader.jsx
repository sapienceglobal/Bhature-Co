'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, User, Bike, Menu, X, Home, UtensilsCrossed, CalendarDays, ArrowRight } from 'lucide-react';

export default function BhaturaHeader({ onOpenAddressModal }) {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount: cartCount = 0, subtotal = 0, isCartOpen, openCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Menu', href: '/menu' },
    { label: 'Book A Table', href: '/book-a-table' },
    { label: 'About Us', href: '/about-us' },
    { label: 'Contact Us', href: '/contact-us' },
  ];

  return (
    <>
    <header className="sticky top-0 z-[100] bg-[#FCF3E8] shadow-[0_2px_10px_rgba(92,6,18,0.08)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[70px] flex items-center justify-between gap-4 relative">
        
        {/* Brand Logo sitting on a curved bump that flows out of the bar */}
        <Link href="/" className="relative z-10 flex items-center group w-40 sm:w-64 h-full shrink-0">
          {/* Curved bump shape (same color as bar) hanging below the header */}
          <svg
            viewBox="0 0 300 40"
            preserveAspectRatio="none"
            className="absolute left-[-28px] sm:left-[-36px] top-full w-[calc(100%+56px)] sm:w-[calc(100%+72px)] h-5 sm:h-6 pointer-events-none"
            style={{ filter: 'drop-shadow(0 4px 4px rgba(92,6,18,0.08))' }}
          >
            <path d="M0,0 C18,0 24,38 48,38 L258,38 C280,38 285,0 300,0 Z" fill="#FCF3E8" />
          </svg>
          <div className="absolute left-0 top-1 sm:top-1.5 w-full h-[64px] sm:h-[88px] transition-transform duration-300 group-hover:scale-[1.03]">
            <Image
              src="/assets/images/branded/bhatura-and-co/logo-emblem.png"
              alt="Bhatura & Co - Chhole Bhature & More"
              fill
              sizes="256px"
              unoptimized className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-9 ml-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative text-[15px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-[#C0262D] font-semibold' : 'text-[#1C1917] hover:text-[#C0262D]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-2.5 left-0 w-full h-[3px] bg-[#C0262D] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 md:ml-6">
          {/* Order Online Button */}
          <Link
            href="/order-online"
            className="hidden sm:inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-b from-[#9B1C22] to-[#7A1218] hover:from-[#8B1E1E] hover:to-[#5C0612] text-white text-sm font-semibold shadow-[0_6px_16px_rgba(139,30,30,0.35)] transition-all duration-200 hover:-translate-y-0.5"
          >
            <Bike size={20} strokeWidth={2} />
            <span>Order Online</span>
            <span className="font-bold">→</span>
          </Link>

          {/* User Account */}
          <button
            onClick={() => router.push(isAuthenticated ? '/profile' : '/login')}
            className="p-2 rounded-full hover:bg-[#8B1E1E]/5 text-[#1C1917] hover:text-[#C0262D] transition-colors"
            title={isAuthenticated ? `Logged in as ${user?.name || 'User'}` : 'Sign In'}
            aria-label="User Account"
          >
            <User size={26} strokeWidth={1.8} />
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => openCart?.()}
            className="relative p-2 rounded-full hover:bg-[#8B1E1E]/5 text-[#1C1917] hover:text-[#C0262D] transition-colors"
            aria-label="Shopping Cart"
          >
            <ShoppingCart size={26} strokeWidth={1.8} />
            <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E11D2A] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {cartCount}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#1C1917] hover:text-[#8B1E1E]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FDF8EE] border-b border-[#8B1E1E]/10 px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-[#1C1917] hover:text-[#8B1E1E] py-1.5"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/order-online"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 rounded-full bg-[#8B1E1E] text-white text-xs font-bold uppercase tracking-wider"
          >
            <Bike size={16} /> Order Online →
          </Link>
        </div>
      )}
    </header>

    {/* APK-Style Mobile Floating View Cart Bar (Only on <md when cart has items) */}
    {cartCount > 0 && !isCartOpen && !pathname?.startsWith('/checkout') && (
      <div className="md:hidden fixed bottom-[64px] inset-x-3 z-[90] pointer-events-none">
        <button
          type="button"
          onClick={() => openCart?.()}
          className="pointer-events-auto w-full px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#8B1E1E] via-[#A61922] to-[#6E1015] text-white shadow-[0_10px_28px_rgba(40,5,5,0.4)] border border-[#F5B53D]/35 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-extrabold text-xs text-[#F5B53D]">
              {cartCount}
            </span>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-[#F5B53D] font-bold leading-none">
                {cartCount} {cartCount === 1 ? 'Item' : 'Items'} Added
              </p>
              <p className="text-sm font-extrabold text-white leading-tight mt-0.5">
                ${Number(subtotal || 0).toFixed(2)} <span className="text-[10px] font-normal text-white/75">+ taxes</span>
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 bg-[#F5B53D] text-[#3A0609] px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-xs">
            View Cart <ArrowRight size={14} strokeWidth={2.5} />
          </span>
        </button>
      </div>
    )}

    {/* APK-Style Mobile Bottom Navigation Bar (Only on <md) */}
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-[95] bg-[#FCF3E8]/98 backdrop-blur-md border-t border-[#E5D4C0] shadow-[0_-4px_20px_rgba(60,10,10,0.1)] px-2 py-1.5 flex items-center justify-around"
    >
      <Link
        href="/"
        className={`flex flex-col items-center justify-center py-0.5 px-2.5 rounded-xl ${
          pathname === '/' ? 'text-[#C0262D]' : 'text-[#57534E]'
        }`}
      >
        <Home size={19} strokeWidth={pathname === '/' ? 2.4 : 1.8} />
        <span className="text-[10px] font-bold mt-0.5">Home</span>
      </Link>
      <Link
        href="/menu"
        className={`flex flex-col items-center justify-center py-0.5 px-2.5 rounded-xl ${
          pathname?.startsWith('/menu') ? 'text-[#C0262D]' : 'text-[#57534E]'
        }`}
      >
        <UtensilsCrossed size={19} strokeWidth={pathname?.startsWith('/menu') ? 2.4 : 1.8} />
        <span className="text-[10px] font-bold mt-0.5">Menu</span>
      </Link>
      <Link
        href="/book-a-table"
        className={`flex flex-col items-center justify-center py-0.5 px-2.5 rounded-xl ${
          pathname?.startsWith('/book-a-table') ? 'text-[#C0262D]' : 'text-[#57534E]'
        }`}
      >
        <CalendarDays size={19} strokeWidth={pathname?.startsWith('/book-a-table') ? 2.4 : 1.8} />
        <span className="text-[10px] font-bold mt-0.5">Book Table</span>
      </Link>
      <button
        type="button"
        onClick={() => openCart?.()}
        className="relative flex flex-col items-center justify-center py-0.5 px-2.5 rounded-xl text-[#57534E] hover:text-[#C0262D]"
      >
        <div className="relative">
          <ShoppingCart size={19} strokeWidth={1.8} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[#E11D2A] text-white text-[9px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold mt-0.5">Cart</span>
      </button>
      <button
        type="button"
        onClick={() => router.push(isAuthenticated ? '/profile' : '/login')}
        className={`flex flex-col items-center justify-center py-0.5 px-2.5 rounded-xl ${
          pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/profile')
            ? 'text-[#C0262D]'
            : 'text-[#57534E]'
        }`}
      >
        <User size={19} strokeWidth={1.8} />
        <span className="text-[10px] font-bold mt-0.5">{isAuthenticated ? 'Account' : 'Login'}</span>
      </button>
    </nav>
    </>
  );
}
