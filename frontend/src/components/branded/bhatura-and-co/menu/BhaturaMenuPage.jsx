'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Minus, Copy, Check, ArrowRight, Loader2, SearchX } from 'lucide-react';
import toast from 'react-hot-toast';
import BhaturaHeader from '../BhaturaHeader';
import BhaturaFooter from '../BhaturaFooter';
import AddressModal from '@/components/shared/AddressModal';
import { restaurantAPI, authAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getItemUrl, resolveImageUrl } from '@/lib/slugUtils';
import { getCategory3DImage } from '@/lib/category3DHelper';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co';
const IMG = '/assets/images/branded/bhatura-and-co';

/* ── Image fallbacks (used when backend item/category has no image) ── */
const getCategoryImage = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('bhatur') || n.includes('chole') || n.includes('chhole')) return `${IMG}/cat_chole_bhature.png`;
  if (n.includes('paratha') || n.includes('bread') || n.includes('kulcha') || n.includes('naan') || n.includes('roti')) return `${IMG}/cat_parathas.png`;
  if (n.includes('curr') || n.includes('paneer') || n.includes('dal') || n.includes('main')) return `${IMG}/cat_curries.png`;
  if (n.includes('rice') || n.includes('biryani') || n.includes('thali')) return `${IMG}/cat_rice_biryani.png`;
  if (n.includes('snack') || n.includes('samosa') || n.includes('starter') || n.includes('appet') || n.includes('chaat')) return `${IMG}/cat_snacks.png`;
  if (n.includes('bever') || n.includes('drink') || n.includes('lassi') || n.includes('chai') || n.includes('dessert') || n.includes('sweet')) return `${IMG}/cat_beverages.png`;
  return `${IMG}/cat_chole_bhature.png`;
};

const getDishImage = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('paratha') || n.includes('kulcha')) return `${IMG}/dish_aloo_paratha.png`;
  if (n.includes('paneer') || n.includes('curr') || n.includes('masala')) return `${IMG}/dish_paneer_butter_masala.png`;
  if (n.includes('biryani') || n.includes('rice')) return `${IMG}/dish_veg_biryani.png`;
  if (n.includes('samosa')) return `${IMG}/dish_samosa.png`;
  if (n.includes('lassi') || n.includes('drink')) return `${IMG}/cat_beverages.png`;
  return `${IMG}/dish_chole_bhature.png`;
};

/* ── Small decorative squiggle like the mockup ── */
const Squiggle = ({ className = '' }) => (
  <svg viewBox="0 0 60 10" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M1 5c4-4 6-4 10 0s6 4 10 0 6-4 10 0 6 4 10 0 6-4 10 0 6 4 8 0" />
  </svg>
);

