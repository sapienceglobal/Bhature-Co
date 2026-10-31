'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Shield, FileText, UserX, Menu, X, Lock, Globe } from 'lucide-react';

export default function MerchantPublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Overview', href: '/merchant-portal', icon: null },
    { label: 'Privacy Policy', href: '/merchant-privacy-policy', icon: Shield },
    { label: 'Partner Terms', href: '/merchant-terms', icon: FileText },
    { label: 'Account Deletion', href: '/merchant-account-deletion', icon: UserX },
  ];

  return (
    <header className="sticky top-0 z-[100] bg-[#FCF3E8] shadow-[0_2px_10px_rgba(92,6,18,0.08)] border-b border-[#E6D3BA] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[70px] flex items-center justify-between gap-4 relative">
        {/* Brand Logo sitting on the signature curved bump */}
        <Link href="/merchant-portal" className="relative z-10 flex items-center group w-40 sm:w-64 h-full shrink-0">
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
              alt="Bhatura & Co - Partner Portal"
              fill
              sizes="256px"
              unoptimized
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 ml-auto text-[14px] font-medium text-[#2B120C]">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 transition-colors py-1 relative ${
                  isActive ? 'text-[#7A0C18] font-semibold' : 'text-[#2B120C] hover:text-[#7A0C18]'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 text-[#C88A2E]" />}
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7A0C18] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3 ml-4">
          <Link
            href="/"
            className="text-xs font-semibold text-[#5C0612] hover:text-[#7A0C18] px-3 py-2 rounded-full border border-[#D4AF37]/50 bg-[#FDF8EE] transition-colors flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-[#C88A2E]" />
            <span>Customer Site</span>
          </Link>
          <Link
            href="/restaurant-panel"
            className="bg-[#7A0C18] hover:bg-[#5C0612] text-white font-semibold py-2.5 px-5 rounded-full text-xs uppercase tracking-wider shadow-[0_3px_10px_rgba(122,12,24,0.28)] transition-all flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5 text-[#F2B544]" />
            <span>Merchant Sign In</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#2B120C] hover:text-[#7A0C18] p-2 rounded-lg"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FCF3E8] border-t border-[#E6D3BA] px-4 pt-6 pb-6 space-y-2 shadow-xl">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                pathname === item.href
                  ? 'bg-[#7A0C18] text-white'
                  : 'text-[#2B120C] hover:bg-[#F3E3CE]'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link
              href="/restaurant-panel"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-[#7A0C18] hover:bg-[#5C0612] text-white font-bold py-3 px-4 rounded-xl text-center block text-sm uppercase tracking-wider"
            >
              Merchant Sign In &rarr;
            </Link>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-[#FDF8EE] border border-[#D4AF37]/50 text-[#5C0612] font-bold py-2.5 px-4 rounded-xl text-center block text-xs uppercase tracking-wider"
            >
              Back to Customer Website
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
