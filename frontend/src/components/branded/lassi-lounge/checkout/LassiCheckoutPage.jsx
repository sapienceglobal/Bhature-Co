'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  Gift,
  Award,
} from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import { useCheckoutState } from '@/components/checkout/useCheckoutState';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LassiAddressModal from '../LassiAddressModal';
import ReviewOrderSection from '@/components/checkout/ReviewOrderSection';
import PaymentSimulatorModal from '@/components/checkout/PaymentSimulatorModal';
import { formatCurrency, isRestaurantOpenNow, isWithin15MinsOfClosing } from '@/lib/formatters';
import { getDishImage } from '@/components/profile/profileUtils';
import { showToast } from '@/components/ui';

const HERO_BG = '/images/branded/lassi-lounge/hero-spread.jpg';

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
  { value: '14:30', label: '02:30 PM - 03:00 PM' },
  { value: '17:30', label: '05:30 PM - 06:00 PM' },
  { value: '18:30', label: '06:30 PM - 07:00 PM' },
  { value: '19:30', label: '07:30 PM - 08:00 PM' },
  { value: '20:30', label: '08:30 PM - 09:00 PM' },
  { value: '21:30', label: '09:30 PM - 10:00 PM' },
];

const formatCardNumber = (val = '') => {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const formatExpiry = (val = '') => {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

export default function LassiCheckoutPage() {
  const c = useCheckoutState();
  const { user } = useAuth();
  const { specialInstructions, setSpecialInstructions } = useCart();

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(0);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');

  // Local saved addresses list
  const [sessionAddresses, setSessionAddresses] = useState([
    {
      label: 'Home',
      address: '9408 118th St, South Richmond Hill, NY 11419',
      displayLine1: '9408 118th St',
      displayLine2: 'South Richmond Hill, NY 11419, USA',
      lat: 40.6908,
      lng: -73.8271,
    },
    {
      label: 'Work',
      address: '120-10 Liberty Ave, South Richmond Hill, NY 11419',
      displayLine1: '120-10 Liberty Ave',
      displayLine2: 'South Richmond Hill, NY 11419, USA',
      lat: 40.6912,
      lng: -73.8245,
    },
  ]);

  // Card payment fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [saveCardForFuture, setSaveCardForFuture] = useState(true);

  // Utensils state
  const [needUtensils, setNeedUtensils] = useState(false);
  const [kitchenNotes, setKitchenNotes] = useState('');

  // Field validation errors
  const [formErrors, setFormErrors] = useState({});
  const [checkoutCouponError, setCheckoutCouponError] = useState('');

  // Custom tip input mode
  const [customTipInput, setCustomTipInput] = useState('');
  const [isCustomTipActive, setIsCustomTipActive] = useState(false);

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

    // Address validation if delivery & manual form is active
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

  // Sync saved addresses and delivery selection
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
      if (mapped[defIdx]) {
        c.handleSelectSavedAddress(mapped[defIdx]);
      }
    } else if (!c.addressLine1 && sessionAddresses.length > 0) {
      c.handleSelectSavedAddress(sessionAddresses[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.user?.savedAddresses]);

  // Combine instructions
  useEffect(() => {
    const parts = [];
    if (needUtensils) parts.push('Include plastic utensils & napkins.');
    if (kitchenNotes.trim()) parts.push(kitchenNotes.trim());
    if (typeof setSpecialInstructions === 'function') {
      setSpecialInstructions(parts.join(' '));
    }
  }, [needUtensils, kitchenNotes, setSpecialInstructions]);

  const handleSelectAddressCard = (addr, idx) => {
    setSelectedAddressIdx(idx);
    setShowAddressForm(false);
    c.handleSelectSavedAddress(addr);
    clearFieldError('addressLine1');
  };

  const handleAddNewAddressSubmit = (e) => {
    e.preventDefault();
    if (!c.addressLine1?.trim()) {
      setFormErrors((prev) => ({ ...prev, addressLine1: 'Please enter street address' }));
      return;
    }
    const fullAddr = [c.addressLine1, c.addressLine2, c.city, c.state, c.zipCode]
      .filter(Boolean)
      .join(', ');

    const newEntry = {
      label: newAddressLabel || 'Other',
      address: fullAddr,
      displayLine1: [c.addressLine1, c.addressLine2].filter(Boolean).join(', '),
      displayLine2: `${c.city || ''}, ${c.state || ''} ${c.zipCode || ''}, USA`,
      lat: null,
      lng: null,
    };

    setSessionAddresses((prev) => [newEntry, ...prev]);
    setSelectedAddressIdx(0);
    setShowAddressForm(false);
    c.handleSelectSavedAddress(newEntry);
  };

  const handleSelectTipAmount = (amount) => {
    setIsCustomTipActive(false);
    setCustomTipInput('');
    c.setTip(amount);
  };

  const handleCustomTipChange = (val) => {
    setCustomTipInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      c.setTip(parsed);
    } else {
      c.setTip(0);
    }
  };

  const restaurantOpenStatus = useMemo(() => {
    if (!c.restaurant) return { isOpen: true, isClosingSoon: false };
    return {
      isOpen: isRestaurantOpenNow(c.restaurant),
      isClosingSoon: isWithin15MinsOfClosing(c.restaurant),
    };
  }, [c.restaurant]);

  const isClosed = !restaurantOpenStatus.isOpen;

  // Loyalty calculations
  const loyaltyPoints = Number(user?.loyaltyPoints || c.user?.loyaltyPoints || 0);
  const loyaltyValue = (loyaltyPoints / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-[#FAF3E8] text-[#1A1A1A] flex flex-col font-sans">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO BANNER (Matches Bhatura's Layout with Lassi Lounge Brand)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#2A0508] min-h-[250px] sm:min-h-[290px] lg:min-h-[320px] flex items-center">
        <Image
          src={HERO_BG}
          alt="Lassi Lounge NY Checkout"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40 brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2A0508]/95 via-[#4A090B]/85 to-[#1A0305]/95" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#2A0508]/60 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 sm:py-12 pb-14">
          <div className="max-w-xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs sm:text-[13px] text-white/85 font-medium mb-2.5">
              <Link href="/" className="hover:text-[#F5B53D] transition-colors">
                Home
              </Link>
              <ChevronRight size={13} className="text-white/60" />
              <Link href="/menu" className="hover:text-[#F5B53D] transition-colors">
                Menu
              </Link>
              <ChevronRight size={13} className="text-white/60" />
              <span className="text-[#F5B53D] font-semibold">Checkout</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#F5B53D] text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles size={12} className="text-[#D4AF37]" />
              <span>100% Secure Checkout</span>
            </div>

            <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-[54px] font-black text-white leading-[1.08] tracking-tight">
              Checkout
            </h1>

            <p className="text-white/90 text-sm sm:text-[15px] leading-relaxed mt-2.5 max-w-[460px]">
              Almost there! Complete your order and indulge in authentic Royal Indian delicacies fresh to your doorstep.
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
            {/* Background Connecting Line */}
            <div className="absolute top-[22px] left-[12%] right-[12%] h-[2px] bg-[#E2D6C5] z-0" />
            {/* Active Maroon Progress Line */}
            <div
              className="absolute top-[22px] left-[12%] h-[2.5px] bg-[#7A0B10] z-0 transition-all duration-500"
              style={{
                width: c.step === 1 ? '18%' : c.step === 2 ? '38%' : '76%',
              }}
            />

            {/* Step 1: Cart */}
            <button
              type="button"
              onClick={() => c.openCart?.()}
              className="relative z-10 flex flex-col items-center group focus:outline-none w-1/3 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[#7A0B10] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(122,11,16,0.35)] border-2 border-white">
                <ShoppingCart size={18} strokeWidth={2.2} />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-4 h-4 rounded-full bg-[#7A0B10] text-white text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-[#1A1A1A] group-hover:text-[#7A0B10] transition-colors">
                  Cart
                </span>
              </div>
            </button>

            {/* Step 2: Delivery & Payment */}
            <button
              type="button"
              onClick={() => c.setStep(2)}
              className="relative z-10 flex flex-col items-center group focus:outline-none w-1/3 cursor-pointer"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm border-2 transition-all ${
                  c.step >= 2
                    ? 'bg-[#7A0B10] border-white text-white shadow-[0_4px_12px_rgba(122,11,16,0.35)]'
                    : 'bg-white border-[#E5D9C8] text-[#78716C]'
                }`}
              >
                <MapPin size={18} strokeWidth={2.2} />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-4 h-4 rounded-full bg-[#7A0B10] text-white text-[10px] font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-[#1A1A1A]">
                  Delivery &amp; Payment
                </span>
              </div>
            </button>

            {/* Step 3: Review & Place Order */}
            <button
              type="button"
              onClick={handleStep3Click}
              className="relative z-10 flex flex-col items-center group focus:outline-none w-1/3 cursor-pointer"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm border-2 transition-all ${
                  c.step === 3
                    ? 'bg-[#7A0B10] border-white text-white shadow-[0_4px_12px_rgba(122,11,16,0.35)]'
                    : 'bg-white border-[#E5D9C8] text-[#1A1A1A]'
                }`}
              >
                <Check size={18} strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-4 h-4 rounded-full bg-[#EFE6D8] border border-[#D5C7B4] text-[#57534E] text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-[#1A1A1A] group-hover:text-[#7A0B10] transition-colors">
                  Review &amp; Place Order
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. MAIN CHECKOUT CONTENT (2-Column Grid)
         ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 py-7 sm:py-9">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {c.itemCount === 0 ? (
            <div className="bg-white rounded-3xl border border-[#EADBC8] shadow-[0_8px_30px_rgba(122,11,16,0.06)] p-10 sm:p-16 text-center max-w-xl mx-auto my-8">
              <div className="w-20 h-20 rounded-full bg-[#FDF3E7] border border-[#EAD4B4] text-[#7A0B10] flex items-center justify-center mx-auto mb-5">
                <ShoppingCart size={34} strokeWidth={1.8} />
              </div>
              <h2 className="font-['Playfair_Display'] text-3xl font-black text-[#1A1A1A]">
                Your Cart is Empty
              </h2>
              <p className="text-sm text-[#6B5E53] mt-2 max-w-sm mx-auto leading-relaxed">
                Add your favorite Butter Chicken, Biryani, Naan, or refreshing Mango Lassi before proceeding to checkout.
              </p>
              <Link
                href="/menu"
                className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#7A0B10] via-[#5C0612] to-[#4A090B] hover:from-[#5C0612] hover:to-[#7A0B10] text-white text-sm font-bold shadow-[0_8px_20px_rgba(122,11,16,0.3)] transition-all hover:-translate-y-0.5"
              >
                <span>Browse Our Menu</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
              {/* ─────────────────────────────────────────────────────────────
                  LEFT COLUMN (8 cols): Checkout Details Cards
                 ───────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-8 space-y-6">
                {/* ═══ CARD 1: DELIVERY OPTION ═══ */}
                <div className="bg-white rounded-2xl border border-[#EAE0D3] shadow-[0_4px_20px_rgba(40,10,10,0.04)] p-5 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F0E6D8]">
                    <div className="w-7 h-7 rounded-full bg-[#7A0B10] text-white text-xs font-black flex items-center justify-center shadow-xs">
                      1
                    </div>
                    <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1A1A1A]">
                      Delivery Option
                    </h2>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Delivery Tab */}
                    <button
                      type="button"
                      onClick={() => c.setOrderType('delivery')}
                      className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                        c.orderType === 'delivery'
                          ? 'border-[#7A0B10] bg-[#FDF8EE] shadow-[0_4px_16px_rgba(122,11,16,0.12)]'
                          : 'border-[#EAE0D3] bg-white hover:border-[#D5C4AE]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            c.orderType === 'delivery'
                              ? 'bg-[#7A0B10] text-white'
                              : 'bg-[#F5EDE1] text-[#6B5E53]'
                          }`}
                        >
                          <Bike size={20} strokeWidth={2.2} />
                        </div>
                        {c.orderType === 'delivery' && (
                          <div className="w-5 h-5 rounded-full bg-[#7A0B10] text-white flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <h3 className="font-bold text-sm sm:text-base text-[#1A1A1A]">
                          Delivery
                        </h3>
                        <p className="text-xs text-[#6B5E53] mt-0.5">
                          {c.quoteLoading ? 'Calculating fee...' : c.deliveryFee === 0 ? 'Free Delivery' : 'Delivered hot to your door'}
                        </p>
                      </div>
                      <span className="mt-2.5 inline-block text-[11px] font-bold text-[#7A0B10] bg-[#FCEAE6] px-2 py-0.5 rounded-md w-fit">
                        35-45 mins
                      </span>
                    </button>

                    {/* Pickup Tab */}
                    <button
                      type="button"
                      onClick={() => c.setOrderType('pickup')}
                      className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                        c.orderType === 'pickup'
                          ? 'border-[#7A0B10] bg-[#FDF8EE] shadow-[0_4px_16px_rgba(122,11,16,0.12)]'
                          : 'border-[#EAE0D3] bg-white hover:border-[#D5C4AE]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            c.orderType === 'pickup'
                              ? 'bg-[#7A0B10] text-white'
                              : 'bg-[#F5EDE1] text-[#6B5E53]'
                          }`}
                        >
                          <Store size={20} strokeWidth={2.2} />
                        </div>
                        {c.orderType === 'pickup' && (
                          <div className="w-5 h-5 rounded-full bg-[#7A0B10] text-white flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <h3 className="font-bold text-sm sm:text-base text-[#1A1A1A]">
                          Store Pickup
                        </h3>
                        <p className="text-xs text-[#6B5E53] mt-0.5">
                          Pick up directly from Lassi Lounge
                        </p>
                      </div>
                      <span className="mt-2.5 inline-block text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-md w-fit">
                        Ready in 20-30 mins
                      </span>
                    </button>
                  </div>
                </div>

                {/* ═══ CARD 2: CONTACT & DELIVERY DETAILS ═══ */}
                <div className="bg-white rounded-2xl border border-[#EAE0D3] shadow-[0_4px_20px_rgba(40,10,10,0.04)] p-5 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F0E6D8]">
                    <div className="w-7 h-7 rounded-full bg-[#7A0B10] text-white text-xs font-black flex items-center justify-center shadow-xs">
                      2
                    </div>
                    <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1A1A1A]">
                      {c.orderType === 'delivery'
                        ? 'Contact & Delivery Details'
                        : 'Contact & Pickup Details'}
                    </h2>
                  </div>

                  {/* Contact Fields */}
                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div data-field="fullName">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                          Full Name <span className="text-[#7A0B10]">*</span>
                        </label>
                        <input
                          type="text"
                          value={c.fullName}
                          onChange={(e) => {
                            c.setFullName(e.target.value);
                            clearFieldError('fullName');
                          }}
                          placeholder="e.g. Adarsh Sharma"
                          className={`w-full h-11 rounded-xl border bg-[#FDFBF8] px-3.5 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:ring-2 focus:ring-[#7A0B10]/20 focus:border-[#7A0B10] transition-all ${
                            formErrors.fullName ? 'border-[#DC2626] bg-[#FFF5F5]' : 'border-[#E4D9C8]'
                          }`}
                        />
                        {formErrors.fullName && (
                          <p className="text-xs text-[#DC2626] mt-1 font-medium flex items-center gap-1">
                            <AlertCircle size={12} /> {formErrors.fullName}
                          </p>
                        )}
                      </div>

                      {/* Phone Number */}
                      <div data-field="phone">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                          Mobile Number <span className="text-[#7A0B10]">*</span>
                        </label>
                        <div
                          className={`h-11 rounded-xl border bg-[#FDFBF8] px-3 flex items-center focus-within:ring-2 focus-within:ring-[#7A0B10]/20 focus-within:border-[#7A0B10] transition-all lassi-phone-wrap ${
                            formErrors.phone ? 'border-[#DC2626] bg-[#FFF5F5]' : 'border-[#E4D9C8]'
                          }`}
                        >
                          <PhoneInput
                            international
                            defaultCountry="US"
                            value={c.phone}
                            onChange={(val) => {
                              c.setPhone(val || '');
                              clearFieldError('phone');
                            }}
                            className="w-full"
                          />
                        </div>
                        {formErrors.phone && (
                          <p className="text-xs text-[#DC2626] mt-1 font-medium flex items-center gap-1">
                            <AlertCircle size={12} /> {formErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div data-field="email">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                        Email Address <span className="text-[#7A0B10]">*</span>
                      </label>
                      <input
                        type="email"
                        value={c.email}
                        onChange={(e) => {
                          c.setEmail(e.target.value);
                          clearFieldError('email');
                        }}
                        placeholder="e.g. adarsh@example.com"
                        className={`w-full h-11 rounded-xl border bg-[#FDFBF8] px-3.5 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:ring-2 focus:ring-[#7A0B10]/20 focus:border-[#7A0B10] transition-all ${
                          formErrors.email ? 'border-[#DC2626] bg-[#FFF5F5]' : 'border-[#E4D9C8]'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-[#DC2626] mt-1 font-medium flex items-center gap-1">
                          <AlertCircle size={12} /> {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ─── DELIVERY ADDRESS SECTION (If orderType === 'delivery') ─── */}
                  {c.orderType === 'delivery' ? (
                    <div className="mt-6 pt-5 border-t border-[#F0E6D8] space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#6B5E53]">
                          Delivery Address <span className="text-[#7A0B10]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(!showAddressForm)}
                          className="text-xs font-bold text-[#7A0B10] hover:text-[#5C0612] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Pencil size={12} />
                          <span>{showAddressForm ? 'Select Saved Address' : '+ Enter New Address'}</span>
                        </button>
                      </div>

                      {/* Saved Addresses List (Cards) */}
                      {!showAddressForm && sessionAddresses.length > 0 && (
                        <div className="space-y-2.5">
                          {sessionAddresses.map((addr, idx) => {
                            const isSelected = selectedAddressIdx === idx;
                            const IconComponent =
                              addr.label?.toLowerCase() === 'work'
                                ? Briefcase
                                : addr.label?.toLowerCase() === 'home'
                                ? Home
                                : MapPin;
                            return (
                              <div
                                key={addr._id || `${addr.label}-${idx}`}
                                onClick={() => handleSelectAddressCard(addr, idx)}
                                className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-[#FDF8EE] border-[#7A0B10] shadow-[0_2px_10px_rgba(122,11,16,0.1)]'
                                    : 'bg-white border-[#EAE0D3] hover:border-[#D5C4AE]'
                                }`}
                              >
                                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                  <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'bg-[#7A0B10] text-white'
                                        : 'bg-[#F5EDE1] text-[#6B5E53]'
                                    }`}
                                  >
                                    <IconComponent size={17} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs sm:text-sm text-[#1A1A1A]">
                                        {addr.label || 'Saved Address'}
                                      </span>
                                      {isSelected && (
                                        <span className="text-[10px] font-bold text-[#7A0B10] bg-[#FCEAE6] px-1.5 py-0.5 rounded">
                                          Deliver Here
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-[#6B5E53] truncate mt-0.5">
                                      {addr.address}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'border-[#7A0B10] bg-[#7A0B10] text-white'
                                      : 'border-[#D4C7B8]'
                                  }`}
                                >
                                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Manual Address Input Form (or shown when "+ Enter New Address" is clicked) */}
                      {(showAddressForm || sessionAddresses.length === 0) && (
                        <div className="bg-[#FAF5EC] rounded-2xl p-4 sm:p-5 border border-[#E8DCcb] space-y-3.5">
                          {/* Label Pills */}
                          <div>
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                              Address Label
                            </span>
                            <div className="flex gap-2">
                              {['Home', 'Work', 'Other'].map((lbl) => (
                                <button
                                  key={lbl}
                                  type="button"
                                  onClick={() => setNewAddressLabel(lbl)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                    newAddressLabel === lbl
                                      ? 'bg-[#7A0B10] text-white shadow-xs'
                                      : 'bg-white text-[#6B5E53] border border-[#E0D4C2]'
                                  }`}
                                >
                                  {lbl}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Street Address & Autocomplete */}
                          <div data-field="addressLine1" className="relative">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                              Street Address <span className="text-[#7A0B10]">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={c.addressLine1}
                                onChange={(e) => {
                                  c.handleAddressLine1Change(e.target.value);
                                  clearFieldError('addressLine1');
                                }}
                                placeholder="Enter street address, building, or landmark"
                                className={`w-full h-11 rounded-xl border bg-white pl-10 pr-9 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:ring-2 focus:ring-[#7A0B10]/20 focus:border-[#7A0B10] transition-all ${
                                  formErrors.addressLine1 ? 'border-[#DC2626] bg-[#FFF5F5]' : 'border-[#E4D9C8]'
                                }`}
                              />
                              <MapPin size={17} className="absolute left-3.5 top-3.5 text-[#7A0B10]" />
                              {c.addressLine1 && (
                                <button
                                  type="button"
                                  onClick={() => c.handleAddressLine1Change('')}
                                  className="absolute right-3 top-3.5 text-[#8C7E72] hover:text-[#1A1A1A]"
                                >
                                  <X size={15} />
                                </button>
                              )}
                            </div>

                            {/* Autocomplete Suggestions Dropdown */}
                            {c.suggestions?.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-[#E0D4C2] shadow-xl z-50 overflow-hidden divide-y divide-[#F2EAE0]">
                                {c.suggestions.map((sug, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      c.handleSelectSuggestion(sug);
                                      clearFieldError('addressLine1');
                                    }}
                                    className="p-3 hover:bg-[#FDF8EE] cursor-pointer text-xs sm:text-sm text-[#1A1A1A] flex items-center gap-2.5 transition-colors"
                                  >
                                    <MapPin size={15} className="text-[#7A0B10] shrink-0" />
                                    <span className="truncate">{sug.display_name}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {formErrors.addressLine1 && (
                              <p className="text-xs text-[#DC2626] mt-1 font-medium flex items-center gap-1">
                                <AlertCircle size={12} /> {formErrors.addressLine1}
                              </p>
                            )}
                          </div>

                          {/* Quick Location Buttons: Current GPS & Pin on Map */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={c.handleUseCurrentLocation}
                              disabled={c.isLocationLoading}
                              className="px-3 py-1.5 rounded-lg bg-white border border-[#D5C6B4] text-[#7A0B10] text-xs font-bold hover:bg-[#FDF8EE] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                              className="px-3 py-1.5 rounded-lg bg-white border border-[#D5C6B4] text-[#856404] text-xs font-bold hover:bg-[#FFFDF4] transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <MapPin size={13} />
                              <span>Pin on Map</span>
                            </button>
                          </div>

                          {/* Unit / Apt / Suite */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                              Apt / Suite / Floor (Optional)
                            </label>
                            <input
                              type="text"
                              value={c.addressLine2}
                              onChange={(e) => c.setAddressLine2(e.target.value)}
                              placeholder="e.g. Apt 4B, Floor 2"
                              className="w-full h-10 rounded-xl border border-[#E4D9C8] bg-white px-3.5 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10]"
                            />
                          </div>

                          {/* City, State, Zip */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div data-field="city">
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                                City <span className="text-[#7A0B10]">*</span>
                              </label>
                              <input
                                type="text"
                                value={c.city}
                                onChange={(e) => {
                                  c.setCity(e.target.value);
                                  clearFieldError('city');
                                }}
                                placeholder="e.g. Richmond Hill"
                                className={`w-full h-10 rounded-xl border bg-white px-3 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10] ${
                                  formErrors.city ? 'border-[#DC2626]' : 'border-[#E4D9C8]'
                                }`}
                              />
                            </div>

                            <div data-field="state">
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                                State <span className="text-[#7A0B10]">*</span>
                              </label>
                              <select
                                value={c.state || 'NY'}
                                onChange={(e) => {
                                  c.setState(e.target.value);
                                  clearFieldError('state');
                                }}
                                className="w-full h-10 rounded-xl border border-[#E4D9C8] bg-white px-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#7A0B10]"
                              >
                                {US_STATES.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div data-field="zipCode">
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                                Zip Code <span className="text-[#7A0B10]">*</span>
                              </label>
                              <input
                                type="text"
                                maxLength={5}
                                value={c.zipCode}
                                onChange={(e) => {
                                  c.setZipCode(e.target.value.replace(/\D/g, ''));
                                  clearFieldError('zipCode');
                                }}
                                placeholder="11419"
                                className={`w-full h-10 rounded-xl border bg-white px-3 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10] ${
                                  formErrors.zipCode ? 'border-[#DC2626]' : 'border-[#E4D9C8]'
                                }`}
                              />
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddressForm(false)}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B5E53] hover:bg-white transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleAddNewAddressSubmit}
                              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#7A0B10] text-white hover:bg-[#5C0612] transition-colors shadow-xs"
                            >
                              Use This Address
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Delivery Time Option: ASAP vs Scheduled */}
                      <div className="pt-4 border-t border-[#F0E6D8]">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-2.5">
                          Delivery Time Preference
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* ASAP Option */}
                          <div
                            onClick={() => c.setDeliveryTimeOption?.('asap')}
                            className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                              c.deliveryTimeOption === 'asap' || !c.deliveryTimeOption
                                ? 'bg-[#FDF8EE] border-[#7A0B10] shadow-[0_2px_10px_rgba(122,11,16,0.1)]'
                                : 'bg-white border-[#E6DDD0] hover:border-[#D0C2B0]'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                c.deliveryTimeOption === 'asap' || !c.deliveryTimeOption
                                  ? 'bg-[#7A0B10] text-white border-[#7A0B10]'
                                  : 'border-[#D4C7B8]'
                              }`}
                            >
                              {(c.deliveryTimeOption === 'asap' || !c.deliveryTimeOption) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                                <Clock size={14} className="text-[#7A0B10]" />
                                <span>ASAP (35-45 mins)</span>
                              </p>
                              <p className="text-[11px] text-[#6B5E53] mt-0.5">
                                Prepared fresh and dispatched immediately
                              </p>
                            </div>
                          </div>

                          {/* Scheduled Option */}
                          <div
                            onClick={() => c.setDeliveryTimeOption?.('scheduled')}
                            className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                              c.deliveryTimeOption === 'scheduled'
                                ? 'bg-[#FDF8EE] border-[#7A0B10] shadow-[0_2px_10px_rgba(122,11,16,0.1)]'
                                : 'bg-white border-[#E6DDD0] hover:border-[#D0C2B0]'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                c.deliveryTimeOption === 'scheduled'
                                  ? 'bg-[#7A0B10] text-white border-[#7A0B10]'
                                  : 'border-[#D4C7B8]'
                              }`}
                            >
                              {c.deliveryTimeOption === 'scheduled' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                                <Calendar size={14} className="text-[#7A0B10]" />
                                <span>Schedule for Later</span>
                              </p>
                              <p className="text-[11px] text-[#6B5E53] mt-0.5">
                                Choose exact date and arrival window
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Scheduled Date & Time Slot Dropdowns */}
                        {c.deliveryTimeOption === 'scheduled' && (
                          <div className="mt-4 pt-3.5 border-t border-[#F2EAE0] grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                                Delivery Date
                              </label>
                              <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={c.scheduledDate}
                                onChange={(e) => c.setScheduledDate?.(e.target.value)}
                                className="w-full h-10 rounded-lg border border-[#E4D9C8] bg-[#FDFBF8] px-3 text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#7A0B10]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                                Time Slot
                              </label>
                              <select
                                value={c.scheduledSlot}
                                onChange={(e) => c.setScheduledSlot?.(e.target.value)}
                                className="w-full h-10 rounded-lg border border-[#E4D9C8] bg-[#FDFBF8] px-3 text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#7A0B10]"
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

                      {/* Delivery Instructions */}
                      <div className="pt-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                          Delivery Instructions for Driver (Optional)
                        </label>
                        <input
                          type="text"
                          value={c.deliveryInstructions}
                          onChange={(e) => c.setDeliveryInstructions(e.target.value)}
                          placeholder="e.g. Leave with doorman, gate code #1234, ring bell"
                          className="w-full h-11 rounded-xl border border-[#E4D9C8] bg-[#FDFBF8] px-3.5 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10]"
                        />
                      </div>
                    </div>
                  ) : (
                    /* ─── PICKUP INSTRUCTIONS ─── */
                    <div className="mt-6 pt-5 border-t border-[#F0E6D8] space-y-4">
                      <div className="bg-[#FAF5EC] rounded-2xl p-4 sm:p-5 border border-[#E8DCCB] flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#7A0B10] text-white flex items-center justify-center shrink-0">
                          <Store size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-[#1A1A1A]">
                              Lassi Lounge NY — Store Pickup
                            </h4>
                            <span className="text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                              Open Now
                            </span>
                          </div>
                          <p className="text-xs text-[#6B5E53] mt-1">
                            9408 118th St, South Richmond Hill, NY 11419
                          </p>
                          <p className="text-xs text-[#7A0B10] font-semibold mt-1">
                            Phone: +1 347-233-3733 • Ready in approx. 20-30 mins
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══ CARD 3: PAYMENT METHOD ═══ */}
                <div className="bg-white rounded-2xl border border-[#EAE0D3] shadow-[0_4px_20px_rgba(40,10,10,0.04)] p-5 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F0E6D8]">
                    <div className="w-7 h-7 rounded-full bg-[#7A0B10] text-white text-xs font-black flex items-center justify-center shadow-xs">
                      3
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1A1A1A]">
                        Payment Method
                      </h2>
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#16A34A] font-bold bg-[#DCFCE7] px-2.5 py-1 rounded-full">
                        <ShieldCheck size={14} />
                        <span>100% Encrypted</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3.5">
                    {/* Option 1: Credit / Debit Card */}
                    <div
                      onClick={() => c.setPaymentMethod('stripe_online')}
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                        c.paymentMethod === 'stripe_online' || c.paymentMethod === 'credit_card'
                          ? 'border-[#7A0B10] bg-[#FDF8EE] shadow-[0_2px_12px_rgba(122,11,16,0.1)]'
                          : 'border-[#EAE0D3] bg-white hover:border-[#D5C4AE]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              c.paymentMethod === 'stripe_online' || c.paymentMethod === 'credit_card'
                                ? 'bg-[#7A0B10] text-white'
                                : 'bg-[#F5EDE1] text-[#6B5E53]'
                            }`}
                          >
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm sm:text-base text-[#1A1A1A]">
                              Credit or Debit Card
                            </h4>
                            <p className="text-xs text-[#6B5E53] mt-0.5">
                              Visa, MasterCard, American Express, Discover
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            c.paymentMethod === 'stripe_online' || c.paymentMethod === 'credit_card'
                              ? 'border-[#7A0B10] bg-[#7A0B10] text-white'
                              : 'border-[#D4C7B8]'
                          }`}
                        >
                          {(c.paymentMethod === 'stripe_online' || c.paymentMethod === 'credit_card') && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>

                      {/* Card Details Form (Visible when Card is selected) */}
                      {(c.paymentMethod === 'stripe_online' || c.paymentMethod === 'credit_card') && (
                        <div className="mt-5 pt-4 border-t border-[#F0E6D8] space-y-3.5 animate-in fade-in duration-200">
                          {/* Card Number */}
                          <div data-field="cardNumber">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                              Card Number <span className="text-[#7A0B10]">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                maxLength={19}
                                value={cardNumber}
                                onChange={(e) => {
                                  setCardNumber(formatCardNumber(e.target.value));
                                  clearFieldError('cardNumber');
                                }}
                                placeholder="4532 •••• •••• 8901"
                                className={`w-full h-11 rounded-xl border bg-white pl-10 pr-4 text-sm font-mono text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:ring-2 focus:ring-[#7A0B10]/20 focus:border-[#7A0B10] ${
                                  formErrors.cardNumber ? 'border-[#DC2626] bg-[#FFF5F5]' : 'border-[#E4D9C8]'
                                }`}
                              />
                              <CreditCard size={17} className="absolute left-3.5 top-3.5 text-[#7A0B10]" />
                            </div>
                            {formErrors.cardNumber && (
                              <p className="text-xs text-[#DC2626] mt-1 font-medium flex items-center gap-1">
                                <AlertCircle size={12} /> {formErrors.cardNumber}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3.5">
                            {/* Expiry */}
                            <div data-field="cardExpiry">
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                                Expiry (MM/YY) <span className="text-[#7A0B10]">*</span>
                              </label>
                              <input
                                type="text"
                                maxLength={5}
                                value={cardExpiry}
                                onChange={(e) => {
                                  setCardExpiry(formatExpiry(e.target.value));
                                  clearFieldError('cardExpiry');
                                }}
                                placeholder="MM/YY"
                                className={`w-full h-11 rounded-xl border bg-white px-3.5 text-sm font-mono text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10] ${
                                  formErrors.cardExpiry ? 'border-[#DC2626] bg-[#FFF5F5]' : 'border-[#E4D9C8]'
                                }`}
                              />
                              {formErrors.cardExpiry && (
                                <p className="text-xs text-[#DC2626] mt-1 font-medium">
                                  {formErrors.cardExpiry}
                                </p>
                              )}
                            </div>

                            {/* CVV */}
                            <div data-field="cardCvv">
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                                CVV / CVC <span className="text-[#7A0B10]">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="password"
                                  maxLength={4}
                                  value={cardCvv}
                                  onChange={(e) => {
                                    setCardCvv(e.target.value.replace(/\D/g, ''));
                                    clearFieldError('cardCvv');
                                  }}
                                  placeholder="•••"
                                  className={`w-full h-11 rounded-xl border bg-white pl-9 pr-3 text-sm font-mono text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10] ${
                                    formErrors.cardCvv ? 'border-[#DC2626] bg-[#FFF5F5]' : 'border-[#E4D9C8]'
                                  }`}
                                />
                                <Lock size={15} className="absolute left-3 top-3.5 text-[#A89F91]" />
                              </div>
                              {formErrors.cardCvv && (
                                <p className="text-xs text-[#DC2626] mt-1 font-medium">
                                  {formErrors.cardCvv}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Cardholder Name */}
                          <div data-field="cardHolderName">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                              Name on Card <span className="text-[#7A0B10]">*</span>
                            </label>
                            <input
                              type="text"
                              value={cardHolderName}
                              onChange={(e) => {
                                setCardHolderName(e.target.value);
                                clearFieldError('cardHolderName');
                              }}
                              placeholder="e.g. Adarsh Sharma"
                              className={`w-full h-11 rounded-xl border bg-white px-3.5 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10] ${
                                formErrors.cardHolderName ? 'border-[#DC2626] bg-[#FFF5F5]' : 'border-[#E4D9C8]'
                              }`}
                            />
                            {formErrors.cardHolderName && (
                              <p className="text-xs text-[#DC2626] mt-1 font-medium">
                                {formErrors.cardHolderName}
                              </p>
                            )}
                          </div>

                          {/* Save Card Checkbox */}
                          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={saveCardForFuture}
                              onChange={(e) => setSaveCardForFuture(e.target.checked)}
                              className="w-4 h-4 rounded text-[#7A0B10] focus:ring-[#7A0B10] border-[#D4C7B8]"
                            />
                            <span className="text-xs text-[#6B5E53] font-medium">
                              Save card securely for faster checkout next time
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Option 2: Cash on Delivery (COD) */}
                    <div
                      onClick={() => c.setPaymentMethod('cash_on_delivery')}
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                        c.paymentMethod === 'cash_on_delivery'
                          ? 'border-[#7A0B10] bg-[#FDF8EE] shadow-[0_2px_12px_rgba(122,11,16,0.1)]'
                          : 'border-[#EAE0D3] bg-white hover:border-[#D5C4AE]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              c.paymentMethod === 'cash_on_delivery'
                                ? 'bg-[#7A0B10] text-white'
                                : 'bg-[#F5EDE1] text-[#6B5E53]'
                            }`}
                          >
                            <Banknote size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm sm:text-base text-[#1A1A1A]">
                              Cash on {c.orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                            </h4>
                            <p className="text-xs text-[#6B5E53] mt-0.5">
                              Pay in cash upon arrival
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            c.paymentMethod === 'cash_on_delivery'
                              ? 'border-[#7A0B10] bg-[#7A0B10] text-white'
                              : 'border-[#D4C7B8]'
                          }`}
                        >
                          {c.paymentMethod === 'cash_on_delivery' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ CARD 4: SPECIAL INSTRUCTIONS ═══ */}
                <div className="bg-white rounded-2xl border border-[#EAE0D3] shadow-[0_4px_20px_rgba(40,10,10,0.04)] p-5 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F0E6D8]">
                    <div className="w-7 h-7 rounded-full bg-[#7A0B10] text-white text-xs font-black flex items-center justify-center shadow-xs">
                      4
                    </div>
                    <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1A1A1A]">
                      Special Instructions
                    </h2>
                  </div>

                  <div className="mt-5 space-y-4">
                    {/* Utensils Switch */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF5EC] border border-[#E8DCCB]">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#1A1A1A]">
                          Need Cutlery, Napkins &amp; Straws?
                        </p>
                        <p className="text-[11px] text-[#6B5E53]">
                          Help us reduce waste by opting out if you have utensils at home.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNeedUtensils(!needUtensils)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          needUtensils ? 'bg-[#7A0B10]' : 'bg-[#D4C7B8]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            needUtensils ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Kitchen Cooking Notes */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                        Cooking &amp; Allergy Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={kitchenNotes}
                        onChange={(e) => setKitchenNotes(e.target.value)}
                        placeholder="e.g. Medium spice, no onions in raita, nut allergy, extra lemon"
                        className="w-full rounded-xl border border-[#E4D9C8] bg-[#FDFBF8] p-3 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  RIGHT COLUMN (4 cols): Sticky Order Summary & Badges
                 ───────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
                {/* ═══ ORDER SUMMARY CARD ═══ */}
                <div className="bg-white rounded-2xl border border-[#EAE0D3] shadow-[0_4px_24px_rgba(40,10,10,0.06)] p-5 sm:p-6">
                  {/* Restaurant Header */}
                  <div className="pb-4 border-b border-[#F0E6D8] flex items-center justify-between">
                    <div>
                      <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1A1A1A]">
                        Lassi Lounge NY
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#6B5E53]">
                        <Star size={13} fill="#F5B53D" className="text-[#F5B53D]" />
                        <span className="font-bold text-[#1A1A1A]">4.9</span>
                        <span>(1,500+ reviews)</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#FCEAE6] text-[#7A0B10] text-[11px] font-black uppercase tracking-wider">
                      {c.orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                    </span>
                  </div>

                  {/* Cart Items List with +/- Steppers */}
                  <div className="py-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {c.items?.map((item, idx) => {
                      const itemImg = item.image || getDishImage(item.name);
                      const unitPrice =
                        (item.selectedSize?.price || item.price || 0) +
                        (item.addOns || []).reduce((sum, a) => sum + (a.price || 0), 0);

                      return (
                        <div
                          key={`${item.menuItemId || item._id || item.name}-${idx}`}
                          className="bg-[#FAF5EC] rounded-xl p-3 border border-[#EDE0CE] flex gap-3 items-center"
                        >
                          {/* Dish Image */}
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#2A0508] shrink-0">
                            <img
                              src={itemImg}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A] truncate">
                              {item.name}
                            </h4>
                            {item.selectedSize && (
                              <p className="text-[11px] text-[#6B5E53]">
                                Size: {item.selectedSize.name}
                              </p>
                            )}
                            {item.addOns?.length > 0 && (
                              <p className="text-[10px] text-[#8C7E72] truncate">
                                + {item.addOns.map((a) => a.name).join(', ')}
                              </p>
                            )}
                            <p className="text-xs font-extrabold text-[#7A0B10] mt-0.5">
                              {formatCurrency(item.lineTotal || unitPrice * item.quantity, c.restaurant?.currency)}
                            </p>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-1.5 bg-white border border-[#E2D4C2] rounded-lg px-1.5 py-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => c.updateQuantity(idx, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center text-[#7A0B10] hover:bg-[#FDF8EE] rounded cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} strokeWidth={2.4} />
                            </button>
                            <span className="text-xs font-bold w-4 text-center text-[#1A1A1A]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => c.updateQuantity(idx, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center text-[#7A0B10] hover:bg-[#FDF8EE] rounded cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} strokeWidth={2.4} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ═══ LOYALTY POINTS REDEEM BANNER (Lassi Lounge Specific) ═══ */}
                  {loyaltyPoints > 0 && (
                    <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-[#FFF8EE] to-[#FFF1DE] border border-[#F2D7A5] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Award size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1A1A1A]">
                            Redeem Loyalty Points
                          </p>
                          <p className="text-[11px] text-[#856404] truncate">
                            You have {loyaltyPoints} pts (Save ${loyaltyValue})
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => c.setUseLoyaltyPoints(!c.useLoyaltyPoints)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          c.useLoyaltyPoints
                            ? 'bg-[#16A34A] text-white shadow-xs'
                            : 'bg-white text-[#7A0B10] border border-[#D4AF37] hover:bg-[#FFFDF4]'
                        }`}
                      >
                        {c.useLoyaltyPoints ? 'Applied ✓' : 'Redeem'}
                      </button>
                    </div>
                  )}

                  {/* ═══ COUPON CODE INPUT ═══ */}
                  <div className="py-3 border-t border-[#F0E6D8]">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={c.couponCode}
                          onChange={(e) => {
                            c.setCouponCode(e.target.value.toUpperCase());
                            setCheckoutCouponError('');
                          }}
                          placeholder="Enter Promo Code"
                          className="w-full h-10 rounded-xl border border-[#E4D9C8] bg-[#FDFBF8] pl-9 pr-3 text-xs uppercase tracking-wider font-bold text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10]"
                        />
                        <Tag size={14} className="absolute left-3 top-3 text-[#7A0B10]" />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCheckoutCoupon}
                        disabled={c.couponLoading || c.couponApplied}
                        className="px-4 h-10 rounded-xl bg-[#7A0B10] text-white text-xs font-bold hover:bg-[#5C0612] disabled:opacity-50 transition-colors cursor-pointer shrink-0 shadow-xs"
                      >
                        {c.couponLoading ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
                      </button>
                    </div>

                    {c.couponApplied && (
                      <div className="mt-2.5 p-2 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-between text-xs text-[#16A34A] font-bold">
                        <span>{c.couponCode} Applied (-{formatCurrency(c.couponDiscount, c.restaurant?.currency)})</span>
                        <button
                          type="button"
                          onClick={c.handleRemoveCoupon}
                          className="text-[#16A34A] hover:text-[#15803D]"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {checkoutCouponError && (
                      <p className="text-xs text-[#DC2626] mt-1.5 font-medium">
                        {checkoutCouponError}
                      </p>
                    )}
                  </div>

                  {/* ═══ DRIVER TIP SELECTOR ═══ */}
                  <div className="py-3.5 border-t border-[#F0E6D8]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#6B5E53] flex items-center gap-1.5">
                        <Gift size={13} className="text-[#7A0B10]" />
                        <span>Driver Tip</span>
                      </label>
                      {c.tip > 0 && (
                        <span className="text-xs font-bold text-[#7A0B10]">
                          +{formatCurrency(c.tip, c.restaurant?.currency)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 5].map((amt) => {
                        const active = c.tip === amt && !isCustomTipActive;
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleSelectTipAmount(amt)}
                            className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              active
                                ? 'bg-[#7A0B10] text-white border-[#7A0B10] shadow-xs'
                                : 'bg-[#FDFBF8] text-[#1A1A1A] border-[#E4D9C8] hover:border-[#D0C2B0]'
                            }`}
                          >
                            ${amt}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomTipActive(true);
                          setCustomTipInput('');
                        }}
                        className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          isCustomTipActive
                            ? 'bg-[#7A0B10] text-white border-[#7A0B10]'
                            : 'bg-[#FDFBF8] text-[#1A1A1A] border-[#E4D9C8] hover:border-[#D0C2B0]'
                        }`}
                      >
                        Custom
                      </button>
                    </div>

                    {isCustomTipActive && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 text-xs font-bold text-[#6B5E53]">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={customTipInput}
                            onChange={(e) => handleCustomTipChange(e.target.value)}
                            placeholder="Enter tip"
                            className="w-full h-8 rounded-lg border border-[#E4D9C8] bg-white pl-6 pr-2 text-xs font-bold text-[#1A1A1A] focus:outline-none focus:border-[#7A0B10]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectTipAmount(0)}
                          className="text-xs text-[#6B5E53] hover:text-[#1A1A1A] underline cursor-pointer"
                        >
                          No Tip
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ═══ BILL BREAKDOWN ═══ */}
                  <div className="py-4 border-t border-[#F0E6D8] space-y-2 text-xs">
                    <div className="flex justify-between text-[#6B5E53]">
                      <span>Item Total ({c.itemCount} items)</span>
                      <span className="font-bold text-[#1A1A1A]">
                        {formatCurrency(c.subtotal, c.restaurant?.currency)}
                      </span>
                    </div>

                    {c.orderType === 'delivery' && (
                      <div className="flex justify-between text-[#6B5E53]">
                        <span>Delivery Fee</span>
                        <span className="font-bold text-[#1A1A1A]">
                          {c.quoteLoading
                            ? 'Calculating...'
                            : c.deliveryFee === 0
                            ? 'FREE'
                            : formatCurrency(c.deliveryFee, c.restaurant?.currency)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#6B5E53]">
                      <span>Taxes &amp; Fees</span>
                      <span className="font-bold text-[#1A1A1A]">
                        {formatCurrency(c.tax, c.restaurant?.currency)}
                      </span>
                    </div>

                    {c.serviceFee > 0 && (
                      <div className="flex justify-between text-[#6B5E53]">
                        <span>Service Fee</span>
                        <span className="font-bold text-[#1A1A1A]">
                          {formatCurrency(c.serviceFee, c.restaurant?.currency)}
                        </span>
                      </div>
                    )}

                    {c.packagingFee > 0 && (
                      <div className="flex justify-between text-[#6B5E53]">
                        <span>Packaging Fee</span>
                        <span className="font-bold text-[#1A1A1A]">
                          {formatCurrency(c.packagingFee, c.restaurant?.currency)}
                        </span>
                      </div>
                    )}

                    {c.couponApplied && c.couponDiscount > 0 && (
                      <div className="flex justify-between text-[#16A34A] font-bold">
                        <span>Promo Discount</span>
                        <span>-{formatCurrency(c.couponDiscount, c.restaurant?.currency)}</span>
                      </div>
                    )}

                    {c.useLoyaltyPoints && c.loyaltyDiscount > 0 && (
                      <div className="flex justify-between text-[#856404] font-bold">
                        <span>Loyalty Points Discount</span>
                        <span>-{formatCurrency(c.loyaltyDiscount, c.restaurant?.currency)}</span>
                      </div>
                    )}

                    {c.tip > 0 && (
                      <div className="flex justify-between text-[#6B5E53]">
                        <span>Driver Tip</span>
                        <span className="font-bold text-[#1A1A1A]">
                          {formatCurrency(c.tip, c.restaurant?.currency)}
                        </span>
                      </div>
                    )}

                    {/* Total Row */}
                    <div className="pt-3 border-t border-[#EAE0D3] flex justify-between items-baseline">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#6B5E53]">
                          Total Payable
                        </p>
                        <p className="text-[10px] text-[#8C7E72]">Includes all applicable taxes</p>
                      </div>
                      <span className="font-['Playfair_Display'] text-2xl font-black text-[#7A0B10]">
                        {formatCurrency(c.total, c.restaurant?.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Place Order CTA Button */}
                  <div className="pt-4 border-t border-[#F0E6D8]">
                    {isClosed && c.deliveryTimeOption !== 'scheduled' ? (
                      <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B] font-semibold text-center mb-3">
                        Restaurant is currently closed. Please choose <strong>Schedule for Later</strong> to place an order in advance!
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={validateAndPlaceOrder}
                      disabled={c.isPlacingOrder || (isClosed && c.deliveryTimeOption !== 'scheduled')}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#7A0B10] via-[#5C0612] to-[#4A090B] hover:from-[#5C0612] hover:to-[#7A0B10] text-white font-bold text-sm shadow-[0_8px_24px_rgba(122,11,16,0.35)] flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
                    >
                      {c.isPlacingOrder ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Processing Order...</span>
                        </>
                      ) : (
                        <>
                          <Lock size={15} strokeWidth={2.4} />
                          <span>Place Order ({formatCurrency(c.total, c.restaurant?.currency)})</span>
                          <ArrowRight size={16} strokeWidth={2.4} />
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-[#8C7E72] text-center mt-3 leading-tight">
                      By placing this order, you agree to Lassi Lounge's{' '}
                      <Link href="/terms" className="underline font-semibold text-[#1A1A1A]">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy-policy" className="underline font-semibold text-[#1A1A1A]">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                {/* ═══ TRUST BADGES CARD ═══ */}
                <div className="bg-[#FAF5EC] rounded-2xl border border-[#E8DCCB] p-5 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FCEAE6] text-[#7A0B10] flex items-center justify-center shrink-0">
                      <ShieldCheck size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A]">
                        Safe &amp; Secure Payment
                      </h4>
                      <p className="text-xs text-[#6B5E53]">100% Encrypted Checkout</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FCEAE6] text-[#7A0B10] flex items-center justify-center shrink-0">
                      <Bike size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A]">
                        Fast &amp; Reliable Delivery
                      </h4>
                      <p className="text-xs text-[#6B5E53]">Hot and fresh to your doorstep</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FCEAE6] text-[#7A0B10] flex items-center justify-center shrink-0">
                      <Star size={20} strokeWidth={2.2} fill="currentColor" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A]">
                        Royal Authentic Taste
                      </h4>
                      <p className="text-xs text-[#6B5E53]">Finest traditional North Indian recipes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          4. STICKY MOBILE PLACE ORDER BOTTOM BAR (Fixed on < md)
         ═══════════════════════════════════════════════════════════════════ */}
      {c.itemCount > 0 && (!isClosed || c.deliveryTimeOption === 'scheduled') && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-[90] bg-[#FFFDF9]/98 backdrop-blur-md border-t border-[#E5D4C0] px-4 py-3 shadow-[0_-8px_24px_rgba(40,10,10,0.14)] flex items-center justify-between gap-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#7A6455]">
              Total Payable ({c.itemCount} {c.itemCount === 1 ? 'item' : 'items'})
            </p>
            <p className="text-lg font-black text-[#7A0B10] leading-tight font-['Playfair_Display']">
              {formatCurrency(c.total, c.restaurant?.currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={validateAndPlaceOrder}
            disabled={c.isPlacingOrder}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#7A0B10] via-[#5C0612] to-[#4A090B] text-white font-bold text-xs shadow-[0_6px_18px_rgba(122,11,16,0.35)] flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-60 cursor-pointer"
          >
            {c.isPlacingOrder ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Lock size={14} strokeWidth={2.4} />
                <span>Place Order</span>
                <ArrowRight size={15} strokeWidth={2.4} />
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          5. MODALS
         ═══════════════════════════════════════════════════════════════════ */}
      {/* Map Address Picker Modal */}
      {isAddressModalOpen && (
        <LassiAddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          onSelect={(locationData) => {
            const { address, lat, lng, addressDetails } = locationData || {};
            if (address) {
              c.setAddressLine1(address);
              if (addressDetails?.city) c.setCity(addressDetails.city);
              if (addressDetails?.state) c.setState(addressDetails.state.substring(0, 2).toUpperCase());
              if (addressDetails?.postcode) c.setZipCode(addressDetails.postcode.substring(0, 5));
              c.handleSelectSuggestion({
                display_name: address,
                lat: String(lat || 40.6908),
                lon: String(lng || -73.8271),
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
        specialInstructions={specialInstructions}
        isPlacingOrder={c.isPlacingOrder}
      />

      {/* Payment Simulator Modal */}
      <PaymentSimulatorModal
        isOpen={c.showPaymentModal}
        onClose={() => c.setShowPaymentModal(false)}
        amount={c.total}
        checkoutData={c.checkoutPayload}
        onSuccess={c.executeOrderCreation}
      />

      <style jsx global>{`
        .lassi-phone-wrap .PhoneInputInput {
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: #1A1A1A;
          height: 100%;
          width: 100%;
        }
        .lassi-phone-wrap .PhoneInputCountry {
          margin-right: 6px;
        }
      `}</style>
    </div>
  );
}