export default function BhaturaMenuPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: cartItems, addItem, updateQuantity } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const stripRef = useRef(null);
  const gridRef = useRef(null);

  /* ── Load menu from backend (same flow as Lassi Lounge) ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await restaurantAPI.getById(RESTAURANT_ID);
        const data = res?.data;
        if (!alive) return;
        setRestaurant(data || null);
        const cats = (data?.menu || [])
          .map((c) => ({ ...c, items: (c.items || []).filter((i) => i.isAvailable !== false) }))
          .filter((c) => c.items.length > 0);
        setCategories(cats);
        const wanted = searchParams?.get('category');
        const match = wanted && cats.find((c) => c.name?.toLowerCase() === wanted.toLowerCase());
        setActiveId((match || cats[0])?._id || null);
      } catch (e) {
        console.error('Failed to load menu:', e);
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [searchParams]);

  const activeCategory = useMemo(
    () => categories.find((c) => c._id === activeId) || categories[0],
    [categories, activeId]
  );
  const otherCategories = useMemo(
    () => categories.filter((c) => c._id !== activeCategory?._id),
    [categories, activeCategory]
  );

  /* ── Cart helpers (CartContext) ── */
  const findCartIndex = (item) => {
    const id = item.menuItemId || item._id || item.id;
    return cartItems.findIndex((ci) => {
      const cid = ci.menuItemId || ci._id || ci.id;
      return (id && cid && cid === id) || (ci.name && item.name && ci.name.toLowerCase().trim() === item.name.toLowerCase().trim());
    });
  };
  const getQty = (item) => {
    const idx = findCartIndex(item);
    return idx > -1 ? cartItems[idx].quantity || cartItems[idx].qty || 0 : 0;
  };

  const handleAdd = (item, e) => {
    e?.stopPropagation();
    const hasCustom = (item.sizeVariations?.length || 0) > 0 || (item.addOns?.length || 0) > 0;
    if (hasCustom) {
      router.push(getItemUrl(item, RESTAURANT_ID));
      return;
    }
    const result = addItem({ ...item, quantity: 1 }, restaurant);
    if (result?.conflict) {
      toast.error('Your cart has items from another restaurant.');
      return;
    }
    toast.success(`${item.name} added to cart`, { duration: 1500 });
  };

  const handleDecrement = (item, e) => {
    e?.stopPropagation();
    const idx = findCartIndex(item);
    if (idx > -1) updateQuantity(idx, (cartItems[idx].quantity || cartItems[idx].qty || 1) - 1);
  };

  const toggleFavorite = async (item, e) => {
    e?.stopPropagation();
    if (!isAuthenticated) return router.push('/login');
    try { await authAPI.toggleFavoriteItem(item._id); } catch { /* noop */ }
  };

  const selectCategory = (id, scroll = false) => {
    setActiveId(id);
    if (scroll) {
      setTimeout(() => {
        const el = gridRef.current;
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
      }, 50);
    }
  };

  const scrollStrip = (dir) => stripRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  const handleCopy = () => {
    navigator.clipboard.writeText('BHATURA20');
    setCopied(true);
    toast.success('Coupon BHATURA20 copied! 🎉', { duration: 2000 });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FDF7EE] text-[#1C1917] flex flex-col">
      <BhaturaHeader onOpenAddressModal={() => setIsAddressModalOpen(true)} />

      <main className="flex-1">
        {/* ═══ 1. HERO ═══ */}
        <section className="relative overflow-hidden bg-[#1A0D07] min-h-[300px] sm:min-h-[360px] lg:min-h-[400px] flex items-center">
          <Image src={`${IMG}/menu_hero_bg.jpg`} alt="Chole Bhature on a rustic table" fill priority sizes="100vw" className="object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0D07] via-[#1A0D07]/85 via-45% to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1A0D07]/70 to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
            <div className="max-w-xl">
              <span className="text-xs sm:text-sm font-bold text-[#F5B53D] tracking-[0.2em] uppercase">Our Menu</span>
              <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-[58px] font-black leading-[1.08] mt-2 mb-4">
                <span className="text-white">Authentic Flavours</span>
                <br />
                <span className="text-[#F5B53D]">In Every Bite</span>
              </h1>
              <p className="text-white/85 text-sm sm:text-base lg:text-lg leading-relaxed max-w-md">
                From fluffy bhature to rich curries, explore a menu made with love, tradition and the finest ingredients.
              </p>
            </div>
          </div>

          {/* bottom wave into categories strip */}
          <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-10 pointer-events-none z-10">
            <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,22 C360,40 900,4 1440,20 L1440,40 L0,40 Z" fill="#FDF7EE" />
            </svg>
          </div>
        </section>

        {/* ═══ 2. CATEGORY STRIP ═══ */}
        <section className="sticky top-16 md:static z-30 bg-[#FDF7EE]/95 md:bg-[#FDF7EE] backdrop-blur-md md:backdrop-blur-none pt-3 sm:pt-4 pb-3.5 sm:pb-6 border-b border-[#EFE2CF]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <button onClick={() => scrollStrip(-1)} aria-label="Previous categories" className="hidden md:flex absolute left-0 lg:left-2 top-[42px] z-10 w-9 h-9 rounded-full bg-white shadow-md border border-[#EADFCF] items-center justify-center hover:bg-[#8B1E1E] hover:text-white transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scrollStrip(1)} aria-label="Next categories" className="hidden md:flex absolute right-0 lg:right-2 top-[42px] z-10 w-9 h-9 rounded-full bg-white shadow-md border border-[#EADFCF] items-center justify-center hover:bg-[#8B1E1E] hover:text-white transition-colors">
              <ChevronRight size={18} />
            </button>

            <div ref={stripRef} className="flex gap-5 sm:gap-7 overflow-x-auto scroll-smooth px-1 md:px-12 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center shrink-0">
                      <div className="w-[84px] h-[84px] rounded-full bg-[#EFE4D4] animate-pulse" />
                      <div className="w-16 h-3 mt-3 rounded bg-[#EFE4D4] animate-pulse" />
                    </div>
                  ))
                : categories.map((cat) => {
                    const active = cat._id === activeCategory?._id;
                    const cat3D = getCategory3DImage(cat.name);
                    return (
                      <button
                        key={cat._id}
                        id={`menu-cat-${cat._id}`}
                        onClick={() => selectCategory(cat._id)}
                        className="flex flex-col items-center shrink-0 group focus:outline-none"
                      >
                        {/* 3D Round Container */}
                        <span
                          className={`relative w-[86px] h-[86px] rounded-full p-[3px] transition-all duration-300 flex items-center justify-center ${
                            active
                              ? 'bg-gradient-to-b from-[#E52D37] via-[#C0262D] to-[#8B1E1E] shadow-[0_8px_20px_rgba(192,38,45,0.38)] scale-105'
                              : 'bg-gradient-to-b from-[#F2D1A0] via-[#E5B580] to-[#C99158] shadow-[0_4px_12px_rgba(139,30,30,0.10)] group-hover:shadow-[0_8px_18px_rgba(139,30,30,0.20)] group-hover:scale-105'
                          }`}
                        >
                          <span
                            className="relative block w-full h-full rounded-full flex items-center justify-center overflow-visible"
                            style={{
                              background: 'radial-gradient(circle at 50% 40%, #FFFDF9 0%, #FDE9D3 65%, #F7D4AA 100%)',
                            }}
                          >
                            {/* Contact shadow */}
                            <span
                              className="absolute bottom-2 w-11 h-1.5 rounded-full pointer-events-none transition-opacity duration-300 group-hover:opacity-75"
                              style={{
                                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 75%)',
                                filter: 'blur(1.5px)',
                              }}
                            />
                            {/* 3D Pop-out Cutout Dish */}
                            <img
                              src={cat3D}
                              alt={cat.name}
                              className={`w-[62px] h-[62px] object-contain filter drop-shadow-[0_5px_8px_rgba(0,0,0,0.22)] -mt-0.5 transition-all duration-300 pointer-events-none ${
                                active ? 'scale-110 drop-shadow-[0_6px_12px_rgba(192,38,45,0.35)]' : 'group-hover:scale-110 group-hover:-translate-y-1'
                              }`}
                            />
                          </span>
                        </span>

                        {/* Name badge */}
                        <span
                          className={`mt-2.5 text-[13px] font-semibold whitespace-nowrap transition-all duration-200 ${
                            active
                              ? 'px-3 py-0.5 rounded-full bg-[#C0262D] text-white shadow-sm'
                              : 'text-[#1C1917] group-hover:text-[#C0262D]'
                          }`}
                        >
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
            </div>
          </div>
        </section>

        {/* ═══ 3. ACTIVE CATEGORY GRID ═══ */}
        <section ref={gridRef} className="relative bg-gradient-to-b from-[#FDF7EE] to-[#FAF0E2] py-10 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7">
              <div className="flex items-center gap-3">
                <span
                  className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-b from-[#F2D1A0] via-[#E5B580] to-[#C99158] shadow-[0_4px_12px_rgba(139,30,30,0.15)] shrink-0 flex items-center justify-center relative overflow-visible"
                  style={{ background: 'radial-gradient(circle at 50% 40%, #FFFDF9 0%, #FDE9D3 65%, #F7D4AA 100%)' }}
                >
                  <img
                    src={getCategory3DImage(activeCategory?.name)}
                    alt={activeCategory?.name || ''}
                    className="w-10 h-10 object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)] pointer-events-none"
                  />
                </span>
                <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-black text-[#8B1E1E] leading-tight">
                  {loading ? 'Loading menu…' : activeCategory?.name || 'Our Menu'}
                </h2>
                <Squiggle className="hidden sm:block w-14 h-3 text-[#C0262D] mt-2" />
              </div>
              <p className="font-['Playfair_Display'] italic text-sm sm:text-base text-[#8B1E1E]">
                {activeCategory?.description || 'Our Signature Dish – Loved by Thousands'}
              </p>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-white shadow-sm overflow-hidden">
                    <div className="h-[200px] bg-[#EFE4D4] animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 w-2/3 bg-[#EFE4D4] rounded animate-pulse" />
                      <div className="h-3 w-full bg-[#EFE4D4] rounded animate-pulse" />
                      <div className="h-8 w-full bg-[#EFE4D4] rounded animate-pulse mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error || !activeCategory ? (
              <div className="text-center py-16 bg-white rounded-xl border border-[#EADFCF]">
                <SearchX className="w-10 h-10 mx-auto text-[#D48228] mb-3" />
                <p className="font-bold">{error ? 'Could not load the menu' : 'No dishes available right now'}</p>
                <p className="text-sm text-[#78716C] mt-1">Please try again in a moment.</p>
              </div>
            ) : (
              <div key={activeCategory._id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {activeCategory.items.map((item, idx) => {
                  const qty = getQty(item);
                  const isFav = user?.favoriteItems?.some((f) => (f._id || f) === item._id);
                  return (
                    <article
                      key={item._id}
                      onClick={() => router.push(getItemUrl(item, RESTAURANT_ID))}
                      style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                      className="group bg-white rounded-xl overflow-hidden border border-[#F0E6D8] shadow-[0_4px_16px_rgba(92,6,18,0.06)] hover:shadow-[0_14px_32px_rgba(139,30,30,0.15)] hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-4 flex flex-row sm:block p-3 sm:p-0 gap-3.5 sm:gap-0 items-center"
                    >
                      <div className="relative w-[112px] h-[112px] sm:w-full sm:h-[200px] rounded-xl sm:rounded-none shrink-0 order-2 sm:order-none overflow-hidden bg-[#2A1810]">
                        <img
                          src={resolveImageUrl(item.image) || getDishImage(item.name)}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => { const f = getDishImage(item.name); if (!e.currentTarget.src.endsWith(f)) e.currentTarget.src = f; }}
                        />
                        {/* Veg / Non-veg mark */}
                        <span className={`absolute bottom-2 left-2 w-5 h-5 bg-white rounded-[4px] border-2 flex items-center justify-center ${item.isVeg === false ? 'border-[#C0262D]' : 'border-[#16A34A]'}`}>
                          <span className={`w-2 h-2 rounded-full ${item.isVeg === false ? 'bg-[#C0262D]' : 'bg-[#16A34A]'}`} />
                        </span>
                        {isAuthenticated && (
                          <button onClick={(e) => toggleFavorite(item, e)} aria-label="Toggle favourite" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
                            <svg viewBox="0 0 24 24" className={`w-4 h-4 ${isFav ? 'fill-[#C0262D] text-[#C0262D]' : 'fill-none text-[#C0262D]'}`} stroke="currentColor" strokeWidth="2"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.3 4.5 6 4.5c2.1 0 3.4 1.1 4 2.2.6-1.1 1.9-2.2 4-2.2 3.7 0 5.6 3.9 4 7.2C19.5 16.4 12 21 12 21z" /></svg>
                          </button>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 p-0 sm:p-4 order-1 sm:order-none">
                        <h3 className="font-['Playfair_Display'] font-bold text-[16px] sm:text-[17px] text-[#1C1917] line-clamp-1">{item.name}</h3>
                        <p className="text-[13px] text-[#57534E] leading-snug line-clamp-2 mt-1 min-h-[36px]">
                          {item.description || 'Freshly prepared with authentic North Indian spices.'}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[20px] font-black text-[#C0262D]">${Number(item.price || 0).toFixed(2)}</span>
                          {qty > 0 ? (
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center h-9 rounded-md bg-[#B0151D] text-white overflow-hidden shadow-sm">
                              <button onClick={(e) => handleDecrement(item, e)} className="w-9 h-full flex items-center justify-center hover:bg-black/15" aria-label={`Remove one ${item.name}`}><Minus size={14} strokeWidth={3} /></button>
                              <span className="min-w-[24px] text-center text-sm font-bold">{qty}</span>
                              <button onClick={(e) => handleAdd(item, e)} className="w-9 h-full flex items-center justify-center hover:bg-black/15" aria-label={`Add one ${item.name}`}><Plus size={14} strokeWidth={3} /></button>
                            </div>
                          ) : (
                            <button onClick={(e) => handleAdd(item, e)} className="h-9 px-5 rounded-md bg-[#B0151D] hover:bg-[#8B1E1E] text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors">
                              Add <Plus size={14} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ═══ 4. SPECIAL OFFER BANNER (maroon) ═══ */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#4A070C] via-[#6B0D14] to-[#4A070C]">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_50%,#A3241F_0%,transparent_45%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 items-center gap-4 py-6 lg:py-0">
            <div className="lg:col-span-4 relative h-[220px] sm:h-[260px]">
              <Image src={`${IMG}/offer_plate_maroon.jpg`} alt="Chole Bhature platter" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-contain scale-110"
                style={{ WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 75%, transparent 100%)', maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 75%, transparent 100%)' }} />
            </div>

            <div className="lg:col-span-5 text-center flex flex-col items-center">
              <span className="px-4 py-1 rounded-full bg-[#F5B53D] text-[#4A070C] text-[11px] font-black tracking-[0.15em] uppercase shadow">Special Offer</span>
              <h2 className="font-['Playfair_Display'] text-4xl sm:text-5xl font-black text-white mt-2 leading-none">Get 20% Off</h2>
              <p className="text-white text-lg sm:text-xl font-semibold mt-1 mb-4">On Your First Order</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-4 px-4 py-2 rounded-lg border-2 border-dashed border-[#F5B53D]/80 text-left">
                  <div>
                    <span className="block text-[11px] text-white/80">Use Code</span>
                    <span className="block text-lg font-black text-white tracking-wider">BHATURA20</span>
                  </div>
                  <button onClick={handleCopy} aria-label="Copy coupon" className="text-white/90 hover:text-[#F5B53D]">
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <Link href="#menu-top" onClick={(e) => { e.preventDefault(); gridRef.current && window.scrollTo({ top: gridRef.current.offsetTop - 90, behavior: 'smooth' }); }}
                  className="h-12 px-6 rounded-lg bg-gradient-to-b from-[#F8C454] to-[#E9A21F] text-[#4A070C] font-bold flex items-center gap-2 shadow-lg hover:brightness-105 transition">
                  Order Now <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex lg:col-span-3 justify-center">
              <p className="font-['Dancing_Script',cursive] text-white text-4xl xl:text-[44px] leading-tight -rotate-6 text-center drop-shadow">
                Flavours<br />That Feel<br />Like Home
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 5. YOU MAY ALSO LIKE ═══ */}
        {!loading && otherCategories.length > 0 && (
          <section className="bg-[#FDF7EE] py-10 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-7">
                <div className="flex items-center justify-center gap-3 text-[#C0262D]">
                  <Squiggle className="w-14 h-3" />
                  <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-black text-[#1C1917]">You May Also Like These</h2>
                  <Squiggle className="w-14 h-3" />
                </div>
                <p className="font-['Playfair_Display'] text-2xl sm:text-3xl font-black text-[#C0262D] mt-1">Delicious Authentic Indian Foods</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                {otherCategories.slice(0, 8).map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => selectCategory(cat._id, true)}
                    className="group bg-white rounded-2xl p-3 border border-[#F0E6D8] shadow-[0_4px_14px_rgba(92,6,18,0.06)] hover:shadow-[0_12px_28px_rgba(139,30,30,0.18)] hover:-translate-y-1.5 transition-all duration-300 text-center flex flex-col items-center"
                  >
                    {/* 3D Round Container with warm radial backdrop & contact shadow */}
                    <div
                      className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-b from-[#F2D1A0] to-[#C99158] shadow-sm group-hover:scale-105 transition-transform duration-300 flex items-center justify-center"
                      style={{ background: 'radial-gradient(circle at 50% 40%, #FFFDF9 0%, #FDE9D3 65%, #F7D4AA 100%)' }}
                    >
                      <div
                        className="absolute bottom-1 w-12 h-1.5 rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 75%)',
                          filter: 'blur(1.5px)',
                        }}
                      />
                      <img
                        src={getCategory3DImage(cat.name)}
                        alt={cat.name}
                        className="w-16 h-16 object-contain filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.22)] group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 pointer-events-none"
                      />
                    </div>
                    <div className="mt-2.5 w-full">
                      <span className="block text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#C0262D] transition-colors truncate">
                        {cat.name}
                      </span>
                      <span className="block text-[11px] text-[#8C827A] mt-0.5">
                        {cat.items?.length || 0} Items
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <BhaturaFooter />

      {isAddressModalOpen && (
        <AddressModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} onSelectAddress={() => setIsAddressModalOpen(false)} />
      )}
    </div>
  );
}
