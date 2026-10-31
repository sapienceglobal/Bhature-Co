'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, Bike, CalendarDays, PhoneCall } from 'lucide-react';

function NavContent() {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/',
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: UtensilsCrossed,
      href: '/menu',
    },
    {
      id: 'order',
      label: 'Order Online',
      icon: Bike,
      href: '/order-online',
    },
    {
      id: 'reserve',
      label: 'Book Table',
      icon: CalendarDays,
      href: '/book-a-table',
    },
    {
      id: 'contact',
      label: 'Contact Us',
      icon: PhoneCall,
      href: '/contact-us',
    },
  ];

  return (
    <div className="flex justify-around items-center">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === '/'
            ? pathname === '/'
            : tab.id === 'contact'
            ? pathname?.startsWith('/contact')
            : tab.id === 'reserve'
            ? pathname?.startsWith('/book-a-table') || pathname?.startsWith('/book-table')
            : pathname?.startsWith(tab.href);

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex flex-col items-center justify-center py-0.5 px-2 rounded-xl transition-colors ${
              isActive ? 'text-[#C0262D]' : 'text-[#57534E] hover:text-[#C0262D]'
            }`}
          >
            <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
            <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function MobileBottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-[#FCF3E8]/98 backdrop-blur-md border-t border-[#E5D4C0] z-[90] py-1.5 px-1.5 shadow-[0_-4px_20px_rgba(60,10,10,0.1)]">
      <Suspense fallback={<div className="h-12 w-full" />}>
        <NavContent />
      </Suspense>
    </div>
  );
}
