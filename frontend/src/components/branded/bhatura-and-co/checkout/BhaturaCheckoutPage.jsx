'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart,
  MapPin,
  Check,
  Truck,
  Store,
  Home,
  Briefcase,
  Pencil,
  Plus,
  Clock,
  Calendar,
  CreditCard,
  Lock,
  ArrowRight,
  Tag,
  X,
  Minus,
  ShieldCheck,
  Bike,
  Star,
  Navigation,
  Loader2,
  Info,
  Sparkles,
  ChevronRight,
  Banknote,
  AlertCircle,
} from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import BhaturaHeader from '../BhaturaHeader';
import BhaturaFooter from '../BhaturaFooter';
import AddressModal from '@/components/shared/AddressModal';
import { useCheckoutState } from '@/components/checkout/useCheckoutState';
import ReviewOrderSection from '@/components/checkout/ReviewOrderSection';
import PaymentSimulatorModal from '@/components/checkout/PaymentSimulatorModal';
import { resolveImageUrl } from '@/lib/slugUtils';
import { isRestaurantOpenNow, isWithin15MinsOfClosing } from '@/lib/formatters';

const IMG = '/assets/images/branded/bhatura-and-co';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const TIME_SLOTS = [
  { value: '11:30', label: '11:30 AM - 12:00 PM' },
  { value: '12:30', label: '12:30 PM - 01:00 PM' },
  { value: '13:30', label: '01:30 PM - 02:00 PM' },
  { value: '17:30', label: '05:30 PM - 06:00 PM' },
  { value: '18:30', label: '06:30 PM - 07:00 PM' },
  { value: '19:30', label: '07:30 PM - 08:00 PM' },
  { value: '20:30', label: '08:30 PM - 09:00 PM' },
  { value: '21:30', label: '09:30 PM - 10:00 PM' },
];

const getDishImage = (itemName = '') => {
  const name = itemName.toLowerCase();
  if (name.includes('bhatur') || name.includes('chole') || name.includes('chhole')) {
    return `${IMG}/dish_chole_bhature_exact.png`;
  }
  if (name.includes('paratha') || name.includes('kulcha') || name.includes('naan') || name.includes('roti')) {
    return `${IMG}/dish_aloo_paratha_exact.png`;
  }
  if (name.includes('paneer') || name.includes('curr') || name.includes('masala') || name.includes('dal')) {
    return `${IMG}/dish_paneer_butter_masala_exact.png`;
  }
  if (name.includes('biryani') || name.includes('rice') || name.includes('pulao')) {
    return `${IMG}/dish_veg_biryani_exact.png`;
  }
  if (name.includes('samosa') || name.includes('snack') || name.includes('chaat')) {
    return `${IMG}/dish_samosa_exact.png`;
  }
  if (name.includes('chai') || name.includes('lassi') || name.includes('drink') || name.includes('bever')) {
    return `${IMG}/cat_beverages.png`;
  }
  return `${IMG}/dish_chole_bhature_exact.png`;
};

