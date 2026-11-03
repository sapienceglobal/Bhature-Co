'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BhaturaFooter() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newsletterEmail.trim()) {
      setNewsletterError('Please enter your email address');
      return;
    }
    if (!emailRegex.test(newsletterEmail.trim())) {
      setNewsletterError('Please enter a valid email address');
      return;
    }
    setNewsletterError('');
    setSubscribed(true);
    setNewsletterEmail('');
    toast.success('Thank you for subscribing to Bhatura & Co offers!');
  };

  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'Menu', href: '/menu' },
    { label: 'Book A Table', href: '/book-a-table' },
    { label: 'About Us', href: '/about-us' },
    { label: 'Contact Us', href: '/contact-us' },
  ];

  const customerSupport = [
    { label: 'FAQ', href: '/faq' },
    { label: 'Shipping & Delivery', href: '/shipping-delivery' },
    { label: 'Returns & Refunds', href: '/returns-refunds' },
    { label: 'Terms & Conditions', href: '/terms-conditions' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
  ];

  return (
    <footer className="bg-gradient-to-b from-[#4A0A0E] to-[#3A0609] text-white pt-10 sm:pt-12 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Columns */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-7 sm:gap-10 pb-10 sm:pb-12 border-b border-white/10">
          
          {/* Col 1: Brand Emblem & Tagline (4 cols) */}
          <div className="col-span-2 lg:col-span-4 flex flex-col items-start">
            <Link href="/" className="inline-block mb-4">
              <div className="relative w-36 h-36">
                <Image
                  src="/assets/images/branded/bhatura-and-co/logo-full.png"
                  alt="Bhatura & Co Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </Link>
            <p className="text-xs text-white/70 max-w-sm leading-relaxed">
              Serving authentic Amritsari Chhole Bhature, stuffed bhature, rich Punjabi lassi, and fresh tandoori breads crafted with passion in New Jersey.
            </p>
          </div>

          {/* Col 2: Quick Links (2 cols) */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="font-['Playfair_Display'] font-semibold text-[15px] mb-4 text-white">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-sm text-white/85">
              {quickLinks.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-[#D4AF37] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Customer Support (3 cols) */}
          <div className="col-span-1 lg:col-span-3">
            <h4 className="font-['Playfair_Display'] font-semibold text-[15px] mb-4 text-white">
              Customer Support
            </h4>
            <ul className="space-y-1.5 text-sm text-white/85">
              {customerSupport.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-[#D4AF37] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Follow Us & Subscribe (3 cols) */}
          <div className="col-span-2 lg:col-span-3 flex flex-col">
            <h4 className="font-['Playfair_Display'] font-semibold text-[15px] mb-3 text-white">
              Follow Us
            </h4>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3 mb-6">
              {['facebook', 'instagram', 'youtube', 'pinterest'].map(net => (
                <a
                  key={net}
                  href="#"
                  className="w-8 h-8 rounded-full bg-white text-[#4A0A0E] hover:bg-[#D4AF37] flex items-center justify-center transition-colors text-xs font-black"
                  aria-label={net}
                >
                  {net[0].toUpperCase()}
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <h4 className="font-['Playfair_Display'] font-semibold text-[15px] mb-3 text-white">
              Subscribe for Offers
            </h4>
            <form onSubmit={handleSubscribe} noValidate className="space-y-1.5">
              <div
                className={`flex items-center rounded-lg overflow-hidden bg-white shadow-sm border transition-colors ${
                  newsletterError ? 'border-red-400 ring-2 ring-red-400/30' : 'border-transparent'
                }`}
              >
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterError) setNewsletterError('');
                    if (subscribed) setSubscribed(false);
                  }}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 text-sm bg-white !bg-white text-[#1C1917] placeholder:text-gray-400 focus:outline-none [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_#ffffff_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#1C1917]"
                  style={{ backgroundColor: '#FFFFFF', color: '#1C1917', colorScheme: 'light' }}
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-[#C0262D] text-white hover:bg-[#9E1C22] transition-colors cursor-pointer shrink-0"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
              {newsletterError && (
                <p className="text-red-300 text-xs font-semibold flex items-center gap-1 animate-fadeIn">
                  <AlertCircle size={13} className="shrink-0 text-red-400" />
                  <span>{newsletterError}</span>
                </p>
              )}
              {subscribed && (
                <p className="text-emerald-300 text-xs font-semibold flex items-center gap-1 animate-fadeIn">
                  <Check size={13} className="shrink-0 text-emerald-400" />
                  <span>Thank you for subscribing!</span>
                </p>
              )}
            </form>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Payment Icons */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p className="text-sm text-white/80">© 2026 Bhatura&amp;Co. All rights reserved.</p>

          {/* Payment Badges */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-md bg-white text-[#1A1F71] font-black italic text-xs">VISA</span>
            <span className="px-3 py-1.5 rounded-md bg-white flex items-center"><span className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" /><span className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] -ml-1.5 opacity-90" /></span>
            <span className="px-2.5 py-1.5 rounded-md bg-[#2E77BC] text-white font-black text-[10px]">AMEX</span>
            <span className="px-3 py-1.5 rounded-md bg-white text-[#1C1917] font-bold text-xs">Apple Pay</span>
            <span className="px-3 py-1.5 rounded-md bg-white text-[#5F6368] font-bold text-xs"><span className="text-[#4285F4]">G</span> Pay</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
