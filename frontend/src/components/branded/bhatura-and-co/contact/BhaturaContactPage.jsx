'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  FileText,
  MessageSquareText,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Send,
  Car,
  TrainFront,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BhaturaHeader from '../BhaturaHeader';
import BhaturaFooter from '../BhaturaFooter';
import AddressModal from '@/components/shared/AddressModal';
import { restaurantAPI, contactAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co';
const IMG = '/assets/images/branded/bhatura-and-co';

// Default location from Lassi Lounge project (until New Jersey location is finalized)
const DEFAULT_LOCATION = {
  street: '9408 118th St',
  cityStateZip: 'South Richmond Hill, NY 11419',
  country: 'USA',
  fullAddress: '9408 118th St, South Richmond Hill, NY 11419, USA',
  mapQuery: '9408 118th St, South Richmond Hill, NY 11419',
  phoneDisplay: '+1 (347) 233-3733',
  phoneHref: 'tel:+13472333733',
  whatsappNumber: '13472333733',
  email: 'info@bhaturaandco.com',
  hoursDays: 'Monday - Sunday',
  hoursShortDays: 'Mon - Sun',
  hoursTime: '11:00 AM - 11:00 PM',
};

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Order & Delivery Support',
  'Table Reservation Inquiry',
  'Catering & Private Events',
  'Feedback & Suggestions',
  'Business Partnership',
];

/* ── Decorative Mandala Watermark for Section Edges ── */
const MandalaWatermark = ({ className = '' }) => (
  <svg
    viewBox="0 0 200 200"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="100" cy="100" r="92" stroke="#C99158" strokeWidth="1" strokeDasharray="3 3" />
    <circle cx="100" cy="100" r="76" stroke="#C99158" strokeWidth="1.2" />
    <circle cx="100" cy="100" r="60" stroke="#C99158" strokeWidth="0.9" strokeDasharray="2 2" />
    <circle cx="100" cy="100" r="44" stroke="#C99158" strokeWidth="1.1" />
    <circle cx="100" cy="100" r="26" stroke="#C99158" strokeWidth="1.2" />
    {Array.from({ length: 12 }).map((_, idx) => {
      const angle = idx * 30;
      return (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <path
            d="M100 8 Q108 32 100 56 Q92 32 100 8 Z"
            stroke="#C99158"
            strokeWidth="0.8"
            fill="none"
          />
        </g>
      );
    })}
  </svg>
);

/* ── US Flag SVG Icon for Phone Prefix ── */
const UsFlagIcon = () => (
  <svg
    viewBox="0 0 28 20"
    className="w-4 h-3 rounded-[2px] shrink-0 shadow-[0_0_1px_rgba(0,0,0,0.3)]"
     aria-hidden="true"
  >
    <rect width="28" height="20" fill="#B22234" />
    <path
      d="M0 3.07h28M0 6.15h28M0 9.23h28M0 12.3h28M0 15.38h28M0 18.46h28"
      stroke="#FFF"
      strokeWidth="1.54"
    />
    <rect width="11.2" height="10.77" fill="#3C3B6E" />
    <g fill="#FFF">
      <circle cx="2.2" cy="2.1" r="0.65" />
      <circle cx="4.5" cy="2.1" r="0.65" />
      <circle cx="6.8" cy="2.1" r="0.65" />
      <circle cx="9.1" cy="2.1" r="0.65" />
      <circle cx="3.3" cy="3.8" r="0.65" />
      <circle cx="5.6" cy="3.8" r="0.65" />
      <circle cx="7.9" cy="3.8" r="0.65" />
      <circle cx="2.2" cy="5.5" r="0.65" />
      <circle cx="4.5" cy="5.5" r="0.65" />
      <circle cx="6.8" cy="5.5" r="0.65" />
      <circle cx="9.1" cy="5.5" r="0.65" />
      <circle cx="3.3" cy="7.2" r="0.65" />
      <circle cx="5.6" cy="7.2" r="0.65" />
      <circle cx="7.9" cy="7.2" r="0.65" />
      <circle cx="2.2" cy="8.9" r="0.65" />
      <circle cx="4.5" cy="8.9" r="0.65" />
      <circle cx="6.8" cy="8.9" r="0.65" />
      <circle cx="9.1" cy="8.9" r="0.65" />
    </g>
  </svg>
);