const formatCardNumber = (val = '') => {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const formatExpiry = (val = '') => {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

export default function BhaturaCheckoutPage() {
  const c = useCheckoutState();

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(0);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');

  // Local saved addresses list (combines user's DB savedAddresses with any addresses added in this session)
  const [sessionAddresses, setSessionAddresses] = useState([
    {
      label: 'Home',
      address: '9408 118th St, Apt 4B, South Richmond Hill, NY 11419',
      displayLine1: '9408 118th St, Apt 4B',
      displayLine2: 'South Richmond Hill, NY 11419, USA',
      lat: null,
      lng: null,
    },
    {
      label: 'Work',
      address: '100 Route 27, Suite 200, Edison, NJ 08820',
      displayLine1: '100 Route 27, Suite 200',
      displayLine2: 'Edison, NJ 08820, USA',
      lat: 40.5401,
      lng: -74.3807,
    },
  ]);

  // Visual card fields matching the UI design
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [saveCardForFuture, setSaveCardForFuture] = useState(true);

  // Field validation errors state
  const [formErrors, setFormErrors] = useState({});
  const [checkoutCouponError, setCheckoutCouponError] = useState('');

  const clearFieldError = (fieldName) => {
    setFormErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleApplyCheckoutCoupon = async () => {
    if (!c.couponCode?.trim()) {
      setCheckoutCouponError('Please enter a coupon code');
      return;
    }
    setCheckoutCouponError('');
    try {
      await c.handleApplyCoupon();
    } catch (err) {
      setCheckoutCouponError(err?.message || 'Invalid coupon code');
    }
  };

  const validateFields = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Contact info
    if (!c.fullName?.trim()) {
      newErrors.fullName = 'Please enter your full name';
    } else if (c.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    const cleanPhone = (c.phone || '').replace(/\D/g, '');
    if (!c.phone?.trim()) {
      newErrors.phone = 'Please enter your mobile number';
    } else if (cleanPhone.length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!c.email?.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!emailRegex.test(c.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Address validation if manual form is active
    if (c.orderType === 'delivery') {
      if (showAddressForm) {
        if (!c.addressLine1?.trim()) {
          newErrors.addressLine1 = 'Please enter street address';
        }
        if (!c.city?.trim()) {
          newErrors.city = 'Please enter city';
        }
        if (!c.state?.trim()) {
          newErrors.state = 'Please select state';
        }
        const cleanZip = (c.zipCode || '').replace(/\D/g, '');
        if (!c.zipCode?.trim()) {
          newErrors.zipCode = 'Please enter zip code';
        } else if (cleanZip.length < 5) {
          newErrors.zipCode = 'Zip code must be 5 digits';
        }
      }
    }

    // Card payment validation
    if (c.paymentMethod === 'stripe_online' || c.paymentMethod === 'credit_card') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (!cardNumber.trim()) {
        newErrors.cardNumber = 'Please enter card number';
      } else if (cleanCard.length < 15) {
        newErrors.cardNumber = 'Card number must be 15 or 16 digits';
      }

      if (!cardExpiry.trim()) {
        newErrors.cardExpiry = 'Please enter expiry date (MM/YY)';
      } else {
        const parts = cardExpiry.split('/');
        const m = parseInt(parts[0], 10);
        if (parts.length !== 2 || isNaN(m) || m < 1 || m > 12) {
          newErrors.cardExpiry = 'Enter a valid MM/YY';
        }
      }

      if (!cardCvv.trim()) {
        newErrors.cardCvv = 'Please enter CVV';
      } else if (cardCvv.length < 3) {
        newErrors.cardCvv = 'CVV must be 3 or 4 digits';
      }

      if (!cardHolderName.trim()) {
        newErrors.cardHolderName = 'Please enter name on card';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      const firstField = Object.keys(newErrors)[0];
      const el = document.querySelector(`[data-field="${firstField}"], [name="${firstField}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    setFormErrors({});
    return true;
  };

  const validateAndPlaceOrder = async () => {
    if (!validateFields()) return;
    await c.handlePlaceOrder();
  };

  const handleStep3Click = async () => {
    if (!validateFields()) return;
    c.handleContinueToReview();
  };

  // Sync user's DB savedAddresses when logged in
  useEffect(() => {
    if (c.user?.savedAddresses?.length > 0) {
      const mapped = c.user.savedAddresses.map((a) => {
        const parts = (a.address || '').split(',').map((p) => p.trim());
        return {
          _id: a._id,
          label: a.label || 'Home',
          address: a.address,
          displayLine1: parts.slice(0, Math.max(1, parts.length - 2)).join(', ') || a.address,
          displayLine2: parts.length > 1 ? `${parts.slice(-2).join(', ')}, USA` : 'USA',
          lat: a.lat ?? null,
          lng: a.lng ?? null,
          isDefault: a.isDefault,
        };
      });
      setSessionAddresses(mapped);
      const defIdx = Math.max(0, mapped.findIndex((a) => a.isDefault));
      setSelectedAddressIdx(defIdx);
      c.handleSelectSavedAddress(mapped[defIdx]);
    } else if (!c.addressLine1 && sessionAddresses.length > 0) {
      // Pre-populate the default address so delivery quote & fields are ready immediately
      c.handleSelectSavedAddress(sessionAddresses[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.user?.savedAddresses]);

  useEffect(() => {
    if (c.fullName && !cardHolderName) {
      setCardHolderName(c.fullName);
    }
  }, [c.fullName, cardHolderName]);

  const handleSelectAddressCard = (addr, idx) => {
    setSelectedAddressIdx(idx);
    c.handleSelectSavedAddress(addr);
  };

  const handleEditAddressCard = (addr, idx, e) => {
    e?.stopPropagation();
    setSelectedAddressIdx(idx);
    setNewAddressLabel(addr.label || 'Home');
    c.handleSelectSavedAddress(addr);
    setShowAddressForm(true);
  };

  const handleApplyAddressForm = async () => {
    const addrErrors = {};
    if (!c.addressLine1?.trim()) {
      addrErrors.addressLine1 = 'Please enter street address';
    }
    if (!c.city?.trim()) {
      addrErrors.city = 'Please enter city';
    }
    if (!c.state?.trim()) {
      addrErrors.state = 'Please select state';
    }
    const cleanZip = (c.zipCode || '').replace(/\D/g, '');
    if (!c.zipCode?.trim()) {
      addrErrors.zipCode = 'Please enter zip code';
    } else if (cleanZip.length < 5) {
      addrErrors.zipCode = 'Zip code must be 5 digits';
    }

    if (Object.keys(addrErrors).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...addrErrors }));
      return;
    }

    const fullAddr = `${c.addressLine1}${c.addressLine2 ? ', ' + c.addressLine2 : ''}, ${c.city}, ${c.state} ${c.zipCode}`;
    const newEntry = {
      label: newAddressLabel || 'Home',
      address: fullAddr,
      displayLine1: `${c.addressLine1}${c.addressLine2 ? ', ' + c.addressLine2 : ''}`,
      displayLine2: `${c.city}, ${c.state} ${c.zipCode}, USA`,
      lat: null,
      lng: null,
    };

    setSessionAddresses((prev) => {
      const updated = [newEntry, ...prev];
      return updated;
    });
    setSelectedAddressIdx(0);
    await c.handleSaveAddressToProfile(newAddressLabel);
    setShowAddressForm(false);
  };

  const isClosed =
    c.restaurant?.operatingHours &&
    !isRestaurantOpenNow(c.restaurant.operatingHours, c.restaurant.timezone);

  return (
    <div className="min-h-screen bg-[#FAF3E8] text-[#1C1917] flex flex-col font-sans">
      <BhaturaHeader onOpenAddressModal={() => setIsAddressModalOpen(true)} />

      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO BANNER (Exact Match to Checkout UI Image)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#1A0D07] min-h-[250px] sm:min-h-[290px] lg:min-h-[320px] flex items-center">
        <Image
          src={`${IMG}/contact_hero_bg.jpg`}
          alt="Bhature & Co Checkout"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A0D07]/95 via-[#1A0D07]/70 via-48% to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1A0D07]/55 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 sm:py-12 pb-14">
          <div className="max-w-xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs sm:text-[13px] text-white/85 font-medium mb-2.5">
              <Link href="/" className="hover:text-[#F5B53D] transition-colors">
                Home
              </Link>
              <ChevronRight size={13} className="text-white/60" />
              <Link href="/menu" className="hover:text-[#F5B53D] transition-colors">
                Order Online
              </Link>
              <ChevronRight size={13} className="text-white/60" />
              <span className="text-[#F5B53D] font-semibold">Checkout</span>
            </nav>

            <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-[56px] font-black text-white leading-[1.08] tracking-tight">
              Checkout
            </h1>

            <p className="text-white/90 text-sm sm:text-[15px] leading-relaxed mt-2.5 max-w-[440px]">
              Almost there! Complete your order and enjoy authentic flavours at your doorstep.
            </p>
          </div>
        </div>

        {/* Smooth Bottom Curve Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-11 pointer-events-none z-20">
          <svg viewBox="0 0 1440 44" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M0,26 C180,0 380,4 680,22 C940,37 1180,38 1440,10 L1440,44 L0,44 Z"
              fill="#FAF3E8"
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. 3-STEP HORIZONTAL PROGRESS STEPPER
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#FAF3E8] pt-3 pb-5 border-b border-[#EFE3D2]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative flex items-start justify-between">
            {/* Background Connecting Track Line */}
            <div className="absolute top-[22px] left-[12%] right-[12%] h-[2px] bg-[#E2D6C5] z-0" />
            {/* Active Red Progress Fill Line */}
            <div
              className="absolute top-[22px] left-[12%] h-[2.5px] bg-[#A61922] z-0 transition-all duration-500"
              style={{
                width: c.step === 1 ? '18%' : c.step === 2 ? '38%' : '76%',
              }}
            />

            {/* Step 1: Cart */}
            <button
              type="button"
              onClick={() => c.openCart?.()}
              className="relative z-10 flex flex-col items-center group focus:outline-none w-1/3"
            >
              <div className="w-11 h-11 rounded-full bg-[#A61922] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(166,25,34,0.35)] border-2 border-white">
                <ShoppingCart size={18} strokeWidth={2.2} />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-4 h-4 rounded-full bg-[#A61922] text-white text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#A61922] transition-colors">
                  Cart
                </span>
              </div>
            </button>

            {/* Step 2: Delivery & Payment */}
            <button
              type="button"
              onClick={() => c.setStep(2)}
              className="relative z-10 flex flex-col items-center group focus:outline-none w-1/3"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm border-2 transition-all ${
                  c.step >= 2
                    ? 'bg-white border-[#D8CBB8] text-[#1C1917]'
                    : 'bg-white border-[#E5D9C8] text-[#78716C]'
                }`}
              >
                <MapPin size={18} strokeWidth={2.2} />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-4 h-4 rounded-full bg-[#EFE6D8] border border-[#D5C7B4] text-[#57534E] text-[10px] font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-[#1C1917]">
                  Delivery &amp; Payment
                </span>
              </div>
            </button>

            {/* Step 3: Review & Place Order */}
            <button
              type="button"
              onClick={handleStep3Click}
              className="relative z-10 flex flex-col items-center group focus:outline-none w-1/3"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm border-2 transition-all ${
                  c.step === 3
                    ? 'bg-[#A61922] border-white text-white shadow-[0_4px_12px_rgba(166,25,34,0.35)]'
                    : 'bg-white border-[#E5D9C8] text-[#1C1917]'
                }`}
              >
                <Check size={18} strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-4 h-4 rounded-full bg-[#EFE6D8] border border-[#D5C7B4] text-[#57534E] text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#A61922] transition-colors">
                  Review &amp; Place Order
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. MAIN CHECKOUT CONTENT
         ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 py-7 sm:py-9">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {c.itemCount === 0 ? (
            <div className="bg-white rounded-3xl border border-[#EADBC8] shadow-[0_8px_30px_rgba(92,6,18,0.06)] p-10 sm:p-16 text-center max-w-xl mx-auto my-8">
              <div className="w-20 h-20 rounded-full bg-[#FDF3E7] border border-[#EAD4B4] text-[#8B1E1E] flex items-center justify-center mx-auto mb-5">
                <ShoppingCart size={34} strokeWidth={1.8} />
              </div>
              <h2 className="font-['Playfair_Display'] text-3xl font-black text-[#1C1917]">
                Your Cart is Empty
              </h2>
              <p className="text-sm text-[#6B5E53] mt-2 max-w-sm mx-auto leading-relaxed">
                Add some delicious Chole Bhature, Parathas, or Curries to your cart before proceeding to checkout.
              </p>
              <Link
                href="/menu"
                className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#8B1E1E] to-[#B0151D] hover:from-[#701515] hover:to-[#8B1E1E] text-white text-sm font-bold shadow-[0_8px_20px_rgba(139,30,30,0.3)] transition-all hover:-translate-y-0.5"
              >
                <span>Browse Our Menu</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
              {/* ─────────────────────────────────────────────────────────────
                  LEFT COLUMN (4 Numbered Sections)
                 ───────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                {/* ═══ CARD 1: DELIVERY OPTION ═══ */}
                <div className="bg-white rounded-2xl border border-[#EFE5D8] shadow-[0_4px_20px_rgba(92,6,18,0.04)] p-5 sm:p-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="w-7 h-7 rounded-full bg-[#A61922] text-white text-xs font-extrabold flex items-center justify-center shadow-xs">
                      1
                    </span>
                    <Truck size={20} className="text-[#A61922]" strokeWidth={2.2} />
                    <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1C1917]">
                      Delivery Option
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Delivery Card */}
                    <button
                      type="button"
                      onClick={() => c.setOrderType('delivery')}
                      className={`relative flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${
                        c.orderType === 'delivery'
                          ? 'bg-[#FDF4EB] border-[#B9382C] shadow-[0_2px_10px_rgba(185,56,44,0.10)]'
                          : 'bg-white border-[#E6DDD0] hover:border-[#D0C2B0]'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#FCEAE6] text-[#A61922] flex items-center justify-center shrink-0">
                        <Truck size={24} strokeWidth={2} />
                      </div>
                      <div className="pr-6">
                        <span className="block font-bold text-[15px] text-[#1C1917]">
                          Delivery
                        </span>
                        <span className="block text-xs text-[#6B5E53] mt-0.5">
                          Get it delivered to your address
                        </span>
                      </div>
                      {c.orderType === 'delivery' ? (
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C0262D] text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="absolute top-3 right-3 w-4 h-4 rounded-full border border-[#D4C7B8]" />
                      )}
                    </button>

                    {/* Pickup Card */}
                    <button
                      type="button"
                      onClick={() => c.setOrderType('pickup')}
                      className={`relative flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${
                        c.orderType === 'pickup'
                          ? 'bg-[#FDF4EB] border-[#B9382C] shadow-[0_2px_10px_rgba(185,56,44,0.10)]'
                          : 'bg-white border-[#E6DDD0] hover:border-[#D0C2B0]'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#FCEAE6] text-[#A61922] flex items-center justify-center shrink-0">
                        <Store size={24} strokeWidth={2} />
                      </div>
                      <div className="pr-6">
                        <span className="block font-bold text-[15px] text-[#1C1917]">
                          Pickup
                        </span>
                        <span className="block text-xs text-[#6B5E53] mt-0.5">
                          Pick up from our restaurant
                        </span>
                      </div>
                      {c.orderType === 'pickup' ? (
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C0262D] text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="absolute top-3 right-3 w-4 h-4 rounded-full border border-[#D4C7B8]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ═══ CARD 2: DELIVERY ADDRESS & CONTACT DETAILS ═══ */}
                <div className="bg-white rounded-2xl border border-[#EFE5D8] shadow-[0_4px_20px_rgba(92,6,18,0.04)] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-[#A61922] text-white text-xs font-extrabold flex items-center justify-center shadow-xs">
                        2
                      </span>
                      <MapPin size={20} className="text-[#A61922]" strokeWidth={2.2} />
                      <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1C1917]">
                        {c.orderType === 'delivery' ? 'Delivery Address' : 'Pickup & Contact Details'}
                      </h2>
                    </div>

                    {c.orderType === 'delivery' && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm((prev) => !prev)}
                        className="text-xs font-semibold text-[#A61922] underline hover:text-[#7A1218] transition-colors"
                      >
                        Saved Addresses
                      </button>
                    )}
                  </div>

                  {/* Guest Checkout Notice if not logged in */}
                  {!c.user && (
                    <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-[#FDF6ED] border border-[#EED9BF] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[#4A3B32] font-medium">
                        <strong className="text-[#8B1E1E]">Fast Checkout:</strong> Enter your contact info below or sign in to use your saved addresses &amp; loyalty points.
                      </span>
                      <Link href="/login" className="font-bold text-[#A61922] underline shrink-0">
                        Sign In →
                      </Link>
                    </div>
                  )}

                  {/* Customer Contact Inputs (Name, Phone, Email) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div data-field="fullName">
                      <label className="block text-xs font-bold text-[#1C1917] mb-1">
                        Full Name <span className="text-[#C0262D]">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={c.fullName}
                        onChange={(e) => {
                          c.setFullName(e.target.value);
                          clearFieldError('fullName');
                        }}
                        placeholder="Enter your full name"
                        className={`w-full h-10 rounded-lg border px-3 text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none transition-colors ${
                          formErrors.fullName
                            ? 'border-red-500 bg-red-50/15 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                            : 'border-[#E4D9C8] bg-[#FDFBF8] focus:border-[#A61922]'
                        }`}
                      />
                      {formErrors.fullName && (
                        <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                          <AlertCircle size={13} className="shrink-0 text-red-500" />
                          <span>{formErrors.fullName}</span>
                        </p>
                      )}
                    </div>

                    <div data-field="phone">
                      <label className="block text-xs font-bold text-[#1C1917] mb-1">
                        Mobile Number <span className="text-[#C0262D]">*</span>
                      </label>
                      <div
                        className={`bhatura-phone-wrap h-10 rounded-lg border px-2.5 flex items-center transition-colors ${
                          formErrors.phone
                            ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
                            : 'border-[#E4D9C8] bg-[#FDFBF8] focus-within:border-[#A61922]'
                        }`}
                      >
                        <PhoneInput
                          international
                          defaultCountry="US"
                          placeholder="Enter mobile number"
                          value={c.phone}
                          onChange={(val) => {
                            c.setPhone(val || '');
                            clearFieldError('phone');
                          }}
                          className="w-full text-xs sm:text-sm"
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                          <AlertCircle size={13} className="shrink-0 text-red-500" />
                          <span>{formErrors.phone}</span>
                        </p>
                      )}
                    </div>

                    <div data-field="email">
                      <label className="block text-xs font-bold text-[#1C1917] mb-1">
                        Email Address <span className="text-[#C0262D]">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={c.email}
                        onChange={(e) => {
                          c.setEmail(e.target.value);
                          clearFieldError('email');
                        }}
                        placeholder="you@example.com"
                        className={`w-full h-10 rounded-lg border px-3 text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none transition-colors ${
                          formErrors.email
                            ? 'border-red-500 bg-red-50/15 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                            : 'border-[#E4D9C8] bg-[#FDFBF8] focus:border-[#A61922]'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                          <AlertCircle size={13} className="shrink-0 text-red-500" />
                          <span>{formErrors.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {c.orderType === 'delivery' ? (
                    <>
                      {/* Saved Address Radio Cards (Exact UI Match) */}
                      <div className="space-y-3">
                        {sessionAddresses.map((addr, idx) => {
                          const isSelected = selectedAddressIdx === idx && !showAddressForm;
                          const isWork = (addr.label || '').toLowerCase().includes('work') || (addr.label || '').toLowerCase().includes('office');
                          return (
                            <div
                              key={addr._id || `${addr.label}-${idx}`}
                              onClick={() => handleSelectAddressCard(addr, idx)}
                              className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-[#F6EDE0] border-[#DFCBB2]'
                                  : 'bg-white border-[#EAE0D3] hover:border-[#D5C4AE]'
                              }`}
                            >
                              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                {/* Radio Dot */}
                                <span
                                  className={`mt-1 sm:mt-0 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'bg-[#B9252E] text-white'
                                      : 'border-2 border-[#D4C7B8] bg-white'
                                  }`}
                                >
                                  {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                                </span>

                                {/* Home / Work Icon */}
                                <div className="w-9 h-9 rounded-lg bg-[#EFE3D3] text-[#4A1215] flex items-center justify-center shrink-0">
                                  {isWork ? <Briefcase size={18} /> : <Home size={18} />}
                                </div>

                                {/* Address Text */}
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-[#1C1917] leading-snug">
                                    {addr.label || 'Home'}
                                  </h4>
                                  <p className="text-xs text-[#57534E] leading-relaxed truncate sm:whitespace-normal">
                                    {addr.displayLine1 || addr.address}
                                  </p>
                                  {addr.displayLine2 && (
                                    <p className="text-xs text-[#57534E] leading-relaxed">
                                      {addr.displayLine2}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Edit Link */}
                              <button
                                type="button"
                                onClick={(e) => handleEditAddressCard(addr, idx, e)}
                                className="flex items-center gap-1 text-xs font-semibold text-[#A61922] hover:text-[#7A1218] shrink-0 px-2 py-1"
                              >
                                <Pencil size={13} />
                                <span className="underline">Edit</span>
                              </button>
                            </div>
                          );
                        })}

                        {/* + Add New Address Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm((prev) => !prev);
                          }}
                          className="w-full py-3 px-4 rounded-xl border border-[#E5D9C8] bg-[#FDFBF8] hover:bg-[#F7EFE2] text-[#A61922] text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                          <span>{showAddressForm ? 'Hide Address Form' : 'Add New Address'}</span>
                        </button>
                      </div>

                      {/* Expandable New / Edit Address Form with Google Autocomplete, Current Location & Map Picker */}
                      {showAddressForm && (
                        <div className="mt-4 p-4 rounded-xl bg-[#FDF9F3] border border-[#E8D8C3] space-y-3.5 animate-in fade-in duration-200">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {['Home', 'Work', 'Other'].map((lbl) => (
                                <button
                                  key={lbl}
                                  type="button"
                                  onClick={() => setNewAddressLabel(lbl)}
                                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                    newAddressLabel === lbl
                                      ? 'bg-[#A61922] text-white'
                                      : 'bg-white border border-[#E4D9C8] text-[#57534E]'
                                  }`}
                                >
                                  {lbl}
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={c.handleUseCurrentLocation}
                                disabled={c.isLocationLoading}
                                className="px-3 py-1.5 rounded-lg bg-white border border-[#E4D9C8] hover:border-[#A61922] text-[#A61922] text-xs font-bold flex items-center gap-1.5 transition-colors"
                              >
                                {c.isLocationLoading ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Navigation size={13} />
                                )}
                                <span>Use Current Location</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsAddressModalOpen(true)}
                                className="px-3 py-1.5 rounded-lg bg-[#FCEAE6] text-[#A61922] hover:bg-[#F8D6CF] text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <MapPin size={13} />
                                <span>Pick on Map</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 relative" data-field="addressLine1">
                              <label className="block text-xs font-bold text-[#1C1917] mb-1">
                                Street Address <span className="text-[#C0262D]">*</span>
                              </label>
                              <input
                                type="text"
                                name="addressLine1"
                                value={c.addressLine1}
                                onChange={(e) => {
                                  c.handleAddressLine1Change(e.target.value);
                                  clearFieldError('addressLine1');
                                }}
                                placeholder="House No., Building, Street Name"
                                className={`w-full h-10 rounded-lg border px-3 text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none transition-colors ${
                                  formErrors.addressLine1
                                    ? 'border-red-500 bg-red-50/15 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                                    : 'border-[#E4D9C8] bg-white focus:border-[#A61922]'
                                }`}
                              />
                              {formErrors.addressLine1 && (
                                <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                                  <span>{formErrors.addressLine1}</span>
                                </p>
                              )}

                              {/* Autocomplete Suggestions Dropdown */}
                              {(c.suggestionsLoading || (c.suggestions && c.suggestions.length > 0)) && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl border border-[#E4D9C8] shadow-xl max-h-52 overflow-y-auto">
                                  {c.suggestionsLoading ? (
                                    <div className="flex items-center gap-2 px-3.5 py-2.5 text-xs text-[#6B5E53]">
                                      <Loader2 size={14} className="animate-spin" />
                                      <span>Searching addresses...</span>
                                    </div>
                                  ) : (
                                    c.suggestions.map((s, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                          c.handleSelectSuggestion(s);
                                          clearFieldError('addressLine1');
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#FDF4EB] border-b border-[#F3ECE2] last:border-0"
                                      >
                                        <div className="font-bold text-[#1C1917] truncate">
                                          {s.main_text || s.display_name}
                                        </div>
                                        {s.secondary_text && (
                                          <div className="text-[11px] text-[#6B5E53] truncate">
                                            {s.secondary_text}
                                          </div>
                                        )}
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[#1C1917] mb-1">
                                Apt / Suite (Optional)
                              </label>
                              <input
                                type="text"
                                value={c.addressLine2}
                                onChange={(e) => c.setAddressLine2(e.target.value)}
                                placeholder="Apt 4B, Floor 2"
                                className="w-full h-10 rounded-lg border border-[#E4D9C8] bg-white px-3 text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#A61922]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div data-field="city">
                              <label className="block text-xs font-bold text-[#1C1917] mb-1">
                                City <span className="text-[#C0262D]">*</span>
                              </label>
                              <input
                                type="text"
                                name="city"
                                value={c.city}
                                onChange={(e) => {
                                  c.setCity(e.target.value);
                                  clearFieldError('city');
                                }}
                                placeholder="City"
                                className={`w-full h-10 rounded-lg border px-3 text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none transition-colors ${
                                  formErrors.city
                                    ? 'border-red-500 bg-red-50/15 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                                    : 'border-[#E4D9C8] bg-white focus:border-[#A61922]'
                                }`}
                              />
                              {formErrors.city && (
                                <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                                  <span>{formErrors.city}</span>
                                </p>
                              )}
                            </div>

                            <div data-field="state">
                              <label className="block text-xs font-bold text-[#1C1917] mb-1">
                                State <span className="text-[#C0262D]">*</span>
                              </label>
                              <select
                                name="state"
                                value={c.state}
                                onChange={(e) => {
                                  c.setState(e.target.value);
                                  clearFieldError('state');
                                }}
                                className={`w-full h-10 rounded-lg border px-3 text-xs sm:text-sm text-[#1C1917] focus:outline-none transition-colors ${
                                  formErrors.state
                                    ? 'border-red-500 bg-red-50/15 focus:border-red-500'
                                    : 'border-[#E4D9C8] bg-white focus:border-[#A61922]'
                                }`}
                              >
                                {US_STATES.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div data-field="zipCode">
                              <label className="block text-xs font-bold text-[#1C1917] mb-1">
                                Zip Code <span className="text-[#C0262D]">*</span>
                              </label>
                              <input
                                type="text"
                                name="zipCode"
                                value={c.zipCode}
                                onChange={(e) => {
                                  c.setZipCode(e.target.value.replace(/\D/g, '').substring(0, 5));
                                  clearFieldError('zipCode');
                                }}
                                placeholder="08820"
                                className={`w-full h-10 rounded-lg border px-3 text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none transition-colors ${
                                  formErrors.zipCode
                                    ? 'border-red-500 bg-red-50/15 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                                    : 'border-[#E4D9C8] bg-white focus:border-[#A61922]'
                                }`}
                              />
                              {formErrors.zipCode && (
                                <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                                  <span>{formErrors.zipCode}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowAddressForm(false)}
                              className="px-4 py-2 rounded-lg border border-[#E4D9C8] bg-white text-xs font-bold text-[#57534E]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyAddressForm}
                              className="px-5 py-2 rounded-lg bg-[#A61922] hover:bg-[#7A1218] text-white text-xs font-bold shadow-xs transition-colors"
                            >
                              Use This Address
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Live Quote Error Alert if out of range */}
                      {c.quoteError && (
                        <div className="mt-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs font-semibold flex items-center justify-between gap-2">
                          <span>• {c.quoteError}</span>
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(true)}
                            className="underline font-bold shrink-0"
                          >
                            Change Address
                          </button>
                        </div>
                      )}

                      {/* Delivery Instructions (Optional) with 0/200 counter */}
                      <div className="mt-4">
                        <label className="block text-xs sm:text-[13px] font-bold text-[#1C1917] mb-1.5">
                          Delivery Instructions (Optional)
                        </label>
                        <textarea
                          rows={2}
                          maxLength={200}
                          value={c.deliveryInstructions}
                          onChange={(e) => c.setDeliveryInstructions(e.target.value.slice(0, 200))}
                          placeholder="e.g. Ring the bell, leave at door, etc."
                          className="w-full rounded-xl border border-[#E4D9C8] bg-[#FDFBF8] px-3.5 py-2.5 text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#A61922] resize-none"
                        />
                        <div className="text-right text-[11px] text-[#8C827A] mt-0.5">
                          {c.deliveryInstructions.length}/200
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Pickup Location Card */
                    <div className="p-4 rounded-xl bg-[#FDF6ED] border border-[#E8D8C3] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-[#FCEAE6] text-[#A61922] flex items-center justify-center shrink-0">
                          <Store size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#1C1917]">
                            {c.restaurant?.name || 'Bhature & Co'}
                          </h4>
                          <p className="text-xs text-[#57534E] mt-0.5">
                            {c.restaurant?.address || '9408 118th St, South Richmond Hill, NY 11419'}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shrink-0">
                        Ready in 20-30 mins
                      </span>
                    </div>
                  )}
                </div>

                {/* ═══ CARD 3: DELIVERY TIME ═══ */}
                <div className="bg-white rounded-2xl border border-[#EFE5D8] shadow-[0_4px_20px_rgba(92,6,18,0.04)] p-5 sm:p-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="w-7 h-7 rounded-full bg-[#A61922] text-white text-xs font-extrabold flex items-center justify-center shadow-xs">
                      3
                    </span>
                    <Clock size={20} className="text-[#A61922]" strokeWidth={2.2} />
                    <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1C1917]">
                      {c.orderType === 'delivery' ? 'Delivery Time' : 'Pickup Time'}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* ASAP Option */}
                    <button
                      type="button"
                      onClick={() => c.setDeliveryTimeOption('asap')}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        c.deliveryTimeOption === 'asap'
                          ? 'bg-[#FDF4EB] border-[#B9382C] shadow-[0_2px_10px_rgba(185,56,44,0.10)]'
                          : 'bg-white border-[#E6DDD0] hover:border-[#D0C2B0]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          c.deliveryTimeOption === 'asap'
                            ? 'bg-[#B9252E] text-white'
                            : 'border-2 border-[#D4C7B8]'
                        }`}
                      >
                        {c.deliveryTimeOption === 'asap' && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#A61922] text-white flex items-center justify-center shrink-0">
                        <Clock size={16} />
                      </div>
                      <div>
                        <span className="block font-bold text-sm text-[#1C1917]">ASAP</span>
                        <span className="block text-xs text-[#6B5E53]">30 - 45 mins</span>
                      </div>
                    </button>

                    {/* Schedule for Later Option */}
                    <button
                      type="button"
                      onClick={() => c.setDeliveryTimeOption('scheduled')}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        c.deliveryTimeOption === 'scheduled'
                          ? 'bg-[#FDF4EB] border-[#B9382C] shadow-[0_2px_10px_rgba(185,56,44,0.10)]'
                          : 'bg-white border-[#E6DDD0] hover:border-[#D0C2B0]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          c.deliveryTimeOption === 'scheduled'
                            ? 'bg-[#B9252E] text-white'
                            : 'border-2 border-[#D4C7B8]'
                        }`}
                      >
                        {c.deliveryTimeOption === 'scheduled' && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#F1ECE4] text-[#1C1917] flex items-center justify-center shrink-0">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <span className="block font-bold text-sm text-[#1C1917]">
                          Schedule for Later
                        </span>
                        <span className="block text-xs text-[#6B5E53]">
                          Choose date &amp; time
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Date & Time Picker when Scheduled is active */}
                  {c.deliveryTimeOption === 'scheduled' && (
                    <div className="mt-4 pt-3.5 border-t border-[#F2EAE0] grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold text-[#1C1917] mb-1">
                          Select Date
                        </label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={c.scheduledDate}
                          onChange={(e) => c.setScheduledDate(e.target.value)}
                          className="w-full h-10 rounded-lg border border-[#E4D9C8] bg-[#FDFBF8] px-3 text-xs sm:text-sm text-[#1C1917] focus:outline-none focus:border-[#A61922]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#1C1917] mb-1">
                          Select Time Window
                        </label>
                        <select
                          value={c.scheduledSlot}
                          onChange={(e) => c.setScheduledSlot(e.target.value)}
                          className="w-full h-10 rounded-lg border border-[#E4D9C8] bg-[#FDFBF8] px-3 text-xs sm:text-sm text-[#1C1917] focus:outline-none focus:border-[#A61922]"
                        >
                          {TIME_SLOTS.map((slot) => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══ CARD 4: PAYMENT METHOD ═══ */}
                <div className="bg-white rounded-2xl border border-[#EFE5D8] shadow-[0_4px_20px_rgba(92,6,18,0.04)] p-5 sm:p-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="w-7 h-7 rounded-full bg-[#A61922] text-white text-xs font-extrabold flex items-center justify-center shadow-xs">
                      4
                    </span>
                    <CreditCard size={20} className="text-[#A61922]" strokeWidth={2.2} />
                    <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1C1917]">
                      Payment Method
                    </h2>
                  </div>

                  {/* 4 Payment Method Tabs (Exact Match to UI Image) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                    {/* 1. Credit / Debit Card */}
                    <button
                      type="button"
                      onClick={() => c.setPaymentMethod('stripe_online')}
                      className={`h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-[13px] font-bold transition-all ${
                        c.paymentMethod === 'stripe_online' ||
                        c.paymentMethod === 'credit_card' ||
                        c.paymentMethod.startsWith('saved_card_')
                          ? 'bg-[#FDF4EB] border-[#B9382C] text-[#1C1917] shadow-xs'
                          : 'bg-white border-[#E6DDD0] text-[#44403C] hover:border-[#D0C2B0]'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          c.paymentMethod === 'stripe_online' ||
                          c.paymentMethod === 'credit_card' ||
                          c.paymentMethod.startsWith('saved_card_')
                            ? 'bg-[#B9252E] text-white'
                            : 'border border-[#D4C7B8]'
                        }`}
                      >
                        {(c.paymentMethod === 'stripe_online' ||
                          c.paymentMethod === 'credit_card' ||
                          c.paymentMethod.startsWith('saved_card_')) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <span className="truncate">Credit / Debit Card</span>
                    </button>

                    {/* 2. UPI */}
                    <button
                      type="button"
                      onClick={() => c.setPaymentMethod('upi')}
                      className={`h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-[13px] font-bold transition-all ${
                        c.paymentMethod === 'upi'
                          ? 'bg-[#FDF4EB] border-[#B9382C] text-[#1C1917] shadow-xs'
                          : 'bg-white border-[#E6DDD0] text-[#44403C] hover:border-[#D0C2B0]'
                      }`}
                    >
                      <span className="px-1.5 py-0.5 rounded bg-[#F3EFEA] text-[10px] font-black tracking-tighter italic text-[#374151] border border-[#E5DEC9]">
                        UPI▸
                      </span>
                      <span>UPI</span>
                    </button>

                    {/* 3. PayPal */}
                    <button
                      type="button"
                      onClick={() => c.setPaymentMethod('paypal')}
                      className={`h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-[13px] font-bold transition-all ${
                        c.paymentMethod === 'paypal'
                          ? 'bg-[#FDF4EB] border-[#B9382C] text-[#1C1917] shadow-xs'
                          : 'bg-white border-[#E6DDD0] text-[#44403C] hover:border-[#D0C2B0]'
                      }`}
                    >
                      <span className="w-5 h-5 rounded bg-[#003087] text-white font-serif italic font-black text-xs flex items-center justify-center">
                        P
                      </span>
                      <span>PayPal</span>
                    </button>

                    {/* 4. Cash on Delivery */}
                    <button
                      type="button"
                      onClick={() => c.setPaymentMethod('cash_on_delivery')}
                      className={`h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-[13px] font-bold transition-all ${
                        c.paymentMethod === 'cash_on_delivery'
                          ? 'bg-[#FDF4EB] border-[#B9382C] text-[#1C1917] shadow-xs'
                          : 'bg-white border-[#E6DDD0] text-[#44403C] hover:border-[#D0C2B0]'
                      }`}
                    >
                      <Banknote size={17} className="text-[#16A34A] shrink-0" />
                      <span className="truncate">Cash on Delivery</span>
                    </button>
                  </div>

                  {/* Saved Cards Row (if logged-in user has saved cards) */}
                  {c.user?.savedCards?.length > 0 &&
                    (c.paymentMethod === 'stripe_online' ||
                      c.paymentMethod.startsWith('saved_card_')) && (
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#6B5E53]">Saved Cards:</span>
                        {c.user.savedCards.map((card) => {
                          const active = c.paymentMethod === `saved_card_${card._id}`;
                          return (
                            <button
                              key={card._id}
                              type="button"
                              onClick={() => c.setPaymentMethod(`saved_card_${card._id}`)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                                active
                                  ? 'bg-[#A61922] text-white border-[#A61922]'
                                  : 'bg-[#FDFBF8] text-[#1C1917] border-[#E4D9C8]'
                              }`}
                            >
                              <CreditCard size={13} />
                              <span>
                                {card.brand} •••• {card.last4}
                              </span>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => c.setPaymentMethod('stripe_online')}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            c.paymentMethod === 'stripe_online'
                              ? 'bg-[#FDF4EB] text-[#A61922] border-[#B9382C]'
                              : 'bg-white text-[#57534E] border-[#E4D9C8]'
                          }`}
                        >
                          + New Card
                        </button>
                      </div>
                    )}

                  {/* Card Details Form (Exact Match to UI Image) */}
                  {(c.paymentMethod === 'stripe_online' || c.paymentMethod === 'credit_card') && (
                    <div className="space-y-4">
                      <div data-field="cardNumber">
                        <label className="block text-xs sm:text-[13px] font-bold text-[#1C1917] mb-1.5">
                          Card Number
                        </label>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            name="cardNumber"
                            value={cardNumber}
                            onChange={(e) => {
                              setCardNumber(formatCardNumber(e.target.value));
                              clearFieldError('cardNumber');
                            }}
                            placeholder="1234 5678 9012 3456"
                            className={`flex-1 h-11 rounded-lg border px-3.5 text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none tracking-wider transition-colors ${
                              formErrors.cardNumber
                                ? 'border-red-500 bg-red-50/15 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                                : 'border-[#E4D9C8] bg-[#FDFBF8] focus:border-[#A61922]'
                            }`}
                          />
                          {/* Card Network Badges */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="h-8 px-2.5 rounded border border-[#E5DEC9] bg-white flex items-center justify-center text-[11px] font-black italic text-[#1A1F71]">
                              VISA
                            </span>
                            <span className="h-8 px-2 rounded border border-[#E5DEC9] bg-white flex items-center justify-center">
                              <span className="w-3.5 h-3.5 rounded-full bg-[#EB001B] inline-block -mr-1.5" />
                              <span className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]/90 inline-block" />
                            </span>
                            <span className="h-8 px-2 rounded border border-[#E5DEC9] bg-[#016FD0] text-white flex items-center justify-center text-[9px] font-black tracking-tighter">
                              AMEX
                            </span>
                            <span className="h-8 px-2 rounded border border-[#E5DEC9] bg-white flex items-center justify-center">
                              <span className="w-4 h-4 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] inline-block" />
                            </span>
                          </div>
                        </div>
                        {formErrors.cardNumber && (
                          <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                            <AlertCircle size={13} className="shrink-0 text-red-500" />
                            <span>{formErrors.cardNumber}</span>
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div data-field="cardExpiry">
                          <label className="block text-xs sm:text-[13px] font-bold text-[#1C1917] mb-1.5">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            name="cardExpiry"
                            value={cardExpiry}
                            onChange={(e) => {
                              setCardExpiry(formatExpiry(e.target.value));
                              clearFieldError('cardExpiry');
                            }}
                            placeholder="MM/YY"
                            className={`w-full h-11 rounded-lg border px-3.5 text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none transition-colors ${
                              formErrors.cardExpiry
                                ? 'border-red-500 bg-red-50/15 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                                : 'border-[#E4D9C8] bg-[#FDFBF8] focus:border-[#A61922]'
                            }`}
                          />
                          {formErrors.cardExpiry && (
                            <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                              <AlertCircle size={13} className="shrink-0 text-red-500" />
                              <span>{formErrors.cardExpiry}</span>
                            </p>
                          )}
                        </div>

                        <div data-field="cardCvv">
                          <label className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#1C1917] mb-1.5">
                            <span>CVV</span>
                            <Info size={13} className="text-[#9CA3AF]" />
                          </label>
                          <input
                            type="password"
                            inputMode="numeric"
                            name="cardCvv"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => {
                              setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                              clearFieldError('cardCvv');
                            }}
                            placeholder="123"
                            className={`w-full h-11 rounded-lg border px-3.5 text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none transition-colors ${
                              formErrors.cardCvv
                                ? 'border-red-500 bg-red-50/15 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                                : 'border-[#E4D9C8] bg-[#FDFBF8] focus:border-[#A61922]'
                            }`}
                          />
                          {formErrors.cardCvv && (
                            <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                              <AlertCircle size={13} className="shrink-0 text-red-500" />
                              <span>{formErrors.cardCvv}</span>
                            </p>
                          )}
                        </div>

                        <div data-field="cardHolderName">
                          <label className="block text-xs sm:text-[13px] font-bold text-[#1C1917] mb-1.5">
                            Name on Card
                          </label>
                          <input
                            type="text"
                            name="cardHolderName"
                            value={cardHolderName}
                            onChange={(e) => {
                              setCardHolderName(e.target.value);
                              clearFieldError('cardHolderName');
                            }}
                            placeholder="John Doe"
                            className={`w-full h-11 rounded-lg border px-3.5 text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none transition-colors ${
                              formErrors.cardHolderName
                                ? 'border-red-500 bg-red-50/15 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                                : 'border-[#E4D9C8] bg-[#FDFBF8] focus:border-[#A61922]'
                            }`}
                          />
                          {formErrors.cardHolderName && (
                            <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                              <AlertCircle size={13} className="shrink-0 text-red-500" />
                              <span>{formErrors.cardHolderName}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none pt-1">
                        <input
                          type="checkbox"
                          checked={saveCardForFuture}
                          onChange={(e) => setSaveCardForFuture(e.target.checked)}
                          className="sr-only"
                        />
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            saveCardForFuture
                              ? 'bg-[#A61922] text-white'
                              : 'border border-[#D4C7B8] bg-white'
                          }`}
                        >
                          {saveCardForFuture && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span className="text-xs sm:text-[13px] font-medium text-[#1C1917]">
                          Save this card for future orders
                        </span>
                      </label>
                    </div>
                  )}

                  {c.paymentMethod === 'upi' && (
                    <div className="p-4 rounded-xl bg-[#FDF8F0] border border-[#E8D8C3] text-xs sm:text-sm text-[#44403C]">
                      Pay seamlessly using Digital Wallet / UPI via our encrypted payment gateway when you click <strong>Place Order</strong>.
                    </div>
                  )}

                  {c.paymentMethod === 'paypal' && (
                    <div className="p-4 rounded-xl bg-[#FDF8F0] border border-[#E8D8C3] text-xs sm:text-sm text-[#44403C]">
                      You will complete your secure payment via PayPal / Stripe checkout window when you click <strong>Place Order</strong>.
                    </div>
                  )}

                  {c.paymentMethod === 'cash_on_delivery' && (
                    <div className="p-4 rounded-xl bg-[#FDF8F0] border border-[#E8D8C3] text-xs sm:text-sm text-[#44403C]">
                      Pay with cash directly when your order is {c.orderType === 'delivery' ? 'delivered to your doorstep' : 'picked up at our counter'}.
                    </div>
                  )}
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  RIGHT COLUMN (Sticky Your Order + Order Summary + Trust Card)
                 ───────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-24">
                {/* ═══ YOUR ORDER & ORDER SUMMARY CARD ═══ */}
                <div className="bg-[#F6EDE0] rounded-2xl border border-[#E8D8C3] shadow-[0_8px_28px_rgba(92,6,18,0.07)] p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#E5D5C0]">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={20} className="text-[#A61922]" strokeWidth={2.3} />
                      <h2 className="font-['Playfair_Display'] text-xl font-black text-[#8B1E1E]">
                        Your Order
                      </h2>
                      <span className="text-xs sm:text-sm font-semibold text-[#44403C]">
                        ({c.itemCount} {c.itemCount === 1 ? 'item' : 'items'})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => c.openCart?.()}
                      className="text-xs font-bold text-[#A61922] underline hover:text-[#7A1218] transition-colors"
                    >
                      Edit Cart
                    </button>
                  </div>

                  {/* Order Items List */}
                  <div className="py-4 space-y-3 max-h-[340px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                    {c.items.map((item, idx) => {
                      const qty = item.quantity || item.qty || 1;
                      const basePrice = Number(item.selectedSize?.price ?? item.price ?? 0);
                      const addOnTotal = (item.addOns || []).reduce(
                        (s, a) => s + (Number(a.price) || 0),
                        0
                      );
                      const unitPrice = basePrice + addOnTotal;
                      const lineTotal = item.lineTotal || unitPrice * qty;
                      const imgSrc = resolveImageUrl(item.image) || getDishImage(item.name);

                      return (
                        <div
                          key={`${item.menuItemId || item._id || item.name}-${idx}`}
                          className="bg-white rounded-xl p-3 border border-[#EDE0CE] shadow-xs flex gap-3 items-center"
                        >
                          {/* Dish Image with Veg Indicator */}
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#2A1810] shrink-0">
                            <img
                              src={imgSrc}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const fallback = getDishImage(item.name);
                                if (!e.currentTarget.src.endsWith(fallback)) {
                                  e.currentTarget.src = fallback;
                                }
                              }}
                            />
                            <span
                              className={`absolute top-1 left-1 w-3.5 h-3.5 bg-white/95 rounded-[2px] border flex items-center justify-center ${
                                item.isVeg === false ? 'border-[#C0262D]' : 'border-[#16A34A]'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.isVeg === false ? 'bg-[#C0262D]' : 'bg-[#16A34A]'
                                }`}
                              />
                            </span>
                          </div>

                          {/* Item Info & Stepper */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-sm text-[#1C1917] leading-tight truncate">
                                {item.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => c.removeItem(idx)}
                                className="text-[#9CA3AF] hover:text-[#C0262D] transition-colors shrink-0"
                                aria-label={`Remove ${item.name}`}
                              >
                                <X size={15} />
                              </button>
                            </div>

                            <span className="block text-xs font-extrabold text-[#B0151D] mt-0.5">
                              ${unitPrice.toFixed(2)}
                            </span>

                            <div className="flex items-center justify-between mt-2">
                              {/* Compact Stepper */}
                              <div className="inline-flex items-center h-7 rounded-md border border-[#E4D7C5] bg-[#FAF5EE] overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => c.updateQuantity(idx, qty - 1)}
                                  className="w-7 h-full flex items-center justify-center text-[#57534E] hover:bg-[#EFE5D8] transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={11} strokeWidth={2.5} />
                                </button>
                                <span className="w-7 text-center text-xs font-bold text-[#1C1917] border-x border-[#E4D7C5]">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => c.updateQuantity(idx, qty + 1)}
                                  className="w-7 h-full flex items-center justify-center text-[#57534E] hover:bg-[#EFE5D8] transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={11} strokeWidth={2.5} />
                                </button>
                              </div>

                              <span className="font-extrabold text-sm text-[#B0151D]">
                                ${lineTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon Code Box */}
                  <div className="pt-3 pb-4 border-t border-[#E5D5C0]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                        <Tag size={14} className="text-[#A61922]" />
                        <span>Have a Coupon Code?</span>
                      </span>
                      {!c.couponApplied && (
                        <button
                          type="button"
                          onClick={() => c.setCouponCode('BHATURA20')}
                          className="text-[11px] font-bold text-[#A61922] hover:underline"
                        >
                          Use BHATURA20
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={c.couponCode}
                        onChange={(e) => {
                          c.setCouponCode(e.target.value.toUpperCase());
                          if (checkoutCouponError) setCheckoutCouponError('');
                        }}
                        placeholder="Enter coupon code"
                        className={`flex-1 h-10 rounded-lg border px-3 text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] uppercase tracking-wider focus:outline-none transition-colors ${
                          checkoutCouponError
                            ? 'border-red-500 bg-red-50/15 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                            : 'border-[#E4D9C8] bg-white focus:border-[#A61922]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCheckoutCoupon}
                        disabled={c.couponLoading || c.couponApplied}
                        className="px-5 h-10 rounded-lg bg-[#8B1E1E] hover:bg-[#6E1216] disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer"
                      >
                        {c.couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {checkoutCouponError && (
                      <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                        <AlertCircle size={13} className="shrink-0 text-red-500" />
                        <span>{checkoutCouponError}</span>
                      </p>
                    )}

                    {c.couponApplied && (
                      <div className="mt-2.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-700">
                        <span>
                          🎉 {c.couponCode} applied (-${c.couponDiscount.toFixed(2)})
                        </span>
                        <button
                          type="button"
                          onClick={c.handleRemoveCoupon}
                          aria-label="Remove coupon"
                          className="text-emerald-700 hover:text-emerald-900"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {/* Loyalty Points Toggle (Lassi Lounge Parity) */}
                    {c.user?.loyaltyPoints > 0 && (
                      <label className="mt-3 p-2.5 rounded-lg bg-[#FFFDF9] border border-[#E8D8C3] flex items-center justify-between cursor-pointer text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-[#8B1E1E]">
                          <Sparkles size={14} className="text-[#D48228]" />
                          <span>Redeem {c.user.loyaltyPoints} Loyalty Points</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={c.useLoyaltyPoints}
                          onChange={(e) => c.setUseLoyaltyPoints(e.target.checked)}
                          className="accent-[#A61922] w-4 h-4"
                        />
                      </label>
                    )}
                  </div>

                  {/* Order Summary Breakdown */}
                  <div className="pt-4 border-t border-[#E5D5C0] space-y-2.5">
                    <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1C1917] mb-2">
                      Order Summary
                    </h3>

                    <div className="flex items-center justify-between text-xs sm:text-sm text-[#44403C]">
                      <span>
                        Subtotal ({c.itemCount} {c.itemCount === 1 ? 'item' : 'items'})
                      </span>
                      <span className="font-bold text-[#1C1917]">${c.subtotal.toFixed(2)}</span>
                    </div>

                    {c.orderType === 'delivery' && (
                      <div className="flex items-center justify-between text-xs sm:text-sm text-[#44403C]">
                        <span>Delivery Fee</span>
                        <span className="font-bold text-[#1C1917]">
                          {c.quoteLoading
                            ? '...'
                            : c.deliveryFee === null
                              ? 'Unavailable'
                              : c.deliveryFee === 0
                                ? 'FREE'
                                : `$${Number(c.deliveryFee).toFixed(2)}`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs sm:text-sm text-[#44403C]">
                      <span>Taxes</span>
                      <span className="font-bold text-[#1C1917]">${c.tax.toFixed(2)}</span>
                    </div>

                    {c.serviceFee > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm text-[#44403C]">
                        <span>Service Fee</span>
                        <span className="font-bold text-[#1C1917]">
                          ${c.serviceFee.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {c.packagingFee > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm text-[#44403C]">
                        <span>Packaging Fee</span>
                        <span className="font-bold text-[#1C1917]">
                          ${c.packagingFee.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {c.tip > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm text-[#44403C]">
                        <span>Driver / Kitchen Tip</span>
                        <span className="font-bold text-[#1C1917]">${c.tip.toFixed(2)}</span>
                      </div>
                    )}

                    {c.couponApplied && c.couponDiscount > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-700 font-bold">
                        <span>Coupon Discount ({c.couponCode})</span>
                        <span>-${c.couponDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {c.loyaltyDiscount > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-700 font-bold">
                        <span>Loyalty Points Discount</span>
                        <span>-${c.loyaltyDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Highlighted Total Amount Bar */}
                    <div className="mt-3 bg-[#EFE0CC] rounded-xl px-4 py-3.5 flex items-center justify-between">
                      <span className="font-['Playfair_Display'] text-base sm:text-lg font-extrabold text-[#1C1917]">
                        Total Amount
                      </span>
                      <span className="text-2xl sm:text-[26px] font-black text-[#B0151D]">
                        ${c.total.toFixed(2)}
                      </span>
                    </div>

                    {/* Place Order CTA */}
                    {isClosed && c.deliveryTimeOption !== 'scheduled' ? (
                      <div className="mt-3 p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B] font-semibold">
                        <strong>
                          {isWithin15MinsOfClosing(
                            c.restaurant.operatingHours,
                            c.restaurant.timezone
                          )
                            ? 'Closing Soon: '
                            : 'Restaurant Closed: '}
                        </strong>
                        We are currently not accepting immediate online orders. Select <strong>Schedule for Later</strong> above to place an advance order.
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={validateAndPlaceOrder}
                        disabled={c.isPlacingOrder}
                        className="mt-3 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#8B1E1E] via-[#A61922] to-[#7A1218] hover:from-[#701515] hover:to-[#5C0612] disabled:opacity-60 text-white font-bold text-base shadow-[0_8px_22px_rgba(139,30,30,0.35)] flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 cursor-pointer"
                      >
                        <Lock size={17} strokeWidth={2.4} />
                        <span>{c.isPlacingOrder ? 'Processing Order...' : 'Place Order'}</span>
                        <ArrowRight size={18} strokeWidth={2.4} />
                      </button>
                    )}

                    <p className="text-[11px] text-[#6B5E53] text-center leading-relaxed pt-1">
                      By placing this order, you agree to our{' '}
                      <Link href="/terms-conditions" className="underline font-semibold text-[#44403C]">
                        Terms &amp; Conditions
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy-policy" className="underline font-semibold text-[#44403C]">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                {/* ═══ TRUST BADGES CARD (Exact Match to UI Image) ═══ */}
                <div className="bg-[#F6EDE0] rounded-2xl border border-[#E8D8C3] p-5 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FCEAE6] text-[#A61922] flex items-center justify-center shrink-0">
                      <ShieldCheck size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#1C1917]">
                        Safe &amp; Secure Payment
                      </h4>
                      <p className="text-xs text-[#6B5E53]">100% Secure Checkout</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FCEAE6] text-[#A61922] flex items-center justify-center shrink-0">
                      <Bike size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#1C1917]">
                        Fast &amp; Reliable Delivery
                      </h4>
                      <p className="text-xs text-[#6B5E53]">Hot and fresh at your doorstep</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FCEAE6] text-[#A61922] flex items-center justify-center shrink-0">
                      <Star size={20} strokeWidth={2.2} fill="currentColor" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#1C1917]">
                        Authentic Taste
                      </h4>
                      <p className="text-xs text-[#6B5E53]">
                        North Indian flavours, made with love
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* APK-Style Sticky Mobile Place Order Bar (Only on <md) */}
      {c.itemCount > 0 && (!isClosed || c.deliveryTimeOption === 'scheduled') && (
        <div className="md:hidden fixed bottom-[54px] inset-x-0 z-[90] bg-[#FFFDF9]/98 backdrop-blur-md border-t border-[#E5D4C0] px-4 py-2.5 shadow-[0_-8px_24px_rgba(40,10,10,0.14)] flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#7A6455]">
              Total Payable ({c.itemCount} {c.itemCount === 1 ? 'item' : 'items'})
            </p>
            <p className="text-lg font-black text-[#B0151D] leading-tight">
              ${c.total.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={validateAndPlaceOrder}
            disabled={c.isPlacingOrder}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#8B1E1E] via-[#A61922] to-[#7A1218] text-white font-bold text-xs shadow-[0_6px_18px_rgba(139,30,30,0.35)] flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-60 cursor-pointer"
          >
            <Lock size={14} strokeWidth={2.4} />
            <span>{c.isPlacingOrder ? 'Processing...' : 'Place Order'}</span>
            <ArrowRight size={15} strokeWidth={2.4} />
          </button>
        </div>
      )}

      <BhaturaFooter />

      {/* Map Address Picker Modal */}
      {isAddressModalOpen && (
        <AddressModal
          isOpen={isAddressModalOpen}
          initialView="map"
          onClose={() => setIsAddressModalOpen(false)}
          onSelect={(locationData) => {
            const { address, lat, lng, addressDetails } = locationData || {};
            if (address) {
              c.setAddressLine1(address);
              if (addressDetails?.city) c.setCity(addressDetails.city);
              if (addressDetails?.state)
                c.setState(addressDetails.state.substring(0, 2).toUpperCase());
              if (addressDetails?.postcode)
                c.setZipCode(addressDetails.postcode.substring(0, 5));
              c.handleSelectSuggestion({
                display_name: address,
                lat: String(lat || 40.5401),
                lon: String(lng || -74.3807),
                address: addressDetails || {},
              });
            }
            setIsAddressModalOpen(false);
          }}
        />
      )}

      {/* Step 3 Review & Tipping Modal */}
      <ReviewOrderSection
        step={c.step}
        user={c.user}
        restaurant={c.restaurant}
        tip={c.tip}
        setTip={c.setTip}
        onBack={() => c.setStep(2)}
        onPlaceOrder={() => {
          c.setStep(2);
          validateAndPlaceOrder();
        }}
        total={c.total}
        compiledAddress={c.compiledAddress}
        fullName={c.fullName}
        phone={c.phone}
        paymentMethod={c.paymentMethod}
        items={c.items}
        subtotal={c.subtotal}
        deliveryFee={c.deliveryFee}
        tax={c.tax}
        platformFee={c.platformFee}
        serviceFee={c.serviceFee}
        packagingFee={c.packagingFee}
        couponDiscount={c.couponDiscount}
        loyaltyDiscount={c.loyaltyDiscount}
        orderType={c.orderType}
        courierNotes={c.deliveryInstructions}
        specialInstructions={c.specialInstructions}
        isPlacingOrder={c.isPlacingOrder}
      />

      {/* Secure Stripe Payment Modal */}
      <PaymentSimulatorModal
        isOpen={c.showPaymentModal}
        onClose={() => c.setShowPaymentModal(false)}
        amount={c.total}
        checkoutData={c.checkoutPayload}
        onSuccess={c.executeOrderCreation}
      />

      <style jsx global>{`
        .bhatura-phone-wrap .PhoneInputInput {
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: #1c1917;
          height: 100%;
          width: 100%;
        }
        .bhatura-phone-wrap .PhoneInputCountry {
          margin-right: 6px;
        }
      `}</style>
    </div>
  );
}
