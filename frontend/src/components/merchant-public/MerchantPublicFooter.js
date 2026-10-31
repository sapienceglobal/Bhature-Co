'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Lock, Clock } from 'lucide-react';

export default function MerchantPublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#3B060A] text-[#F5E6D3] border-t-2 border-[#D4AF37]/40 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block relative w-28 h-28">
              <Image
                src="/assets/images/branded/bhatura-and-co/logo-full.png"
                alt="Bhatura & Co"
                fill
                unoptimized
                className="object-contain object-left"
              />
            </Link>

            <p className="text-sm text-[#E8D5BC]/85 max-w-md leading-relaxed">
              Official merchant portal and mobile operating systems powering live orders, table reservations, dispatch, and kitchen display infrastructure for Bhatura &amp; Co.
            </p>

            <div className="pt-1">
              <Link
                href="/restaurant-panel"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#F2B544] hover:text-white uppercase tracking-wider transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Authorized Staff Portal Sign In &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Legal / Policy Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#F2B544]">
              Partner &amp; Legal Policies
            </h4>
            <ul className="space-y-2.5 text-sm text-[#E8D5BC]/90">
              <li>
                <Link href="/merchant-privacy-policy" className="hover:text-[#F2B544] transition-colors">
                  Merchant Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/merchant-terms" className="hover:text-[#F2B544] transition-colors">
                  Partner Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/merchant-account-deletion" className="hover:text-[#F2B544] transition-colors">
                  Merchant Account Deletion
                </Link>
              </li>
              <li>
                <Link href="/merchant-portal" className="hover:text-[#F2B544] transition-colors">
                  Merchant App Overview
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-[#F2B544] transition-colors">
                  Customer Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#F2B544] transition-colors">
                  Customer Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Support / Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#F2B544]">
              Bhatura &amp; Co Partner Desk
            </h4>
            <ul className="space-y-2.5 text-sm text-[#E8D5BC]/90">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#F2B544] shrink-0 mt-0.5" />
                <span>123 Main Street, New York, NY 10001, USA</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#F2B544] shrink-0" />
                <a href="tel:+12125557890" className="hover:text-[#F2B544] transition-colors">+1 (212) 555-7890</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#F2B544] shrink-0" />
                <a href="mailto:info@bhaturaandco.com" className="hover:text-[#F2B544] transition-colors">info@bhaturaandco.com</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#F2B544] shrink-0" />
                <span>Mon - Sun: 11:00 AM - 11:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom line */}
        <div className="border-t border-[#D4AF37]/20 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#E8D5BC]/70 gap-4">
          <p>© {currentYear} Bhatura &amp; Co. All rights reserved. Partner &amp; Merchant Operations.</p>
          <div className="flex items-center gap-6">
            <Link href="/contact-us" className="hover:text-[#F2B544] transition-colors">
              Contact Support
            </Link>
            <Link href="/" className="hover:text-[#F2B544] transition-colors font-semibold text-[#F2B544]">
              Customer Website &rarr;
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