export default function BhaturaContactPage() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [realRestaurantId, setRealRestaurantId] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Pre-fill user details when logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // Fetch active restaurant details (same working as Lassi Lounge)
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
        // Fallback silently to DEFAULT_LOCATION
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Derive display values (preferring Lassi Lounge location as requested)
  const rawAddress = restaurant?.address || DEFAULT_LOCATION.fullAddress;
  const addressParts = rawAddress.split(',').map((s) => s.trim());
  const streetLine = addressParts[0] || DEFAULT_LOCATION.street;
  const cityStateLine =
    addressParts.length > 1
      ? addressParts.slice(1).join(', ').replace(/,\s*USA$/i, '')
      : DEFAULT_LOCATION.cityStateZip;
  const fullDisplayAddress = `${streetLine}, ${cityStateLine}, USA`;
  const mapQuery = rawAddress || DEFAULT_LOCATION.mapQuery;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;

  const phoneDisplay = restaurant?.phone || DEFAULT_LOCATION.phoneDisplay;
  const phoneHref = `tel:${phoneDisplay.replace(/[^\d+]/g, '')}`;
  const emailDisplay = DEFAULT_LOCATION.email;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (submittedSuccess) setSubmittedSuccess(false);
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select an inquiry subject';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please type your message';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }
    setErrors({});

    try {
      setSubmitting(true);
      const formattedPhone = formData.phone.trim().startsWith('+')
        ? formData.phone.trim()
        : `+1 ${formData.phone.trim()}`;

      const payload = {
        restaurantId: realRestaurantId || restaurant?._id || RESTAURANT_ID,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formattedPhone,
        subject: formData.subject,
        message: formData.message.trim(),
      };

      const res = await contactAPI.submit(payload);

      if (res?.success || res?.data) {
        toast.success("Your message has been sent! We'll get back to you soon.", {
          duration: 3500,
        });
        setSubmittedSuccess(true);
        setFormData((prev) => ({
          ...prev,
          subject: '',
          message: '',
        }));
      } else {
        toast.error(res?.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Contact form submission error:', err);
      toast.error(err?.message || 'An error occurred while sending your message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF3E8] text-[#1C1917] flex flex-col selection:bg-[#D4AF37]/30 selection:text-[#5C0612]">
      {/* ═══ 1. HEADER ═══ */}
      <BhaturaHeader onOpenAddressModal={() => setIsAddressModalOpen(true)} />

      <main className="flex-1">
        {/* ═══ 2. HERO BANNER ═══ */}
        <section className="relative overflow-hidden bg-[#180A05] min-h-[300px] sm:min-h-[360px] lg:min-h-[410px] flex items-center">
          <Image
            src={`${IMG}/contact_hero_bg.jpg`}
            alt="Authentic Chole Bhature platter at Bhatura & Co"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          {/* Soft atmospheric gradient on the left so text stays ultra-legible while right dish pops */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 via-48% to-transparent" />

          {/* Hero Left Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 sm:py-12">
            <div className="max-w-xl">
              <span className="block text-xs sm:text-sm font-bold text-[#F5C253] tracking-[0.22em] uppercase">
                CONTACT US
              </span>

              <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-[54px] font-black leading-[1.08] mt-2 mb-3.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                <span className="text-white block">We&apos;d Love</span>
                <span className="text-[#F5C253] block mt-0.5">To Hear From You</span>
              </h1>

              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-md font-normal">
                Have a question, feedback or a special request?
                <br className="hidden sm:inline" /> We&apos;re here to help you with everything.
              </p>

              {/* Golden Ornamental Divider matching UI Reference */}
              <div className="flex items-center gap-2.5 mt-4 w-56 sm:w-64 text-[#E5B84B]">
                <span className="h-[1px] flex-1 bg-gradient-to-r from-[#E5B84B]/40 to-[#E5B84B]" />
                <svg
                  viewBox="0 0 36 14"
                  className="w-7 h-3 shrink-0 fill-none stroke-current"
                  strokeWidth="1.4"
                >
                  <polygon points="18,2 23,7 18,12 13,7" fill="currentColor" fillOpacity="0.25" />
                  <circle cx="9" cy="7" r="2" />
                  <circle cx="27" cy="7" r="2" />
                  <circle cx="4" cy="7" r="1" fill="currentColor" />
                  <circle cx="32" cy="7" r="1" fill="currentColor" />
                </svg>
                <span className="h-[1px] flex-1 bg-gradient-to-l from-[#E5B84B]/40 to-[#E5B84B]" />
              </div>
            </div>
          </div>

          {/* Smooth Curved Wave Transition at Bottom of Hero */}
          <div className="absolute -bottom-[1px] left-0 right-0 h-8 sm:h-10 lg:h-11 pointer-events-none z-10">
            <svg viewBox="0 0 1440 44" preserveAspectRatio="none" className="w-full h-full block">
              <path
                d="M0,26 C180,0 380,4 680,22 C940,37 1180,38 1440,10 L1440,44 L0,44 Z"
                fill="#FAF3E8"
              />
            </svg>
          </div>
        </section>

        {/* ═══ 3. TOP 4 CONTACT INFO CARDS STRIP ═══ */}
        <section className="relative bg-[#FAF3E8] pt-5 pb-7 border-b border-[#EBDDD0] overflow-hidden">
          {/* Subtle Mandala Watermarks on Left & Right */}
          <div className="hidden xl:block absolute -left-24 top-1/2 -translate-y-1/2 w-52 h-52 opacity-20 pointer-events-none">
            <MandalaWatermark className="w-full h-full" />
          </div>
          <div className="hidden xl:block absolute -right-24 top-1/2 -translate-y-1/2 w-52 h-52 opacity-20 pointer-events-none">
            <MandalaWatermark className="w-full h-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {/* Card 1: Our Location */}
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#EFE2D2] shadow-[0_6px_20px_rgba(92,6,18,0.05)] p-3.5 sm:p-5 flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3.5 hover:shadow-[0_10px_26px_rgba(139,30,30,0.09)] transition-shadow">
                <span className="w-12 h-12 rounded-full bg-[#9E141D] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(158,20,29,0.28)] ring-4 ring-[#9E141D]/10">
                  <MapPin size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-['Playfair_Display'] text-sm sm:text-[15px] font-bold text-[#1C1917] leading-snug">
                    Our Location
                  </h2>
                  <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
                    {streetLine}
                    <br />
                    {cityStateLine}
                    <br />
                    USA
                  </p>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#9E141D] hover:text-[#7A0F16] mt-1.5 group"
                  >
                    <span>Get Directions</span>
                    <ArrowRight
                      size={13}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </a>
                </div>
              </div>

              {/* Card 2: Call Us */}
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#EFE2D2] shadow-[0_6px_20px_rgba(92,6,18,0.05)] p-3.5 sm:p-5 flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3.5 hover:shadow-[0_10px_26px_rgba(139,30,30,0.09)] transition-shadow">
                <span className="w-12 h-12 rounded-full bg-[#9E141D] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(158,20,29,0.28)] ring-4 ring-[#9E141D]/10">
                  <Phone size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-['Playfair_Display'] text-sm sm:text-[15px] font-bold text-[#1C1917] leading-snug">
                    Call Us
                  </h2>
                  <a
                    href={phoneHref}
                    className="block text-sm sm:text-[15px] font-extrabold text-[#1C1917] hover:text-[#9E141D] transition-colors mt-1"
                  >
                    {phoneDisplay}
                  </a>
                  <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
                    {DEFAULT_LOCATION.hoursShortDays}
                    <br />
                    {DEFAULT_LOCATION.hoursTime}
                  </p>
                </div>
              </div>

              {/* Card 3: Email Us */}
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#EFE2D2] shadow-[0_6px_20px_rgba(92,6,18,0.05)] p-3.5 sm:p-5 flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3.5 hover:shadow-[0_10px_26px_rgba(139,30,30,0.09)] transition-shadow">
                <span className="w-12 h-12 rounded-full bg-[#9E141D] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(158,20,29,0.28)] ring-4 ring-[#9E141D]/10">
                  <Mail size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-['Playfair_Display'] text-sm sm:text-[15px] font-bold text-[#1C1917] leading-snug">
                    Email Us
                  </h2>
                  <a
                    href={`mailto:${emailDisplay}`}
                    className="block text-xs sm:text-[13px] font-bold text-[#1C1917] hover:text-[#9E141D] transition-colors mt-1 break-all"
                  >
                    {emailDisplay}
                  </a>
                  <p className="text-xs text-[#57534E] mt-1.5 leading-relaxed">
                    We usually respond
                    <br />
                    within 24 hours.
                  </p>
                </div>
              </div>

              {/* Card 4: Opening Hours */}
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#EFE2D2] shadow-[0_6px_20px_rgba(92,6,18,0.05)] p-3.5 sm:p-5 flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3.5 hover:shadow-[0_10px_26px_rgba(139,30,30,0.09)] transition-shadow">
                <span className="w-12 h-12 rounded-full bg-[#9E141D] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(158,20,29,0.28)] ring-4 ring-[#9E141D]/10">
                  <Clock size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-['Playfair_Display'] text-sm sm:text-[15px] font-bold text-[#1C1917] leading-snug">
                    Opening Hours
                  </h2>
                  <p className="text-xs sm:text-[13px] font-bold text-[#1C1917] mt-1">
                    {DEFAULT_LOCATION.hoursDays}
                  </p>
                  <p className="text-xs text-[#57534E] mt-1">
                    {DEFAULT_LOCATION.hoursTime}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 4. SEND US A MESSAGE ("Get In Touch") + INTERIOR PHOTO ═══ */}
        <section className="relative bg-[#FAF3E8] py-9 sm:py-11 border-b border-[#EBDDD0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              {/* ── Left Column: Contact Form (7 cols) ── */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  {/* Eyebrow */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#9E141D] uppercase tracking-[0.18em]">
                      SEND US A MESSAGE
                    </span>
                    <span className="w-12 h-[1.5px] bg-[#9E141D]/60" />
                  </div>

                  {/* Title */}
                  <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-[42px] font-black mt-1 leading-tight">
                    <span className="text-[#1C1917]">Get In </span>
                    <span className="text-[#9E141D]">Touch</span>
                  </h2>

                  <p className="text-xs sm:text-sm text-[#57534E] mt-1 mb-5">
                    Fill in the form below and we&apos;ll get back to you as soon as possible.
                  </p>

                  {/* Form with noValidate & Industry-level UX error feedback */}
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {/* Row 1: Full Name + Mobile Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                          Full Name <span className="text-[#9E141D]">*</span>
                        </label>
                        <div
                          className={`flex items-center h-11 rounded-lg border bg-white px-3.5 transition-all shadow-2xs ${
                            errors.name
                              ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
                              : 'border-[#E5D7C6] focus-within:border-[#9E141D] focus-within:ring-1 focus-within:ring-[#9E141D]'
                          }`}
                        >
                          <User size={16} className={`shrink-0 mr-2.5 transition-colors ${errors.name ? 'text-red-500' : 'text-[#8C8278]'}`} />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className="w-full bg-transparent text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none"
                          />
                        </div>
                        {errors.name && (
                          <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                            <AlertCircle size={13} className="shrink-0 text-red-500" />
                            <span>{errors.name}</span>
                          </p>
                        )}
                      </div>

                      {/* Mobile Number */}
                      <div>
                        <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                          Mobile Number <span className="text-[#9E141D]">*</span>
                        </label>
                        <div
                          className={`flex items-center h-11 rounded-lg border bg-white px-3.5 transition-all shadow-2xs ${
                            errors.phone
                              ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
                              : 'border-[#E5D7C6] focus-within:border-[#9E141D] focus-within:ring-1 focus-within:ring-[#9E141D]'
                          }`}
                        >
                          <Phone size={15} className={`shrink-0 mr-2 transition-colors ${errors.phone ? 'text-red-500' : 'text-[#8C8278]'}`} />
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mr-2 rounded bg-[#F6EFE6] border border-[#E6D8C7] text-xs font-semibold text-[#1C1917] shrink-0">
                            <UsFlagIcon />
                            <span>+1</span>
                          </span>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter mobile number"
                            className="w-full bg-transparent text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                            <AlertCircle size={13} className="shrink-0 text-red-500" />
                            <span>{errors.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Email Address + Subject */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Email Address */}
                      <div>
                        <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                          Email Address <span className="text-[#9E141D]">*</span>
                        </label>
                        <div
                          className={`flex items-center h-11 rounded-lg border bg-white px-3.5 transition-all shadow-2xs ${
                            errors.email
                              ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
                              : 'border-[#E5D7C6] focus-within:border-[#9E141D] focus-within:ring-1 focus-within:ring-[#9E141D]'
                          }`}
                        >
                          <Mail size={16} className={`shrink-0 mr-2.5 transition-colors ${errors.email ? 'text-red-500' : 'text-[#8C8278]'}`} />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email address"
                            className="w-full bg-transparent text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                            <AlertCircle size={13} className="shrink-0 text-red-500" />
                            <span>{errors.email}</span>
                          </p>
                        )}
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                          Subject <span className="text-[#9E141D]">*</span>
                        </label>
                        <div
                          className={`flex items-center h-11 rounded-lg border bg-white px-3.5 transition-all shadow-2xs relative ${
                            errors.subject
                              ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
                              : 'border-[#E5D7C6] focus-within:border-[#9E141D] focus-within:ring-1 focus-within:ring-[#9E141D]'
                          }`}
                        >
                          <FileText size={16} className={`shrink-0 mr-2.5 transition-colors ${errors.subject ? 'text-red-500' : 'text-[#8C8278]'}`} />
                          <select
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className={`w-full bg-transparent text-xs sm:text-sm focus:outline-none appearance-none cursor-pointer pr-6 ${
                              formData.subject ? 'text-[#1C1917]' : 'text-[#9CA3AF]'
                            }`}
                          >
                            <option value="" disabled>
                              Select subject
                            </option>
                            {SUBJECT_OPTIONS.map((subj) => (
                              <option key={subj} value={subj} className="text-[#1C1917]">
                                {subj}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={15}
                            className="text-[#8C8278] shrink-0 pointer-events-none absolute right-3"
                          />
                        </div>
                        {errors.subject && (
                          <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                            <AlertCircle size={13} className="shrink-0 text-red-500" />
                            <span>{errors.subject}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Message Textarea */}
                    <div>
                      <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                        Message <span className="text-[#9E141D]">*</span>
                      </label>
                      <div
                        className={`flex items-start rounded-lg border bg-white p-3.5 transition-all shadow-2xs ${
                          errors.message
                            ? 'border-red-500 bg-red-50/15 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30'
                            : 'border-[#E5D7C6] focus-within:border-[#9E141D] focus-within:ring-1 focus-within:ring-[#9E141D]'
                        }`}
                      >
                        <MessageSquareText
                          size={16}
                          className={`shrink-0 mr-2.5 mt-0.5 transition-colors ${errors.message ? 'text-red-500' : 'text-[#8C8278]'}`}
                        />
                        <textarea
                          name="message"
                          rows={4}
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Type your message here..."
                          className="w-full bg-transparent text-xs sm:text-sm text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none resize-y min-h-[92px]"
                        />
                      </div>
                      {errors.message && (
                        <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                          <AlertCircle size={13} className="shrink-0 text-red-500" />
                          <span>{errors.message}</span>
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 rounded-lg bg-gradient-to-r from-[#8E1118] via-[#A5151E] to-[#8E1118] hover:from-[#7A0D13] hover:to-[#690A10] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_6px_18px_rgba(158,20,29,0.28)] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Sending Message…</span>
                        </>
                      ) : (
                        <>
                          <Send size={17} className="-rotate-12" />
                          <span>Send Message</span>
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>

                    {/* Inline Confirmation Banner when sent */}
                    {submittedSuccess && (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#15803D] text-xs sm:text-sm font-semibold animate-in fade-in duration-200">
                        <CheckCircle2 size={17} className="shrink-0" />
                        <span>
                          Thank you! Your message has been received. Our team will respond within 24 hours.
                        </span>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* ── Right Column: Framed Luxury Dining Interior Photo (5 cols) ── */}
              <div className="lg:col-span-5">
                <div className="relative w-full h-full min-h-[360px] sm:min-h-[430px] rounded-2xl overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.18)] border border-[#E5D5C3] group bg-[#1A0D07]">
                  <Image
                    src={`${IMG}/contact_interior_card.jpg`}
                    alt="Good Food Good Company Always — Bhatura & Co Restaurant Interior"
                    fill
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 5. FIND US HERE (MAP) & VISIT OUR RESTAURANT ═══ */}
        <section className="relative bg-[#FAF3E8] py-9 sm:py-11 border-b border-[#EBDDD0] overflow-hidden">
          {/* Subtle Mandala Watermarks on Sides */}
          <div className="hidden xl:block absolute -right-20 top-10 w-56 h-56 opacity-20 pointer-events-none">
            <MandalaWatermark className="w-full h-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* ── Left Column: Find Us Here + Google Map (6 cols) ── */}
              <div className="lg:col-span-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-black">
                    <span className="text-[#1C1917]">Find Us </span>
                    <span className="text-[#9E141D]">Here</span>
                  </h2>
                  <span className="w-12 h-[1.5px] bg-[#9E141D]/60 mt-1" />
                </div>

                {/* Map Container */}
                <div className="relative rounded-2xl overflow-hidden border border-[#E6D7C3] bg-white shadow-[0_8px_24px_rgba(92,6,18,0.08)] h-[245px] sm:h-[265px]">
                  <iframe
                    title="Bhatura & Co Restaurant Location Map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      mapQuery
                    )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                  />

                  {/* Branded Floating Badge matching UI Reference */}
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#EADBC8] shadow-md text-xs font-bold text-[#9E141D] hover:bg-[#9E141D] hover:text-white transition-colors"
                  >
                    <MapPin size={14} className="shrink-0" />
                    <span>Bhatura&amp;Co</span>
                  </a>
                </div>
              </div>

              {/* ── Right Column: Visit Our Restaurant + Address Banner + 3 Facility Cards (6 cols) ── */}
              <div className="lg:col-span-6 lg:pt-1">
                <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-black">
                  <span className="text-[#1C1917]">Visit Our </span>
                  <span className="text-[#9E141D]">Restaurant</span>
                </h2>

                <p className="text-xs sm:text-sm text-[#57534E] mt-1.5 leading-relaxed max-w-xl">
                  We are located in the heart of New York, serving authentic North Indian food
                  with love and traditional recipes.
                </p>

                {/* Highlighted Address Banner */}
                <div className="mt-4 rounded-xl bg-[#F6E9D7] border border-[#EAD7BE] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-[#9E141D]/10 text-[#9E141D] flex items-center justify-center shrink-0">
                      <MapPin size={20} className="fill-[#9E141D] text-[#F6E9D7]" />
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-[#1C1917] leading-snug">
                      <span className="block">{streetLine}</span>
                      <span className="block">{cityStateLine}, USA</span>
                    </div>
                  </div>

                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#9E141D] hover:text-[#7A0F16] underline underline-offset-4 shrink-0 self-start sm:self-center group"
                  >
                    <span>Get Directions</span>
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </a>
                </div>

                {/* 3 Facility Mini-Cards: Parking | Nearest Subway | Landmark */}
                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Parking */}
                  <div className="bg-[#FFFDF9] rounded-xl border border-[#EFE2D2] p-3 flex items-center gap-2.5 shadow-2xs">
                    <span className="w-9 h-9 rounded-lg bg-[#9E141D]/10 text-[#9E141D] flex items-center justify-center shrink-0">
                      <Car size={19} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-['Playfair_Display'] text-xs font-bold text-[#1C1917] leading-tight">Parking</h3>
                      <p className="text-[11px] text-[#6B635B] mt-0.5 leading-tight">
                        Available nearby
                      </p>
                    </div>
                  </div>

                  {/* 2. Nearest Subway */}
                  <div className="bg-[#FFFDF9] rounded-xl border border-[#EFE2D2] p-3 flex items-center gap-2.5 shadow-2xs">
                    <span className="w-9 h-9 rounded-lg bg-[#9E141D]/10 text-[#9E141D] flex items-center justify-center shrink-0">
                      <TrainFront size={19} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-['Playfair_Display'] text-xs font-bold text-[#1C1917] leading-tight">
                        Nearest Subway
                      </h3>
                      <p className="text-[11px] text-[#6B635B] mt-0.5 leading-tight">
                        Lefferts Blvd Station (5 mins walk)
                      </p>
                    </div>
                  </div>

                  {/* 3. Landmark */}
                  <div className="bg-[#FFFDF9] rounded-xl border border-[#EFE2D2] p-3 flex items-center gap-2.5 shadow-2xs">
                    <span className="w-9 h-9 rounded-lg bg-[#9E141D]/10 text-[#9E141D] flex items-center justify-center shrink-0">
                      <Building2 size={19} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-['Playfair_Display'] text-xs font-bold text-[#1C1917] leading-tight">Landmark</h3>
                      <p className="text-[11px] text-[#6B635B] mt-0.5 leading-tight">
                        Near Liberty Avenue
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 6. OTHER WAYS TO CONNECT ═══ */}
        <section className="relative bg-[#FAF3E8] py-8 sm:py-10 overflow-hidden">
          {/* Subtle Mandala Corner Ornaments */}
          <div className="hidden lg:block absolute -left-20 -bottom-20 w-52 h-52 opacity-20 pointer-events-none">
            <MandalaWatermark className="w-full h-full" />
          </div>
          <div className="hidden lg:block absolute -right-20 -bottom-20 w-52 h-52 opacity-20 pointer-events-none">
            <MandalaWatermark className="w-full h-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-['Playfair_Display'] text-xl sm:text-2xl font-black">
                <span className="text-[#1C1917]">Other Ways to </span>
                <span className="text-[#9E141D]">Connect</span>
              </h2>
              <span className="w-14 h-[1.5px] bg-[#9E141D]/60 mt-1" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Chat on WhatsApp */}
              <a
                href={`https://wa.me/${DEFAULT_LOCATION.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#FFFDF9] rounded-2xl border border-[#EFE2D2] shadow-[0_4px_16px_rgba(92,6,18,0.05)] hover:shadow-[0_10px_24px_rgba(139,30,30,0.12)] hover:-translate-y-0.5 transition-all p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.83-.11-.42-.13-.97-.31-1.66-.61-2.92-1.26-4.83-4.21-4.98-4.41-.14-.19-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.59-.36.79-.36.2 0 .39.01.57.01.18.01.43-.07.67.51.24.58.82 2.01.89 2.16.07.15.12.32.02.51-.1.19-.15.32-.29.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.15.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.7-.17 1.38z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#9E141D] transition-colors truncate">
                      Chat on WhatsApp
                    </span>
                    <span className="block text-[11px] sm:text-xs font-medium text-[#57534E] mt-0.5 truncate">
                      {phoneDisplay}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-[#78716C] group-hover:text-[#9E141D] group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </a>

              {/* 2. Follow Us on Instagram */}
              <a
                href="https://instagram.com/bhaturaandco"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#FFFDF9] rounded-2xl border border-[#EFE2D2] shadow-[0_4px_16px_rgba(92,6,18,0.05)] hover:shadow-[0_10px_24px_rgba(139,30,30,0.12)] hover:-translate-y-0.5 transition-all p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 fill-none stroke-current"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#9E141D] transition-colors truncate">
                      Follow Us on Instagram
                    </span>
                    <span className="block text-[11px] sm:text-xs font-medium text-[#57534E] mt-0.5 truncate">
                      @bhaturaandco
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-[#78716C] group-hover:text-[#9E141D] group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </a>

              {/* 3. Like Us on Facebook */}
              <a
                href="https://facebook.com/bhaturaandco"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#FFFDF9] rounded-2xl border border-[#EFE2D2] shadow-[0_4px_16px_rgba(92,6,18,0.05)] hover:shadow-[0_10px_24px_rgba(139,30,30,0.12)] hover:-translate-y-0.5 transition-all p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-11 h-11 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M15.12 5.32H17V2.14A26.11 26.11 0 0 0 14.26 2c-2.72 0-4.58 1.66-4.58 4.7v2.62H6.61v3.56h3.07V22h3.68v-9.12h3.06l.46-3.56h-3.52V6.65c0-1.05.29-1.73 1.76-1.73z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#9E141D] transition-colors truncate">
                      Like Us on Facebook
                    </span>
                    <span className="block text-[11px] sm:text-xs font-medium text-[#57534E] mt-0.5 truncate">
                      @bhaturaandco
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-[#78716C] group-hover:text-[#9E141D] group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </a>

              {/* 4. Business & Catering Inquiries */}
              <a
                href={`mailto:${emailDisplay}?subject=${encodeURIComponent(
                  'Business & Catering Inquiry - Bhatura & Co'
                )}`}
                className="group bg-[#FFFDF9] rounded-2xl border border-[#EFE2D2] shadow-[0_4px_16px_rgba(92,6,18,0.05)] hover:shadow-[0_10px_24px_rgba(139,30,30,0.12)] hover:-translate-y-0.5 transition-all p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-11 h-11 rounded-full bg-[#B01822] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Mail size={20} />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#9E141D] transition-colors leading-tight">
                      Business &amp; Catering Inquiries
                    </span>
                    <span className="block text-[11px] sm:text-xs font-medium text-[#57534E] mt-0.5 truncate">
                      {emailDisplay}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-[#78716C] group-hover:text-[#9E141D] group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ 7. FOOTER ═══ */}
      <BhaturaFooter />

      {/* ═══ 8. ADDRESS MODAL ═══ */}
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
