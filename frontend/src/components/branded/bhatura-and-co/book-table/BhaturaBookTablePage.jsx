'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Users,
  User,
  Phone,
  FileText,
  ChevronDown,
  ArrowRight,
  Check,
  CheckCircle2,
  Utensils,
  PartyPopper,
  Wine,
  CalendarDays,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import BhaturaHeader from '../BhaturaHeader';
import BhaturaFooter from '../BhaturaFooter';
import AddressModal from '@/components/shared/AddressModal';
import { restaurantAPI, reservationAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co';
const IMG = '/assets/images/branded/bhatura-and-co';

const TIME_SLOTS = [
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '5:00 PM',
  '5:30 PM',
  '6:00 PM',
  '6:30 PM',
  '7:00 PM',
  '7:30 PM',
  '8:00 PM',
  '8:30 PM',
  '9:00 PM',
  '9:30 PM',
];

const GUEST_OPTIONS = [
  '1 Guest',
  '2 Guests',
  '3 Guests',
  '4 Guests',
  '5 Guests',
  '6 Guests',
  '7 Guests',
  '8 Guests',
  '9+ Guests (Large Party)',
];

/* ── Traditional Indian Mandala Watermark for Corner Decoration ── */
const MandalaCorner = ({ className = '' }) => (
  <svg
    viewBox="0 0 200 200"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="20" cy="180" r="160" stroke="#C99158" strokeWidth="1.2" strokeDasharray="3 3" />
    <circle cx="20" cy="180" r="130" stroke="#C99158" strokeWidth="1.4" />
    <circle cx="20" cy="180" r="100" stroke="#C99158" strokeWidth="1" strokeDasharray="2 2" />
    <circle cx="20" cy="180" r="70" stroke="#C99158" strokeWidth="1.2" />
    <circle cx="20" cy="180" r="40" stroke="#C99158" strokeWidth="1.4" />
    <path
      d="M20 20 C60 60 140 140 180 180 M20 60 C80 100 120 140 140 180 M60 20 C100 80 140 120 180 140"
      stroke="#C99158"
      strokeWidth="0.8"
    />
    <path
      d="M20 180 Q80 120 100 80 Q120 120 180 180"
      stroke="#C99158"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

export default function BhaturaBookTablePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [realRestaurantId, setRealRestaurantId] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: todayStr,
    time: '7:00 PM',
    guests: '4 Guests',
    specialRequest: '',
  });
  const [errors, setErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Load restaurant details from backend
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await restaurantAPI.getById(RESTAURANT_ID);
        if (!alive) return;
        const data = res?.data;
        if (data) {
          setRestaurant(data);
          if (data._id) setRealRestaurantId(data._id);
        }
      } catch (e) {
        console.error('Failed to load restaurant info for table reservation:', e);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your full name';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter your mobile number';
    } else if (cleanPhone.length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a reservation date';
    } else if (formData.date < todayStr) {
      newErrors.date = 'Please select today or a future date';
    }

    if (!formData.time) {
      newErrors.time = 'Please select a dining time slot';
    }

    if (!formData.guests) {
      newErrors.guests = 'Please select number of guests';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }
    setErrors({});

    const partySizeNum = parseInt(formData.guests, 10) || 2;

    try {
      setSubmitting(true);

      const targetRestaurantId = realRestaurantId || restaurant?._id || RESTAURANT_ID;

      const payload = {
        restaurantId: targetRestaurantId,
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        customerEmail: user?.email || '',
        date: formData.date,
        time: formData.time,
        partySize: partySizeNum,
        location: 'Indoor Dining',
        occasion: formData.specialRequest?.toLowerCase().includes('birthday')
          ? 'Birthday'
          : formData.specialRequest?.toLowerCase().includes('anniversary')
          ? 'Anniversary'
          : 'Dine In',
        specialRequests: formData.specialRequest.trim(),
      };

      const res = await reservationAPI.create(payload);

      if (res?.success || res?.data) {
        const booked = res?.data || {
          ...payload,
          _id: `RES-${Date.now().toString().slice(-6)}`,
        };
        setConfirmedReservation(booked);
        toast.success('Table reserved successfully! 🎉', { duration: 3000 });
      } else {
        toast.error(res?.message || 'Could not complete reservation. Please try again.');
      }
    } catch (err) {
      console.error('Reservation submission error:', err);
      toast.error(err?.message || 'Something went wrong while booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8EE] text-[#1C1917] flex flex-col selection:bg-[#D4AF37]/30 selection:text-[#5C0612]">
      {/* ═══ 1. FLOATING HEADER ═══ */}
      <BhaturaHeader onOpenAddressModal={() => setIsAddressModalOpen(true)} />

      <main className="flex-1">
        {/* ═══ 2. LUXURY HERO BANNER ═══ */}
        <section className="relative overflow-hidden bg-[#160B06] min-h-[460px] sm:min-h-[490px] lg:min-h-[520px] pt-8 sm:pt-10 pb-28 sm:pb-32 lg:pb-36 flex items-start">
          <Image
            src={`${IMG}/book_table_hero.jpg`}
            alt="Fine dining restaurant ambience at Bhatura & Co"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_35%]"
          />

          {/* Deep atmospheric gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 via-45% to-black/35" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* Hero Content positioned at top-left exactly matching 1st UI image */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-3 sm:pt-5">
            <div className="max-w-xl">
              <span className="text-xs sm:text-sm font-bold text-[#F5B53D] tracking-[0.2em] uppercase">
                BOOK A TABLE
              </span>
              <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-[54px] font-black leading-[1.08] text-white mt-2 mb-3.5 drop-shadow-md">
                Good Food<br />
                Brings People Together
              </h1>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-lg">
                Reserve your table and enjoy an authentic North Indian dining experience at Bhatura&amp;Co. Great food tastes even better when shared.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 3. MAIN RESERVATION CONTAINER (OVERLAPPING DIRECTLY ON HERO BACKGROUND) ═══ */}
        <section className="relative -mt-16 sm:-mt-20 lg:-mt-24 z-20 pb-12 sm:pb-16 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#FFFDF9] rounded-[28px] sm:rounded-[34px] border border-[#ECDCC8] shadow-[0_20px_50px_rgba(0,0,0,0.22)] p-5 sm:p-7 lg:p-9">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
                
                {/* ── LEFT: FORM & HEADER ── */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  {/* Header Row */}
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#8B1E1E] uppercase tracking-[0.18em]">
                        MAKE A RESERVATION
                      </span>
                      <span className="w-12 h-[1.8px] bg-[#8B1E1E]" />
                    </div>

                    <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-[42px] font-black mt-1 leading-tight">
                      <span className="text-[#8B1E1E]">Book Your </span>
                      <span className="text-[#1C1917]">Table</span>
                    </h2>

                    <p className="text-xs sm:text-sm text-[#78716C] mt-1 mb-5">
                      Fill in the details below and we&apos;ll confirm your reservation.
                    </p>

                    {/* Form Fields with noValidate & Industry-level validation UX */}
                    <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* 1. Full Name */}
                        <div>
                          <label className="block text-xs font-bold text-[#1C1917] mb-1">
                            Full Name <span className="text-[#8B1E1E]">*</span>
                          </label>
                          <div
                            className={`flex items-center h-11 rounded-lg border bg-white px-3 transition-all ${
                              errors.name
                                ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
                                : 'border-[#E3D4C2] focus-within:border-[#8B1E1E] focus-within:ring-1 focus-within:ring-[#8B1E1E]'
                            }`}
                          >
                            <User size={16} className={`shrink-0 mr-2 transition-colors ${errors.name ? 'text-red-500' : 'text-[#9C8F80]'}`} />
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              placeholder="Enter your full name"
                              className="w-full bg-transparent text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A89F91] focus:outline-none"
                            />
                          </div>
                          {errors.name && (
                            <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                              <AlertCircle size={13} className="shrink-0 text-red-500" />
                              <span>{errors.name}</span>
                            </p>
                          )}
                        </div>

                        {/* 2. Mobile Number */}
                        <div>
                          <label className="block text-xs font-bold text-[#1C1917] mb-1">
                            Mobile Number <span className="text-[#8B1E1E]">*</span>
                          </label>
                          <div
                            className={`flex items-center h-11 rounded-lg border bg-white px-3 transition-all ${
                              errors.phone
                                ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
                                : 'border-[#E3D4C2] focus-within:border-[#8B1E1E] focus-within:ring-1 focus-within:ring-[#8B1E1E]'
                            }`}
                          >
                            <Phone size={16} className={`shrink-0 mr-1.5 transition-colors ${errors.phone ? 'text-red-500' : 'text-[#9C8F80]'}`} />
                            <span className="flex items-center gap-1 pr-2 mr-2 border-r border-[#E3D4C2] text-xs font-semibold text-[#1C1917] shrink-0">
                              <span className="text-sm leading-none">🇺🇸</span>
                              <span>+1</span>
                            </span>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="Enter mobile number"
                              className="w-full bg-transparent text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A89F91] focus:outline-none"
                            />
                          </div>
                          {errors.phone && (
                            <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                              <AlertCircle size={13} className="shrink-0 text-red-500" />
                              <span>{errors.phone}</span>
                            </p>
                          )}
                        </div>

                        {/* 3. Date */}
                        <div>
                          <label className="block text-xs font-bold text-[#1C1917] mb-1">
                            Date <span className="text-[#8B1E1E]">*</span>
                          </label>
                          <div
                            className={`flex items-center h-11 rounded-lg border bg-white px-3 transition-all relative ${
                              errors.date
                                ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
                                : 'border-[#E3D4C2] focus-within:border-[#8B1E1E] focus-within:ring-1 focus-within:ring-[#8B1E1E]'
                            }`}
                          >
                            <Calendar size={16} className={`shrink-0 mr-2 transition-colors ${errors.date ? 'text-red-500' : 'text-[#9C8F80]'}`} />
                            <input
                              type="date"
                              name="date"
                              min={todayStr}
                              value={formData.date}
                              onChange={handleChange}
                              className="w-full bg-transparent text-xs sm:text-sm text-[#1C1917] focus:outline-none cursor-pointer"
                            />
                            <CalendarDays size={14} className="text-[#9C8F80] shrink-0 pointer-events-none absolute right-2.5" />
                          </div>
                          {errors.date && (
                            <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                              <AlertCircle size={13} className="shrink-0 text-red-500" />
                              <span>{errors.date}</span>
                            </p>
                          )}
                        </div>

                        {/* 4. Time */}
                        <div>
                          <label className="block text-xs font-bold text-[#1C1917] mb-1">
                            Time <span className="text-[#8B1E1E]">*</span>
                          </label>
                          <div
                            className={`flex items-center h-11 rounded-lg border bg-white px-3 transition-all relative ${
                              errors.time
                                ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
                                : 'border-[#E3D4C2] focus-within:border-[#8B1E1E] focus-within:ring-1 focus-within:ring-[#8B1E1E]'
                            }`}
                          >
                            <Clock size={16} className={`shrink-0 mr-2 transition-colors ${errors.time ? 'text-red-500' : 'text-[#9C8F80]'}`} />
                            <select
                              name="time"
                              value={formData.time}
                              onChange={handleChange}
                              className="w-full bg-transparent text-xs sm:text-sm text-[#1C1917] focus:outline-none appearance-none cursor-pointer pr-5"
                            >
                              {TIME_SLOTS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="text-[#9C8F80] shrink-0 pointer-events-none absolute right-2.5" />
                          </div>
                          {errors.time && (
                            <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                              <AlertCircle size={13} className="shrink-0 text-red-500" />
                              <span>{errors.time}</span>
                            </p>
                          )}
                        </div>

                        {/* 5. Number of Guests */}
                        <div>
                          <label className="block text-xs font-bold text-[#1C1917] mb-1">
                            Number of Guests <span className="text-[#8B1E1E]">*</span>
                          </label>
                          <div
                            className={`flex items-center h-11 rounded-lg border bg-white px-3 transition-all relative ${
                              errors.guests
                                ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
                                : 'border-[#E3D4C2] focus-within:border-[#8B1E1E] focus-within:ring-1 focus-within:ring-[#8B1E1E]'
                            }`}
                          >
                            <Users size={16} className={`shrink-0 mr-2 transition-colors ${errors.guests ? 'text-red-500' : 'text-[#9C8F80]'}`} />
                            <select
                              name="guests"
                              value={formData.guests}
                              onChange={handleChange}
                              className="w-full bg-transparent text-xs sm:text-sm text-[#1C1917] focus:outline-none appearance-none cursor-pointer pr-5"
                            >
                              {GUEST_OPTIONS.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="text-[#9C8F80] shrink-0 pointer-events-none absolute right-2.5" />
                          </div>
                          {errors.guests && (
                            <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                              <AlertCircle size={13} className="shrink-0 text-red-500" />
                              <span>{errors.guests}</span>
                            </p>
                          )}
                        </div>

                        {/* 6. Special Request */}
                        <div>
                          <label className="block text-xs font-bold text-[#1C1917] mb-1">
                            Special Request (Optional)
                          </label>
                          <div className="flex items-center h-11 rounded-lg border border-[#E3D4C2] bg-white px-3 focus-within:border-[#8B1E1E] focus-within:ring-1 focus-within:ring-[#8B1E1E] transition-all">
                            <FileText size={16} className="text-[#9C8F80] shrink-0 mr-2" />
                            <input
                              type="text"
                              name="specialRequest"
                              value={formData.specialRequest}
                              onChange={handleChange}
                              placeholder="e.g. Birthday, High Chair, Dietary Preference"
                              className="w-full bg-transparent text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A89F91] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Reserve My Table CTA Button */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full mt-2 h-11 sm:h-12 rounded-lg bg-[#9E141D] hover:bg-[#830F16] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(158,20,29,0.30)] transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Confirming Reservation…</span>
                          </>
                        ) : (
                          <>
                            <Calendar size={18} />
                            <span>Reserve My Table</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>

                      {/* Trust Confirmation Line */}
                      <div className="flex items-center justify-center gap-1.5 pt-1 text-xs font-medium text-[#44403C]">
                        <span className="w-4 h-4 rounded-full bg-[#8B1E1E]/10 text-[#8B1E1E] flex items-center justify-center shrink-0">
                          <Check size={11} strokeWidth={3} />
                        </span>
                        <span>We will confirm your reservation via call or WhatsApp</span>
                      </div>
                    </form>
                  </div>
                </div>

                {/* ── RIGHT: 4 BADGES ROW + DINING COLLAGE ── */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  {/* Top 4 Circular Badges Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-4">
                    {/* Badge 1 */}
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 rounded-full border-2 border-[#E5A866] bg-white text-[#C0262D] flex items-center justify-center shrink-0 shadow-2xs">
                        <Utensils size={16} />
                      </span>
                      <div className="leading-tight">
                        <span className="block text-xs font-bold text-[#1C1917]">Authentic</span>
                        <span className="block text-[11px] text-[#78716C]">Indian Dining</span>
                      </div>
                    </div>

                    {/* Badge 2 */}
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 rounded-full border-2 border-[#E5A866] bg-white text-[#C0262D] flex items-center justify-center shrink-0 shadow-2xs">
                        <Users size={16} />
                      </span>
                      <div className="leading-tight">
                        <span className="block text-xs font-bold text-[#1C1917]">Perfect for</span>
                        <span className="block text-[11px] text-[#78716C]">Family &amp; Friends</span>
                      </div>
                    </div>

                    {/* Badge 3 */}
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 rounded-full border-2 border-[#E5A866] bg-white text-[#C0262D] flex items-center justify-center shrink-0 shadow-2xs">
                        <PartyPopper size={16} />
                      </span>
                      <div className="leading-tight">
                        <span className="block text-xs font-bold text-[#1C1917]">Birthdays</span>
                        <span className="block text-[11px] text-[#78716C]">&amp; Special Occasions</span>
                      </div>
                    </div>

                    {/* Badge 4 */}
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 rounded-full border-2 border-[#E5A866] bg-white text-[#C0262D] flex items-center justify-center shrink-0 shadow-2xs">
                        <Wine size={16} />
                      </span>
                      <div className="leading-tight">
                        <span className="block text-xs font-bold text-[#1C1917]">Warm &amp;</span>
                        <span className="block text-[11px] text-[#78716C]">Welcoming Ambience</span>
                      </div>
                    </div>
                  </div>

                  {/* Collage Grid: Left Large + Right 2 Stacked */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    {/* Main Large Image */}
                    <div className="sm:col-span-7 relative rounded-2xl overflow-hidden h-[340px] sm:h-[390px] group shadow-xs border border-[#EFE2D2]">
                      <Image
                        src={`${IMG}/book_table_main.jpg`}
                        alt="Dine In Good Company at Bhatura & Co"
                        fill
                        sizes="(min-width: 1024px) 35vw, 100vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 via-50% to-transparent" />

                      {/* Overlay Tagline */}
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <p className="font-['Dancing_Script',cursive] text-3xl sm:text-4xl text-[#F5B53D] font-bold leading-tight drop-shadow">
                          Dine In<br />Good Company
                        </p>
                        <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-[240px] leading-snug drop-shadow-sm">
                          Authentic flavours, warm ambience and memorable moments.
                        </p>
                      </div>
                    </div>

                    {/* Two Stacked Images */}
                    <div className="sm:col-span-5 grid grid-cols-2 sm:flex sm:flex-col gap-3.5 h-[170px] sm:h-[390px]">
                      {/* Top image: Long Banquet Table */}
                      <div className="relative flex-1 rounded-2xl overflow-hidden group shadow-xs border border-[#EFE2D2]">
                        <Image
                          src={`${IMG}/book_table_long_table.jpg`}
                          alt="Long banquet table for group celebrations"
                          fill
                          sizes="(min-width: 1024px) 20vw, 50vw"
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                      </div>

                      {/* Bottom image: Cozy Booth with Golden Arch */}
                      <div className="relative flex-1 rounded-2xl overflow-hidden group shadow-xs border border-[#EFE2D2]">
                        <Image
                          src={`${IMG}/book_table_cozy_booth.jpg`}
                          alt="Cozy dining booth with golden jali arches"
                          fill
                          sizes="(min-width: 1024px) 20vw, 50vw"
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ═══ 4. PERFECT PLACE FOR EVERY OCCASION (WITH MANDALA CORNER ORNAMENTS) ═══ */}
        <section className="bg-[#FAF2E5] border-t border-[#EBDBC7] py-8 sm:py-10 relative overflow-hidden">
          {/* Subtle Traditional Corner Watermarks */}
          <div className="absolute left-[-20px] bottom-[-20px] w-48 h-48 pointer-events-none opacity-25">
            <MandalaCorner className="w-full h-full" />
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 pointer-events-none opacity-25 -scale-x-100">
            <MandalaCorner className="w-full h-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Headline */}
              <div className="lg:col-span-3">
                <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-black text-[#1C1917] leading-tight">
                  <span className="text-[#1C1917]">Perfect Place</span><br />
                  <span className="text-[#8B1E1E]">for Every Occasion</span>
                </h2>
              </div>

              {/* Right 4 Occasion Cards */}
              <div className="lg:col-span-9 grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {/* 1. Family Gatherings */}
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full border-2 border-[#E5A866] bg-white text-[#C0262D] flex items-center justify-center shrink-0 shadow-2xs">
                    <Users size={18} />
                  </span>
                  <div>
                    <h3 className="font-['Playfair_Display'] text-xs sm:text-sm font-bold text-[#1C1917] leading-tight">Family Gatherings</h3>
                    <p className="text-[11px] sm:text-xs text-[#78716C] mt-0.5 leading-snug">Create special moments with your loved ones</p>
                  </div>
                </div>

                {/* 2. Birthdays & Anniversaries */}
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full border-2 border-[#E5A866] bg-white text-[#C0262D] flex items-center justify-center shrink-0 shadow-2xs">
                    <PartyPopper size={18} />
                  </span>
                  <div>
                    <h3 className="font-['Playfair_Display'] text-xs sm:text-sm font-bold text-[#1C1917] leading-tight">Birthdays &amp; Anniversaries</h3>
                    <p className="text-[11px] sm:text-xs text-[#78716C] mt-0.5 leading-snug">Make your celebrations more special</p>
                  </div>
                </div>

                {/* 3. Corporate Meetings */}
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full border-2 border-[#E5A866] bg-white text-[#C0262D] flex items-center justify-center shrink-0 shadow-2xs">
                    <Users size={18} />
                  </span>
                  <div>
                    <h3 className="font-['Playfair_Display'] text-xs sm:text-sm font-bold text-[#1C1917] leading-tight">Corporate Meetings</h3>
                    <p className="text-[11px] sm:text-xs text-[#78716C] mt-0.5 leading-snug">Ideal for business lunches and team gatherings</p>
                  </div>
                </div>

                {/* 4. Special Occasions */}
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full border-2 border-[#E5A866] bg-white text-[#C0262D] flex items-center justify-center shrink-0 shadow-2xs">
                    <Wine size={18} />
                  </span>
                  <div>
                    <h3 className="font-['Playfair_Display'] text-xs sm:text-sm font-bold text-[#1C1917] leading-tight">Special Occasions</h3>
                    <p className="text-[11px] sm:text-xs text-[#78716C] mt-0.5 leading-snug">Authentic food and warm hospitality</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* ═══ 5. FOOTER ═══ */}
      <BhaturaFooter />

      {/* ═══ 6. CONFIRMATION SUCCESS MODAL ═══ */}
      {confirmedReservation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#FFFDF8] rounded-3xl p-6 sm:p-8 border border-[#ECDCC8] shadow-[0_20px_50px_rgba(92,6,18,0.3)] text-center animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setConfirmedReservation(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#78716C] transition"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto mb-4 border border-[#16A34A]/20">
              <CheckCircle2 size={36} />
            </div>

            <span className="text-xs font-bold text-[#F5B53D] tracking-[0.2em] uppercase">
              RESERVATION REQUEST CONFIRMED
            </span>
            <h3 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-black text-[#8B1E1E] mt-1 mb-2">
              We&apos;re Excited to Host You!
            </h3>
            <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed mb-6">
              Thank you, <strong className="text-[#1C1917]">{confirmedReservation.customerName}</strong>! Your table reservation request has been received. Our team will reach out via call or WhatsApp at <strong className="text-[#1C1917]">{confirmedReservation.customerPhone}</strong> to confirm.
            </p>

            <div className="bg-[#FAF2E6] rounded-2xl p-4 text-left border border-[#EEDECB] space-y-2 mb-6 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-[#78716C]">Date:</span>
                <span className="font-bold text-[#1C1917]">{confirmedReservation.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Time Slot:</span>
                <span className="font-bold text-[#1C1917]">{confirmedReservation.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Guests:</span>
                <span className="font-bold text-[#1C1917]">{confirmedReservation.partySize} Person(s)</span>
              </div>
              {confirmedReservation.specialRequests && (
                <div className="flex justify-between pt-1 border-t border-[#E3D4C2]">
                  <span className="text-[#78716C]">Notes:</span>
                  <span className="font-medium text-[#1C1917] truncate max-w-[200px]">{confirmedReservation.specialRequests}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setConfirmedReservation(null)}
                className="flex-1 h-11 rounded-lg border border-[#8B1E1E] text-[#8B1E1E] font-bold text-sm hover:bg-[#8B1E1E] hover:text-white transition"
              >
                Close
              </button>
              <Link
                href="/menu"
                className="flex-1 h-11 rounded-lg bg-[#9E141D] hover:bg-[#830F16] text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow hover:brightness-110 transition"
              >
                <span>View Menu</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 7. ADDRESS MODAL ═══ */}
      {isAddressModalOpen && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          onSelectAddress={() => setIsAddressModalOpen(false)}
        />
      )}
    </div>
  );
}
