'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Fuse from 'fuse.js';
import toast from 'react-hot-toast';
import {
  Search, X, ChevronLeft, ChevronRight, Plus, Minus, Copy, Check,
  ShoppingCart, Trash2, MapPin, Clock, ShieldCheck, Tag, Bike, Store,
  ArrowRight, ChevronUp, Heart, FileText, SearchX, AlertCircle,
} from 'lucide-react';
import BhaturaHeader from '../BhaturaHeader';
import BhaturaFooter from '../BhaturaFooter';
import { evaluateDeliveryEta, parseAddressString } from '../BhaturaHeroSection';
import AddressModal from '@/components/shared/AddressModal';
import { ItemDetailModal, PortalModal } from '@/components/ui';
import { restaurantAPI, authAPI, couponAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getItemUrl, resolveImageUrl } from '@/lib/slugUtils';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co';
const IMG = '/assets/images/branded/bhatura-and-co';

/* ── Category & Dish Image Fallbacks ── */
const getCategoryThumb = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('bhatur') || n.includes('chole') || n.includes('chhole')) return `${IMG}/cat_chole_bhature.jpg`;
  if (n.includes('paratha')) return `${IMG}/cat_parathas.jpg`;
  if (n.includes('curr') || n.includes('paneer') || n.includes('dal')) return `${IMG}/cat_curries.jpg`;
  if (n.includes('rice') || n.includes('biryani')) return `${IMG}/cat_rice_biryani.jpg`;
  if (n.includes('snack') || n.includes('samosa') || n.includes('chaat')) return `${IMG}/cat_snacks.jpg`;
  if (n.includes('bread') || n.includes('naan') || n.includes('kulcha') || n.includes('roti')) return `${IMG}/categories/breads.jpg`;
  if (n.includes('thali') || n.includes('platter') || n.includes('meal')) return `${IMG}/categories/main-course.jpg`;
  if (n.includes('bever') || n.includes('drink') || n.includes('lassi') || n.includes('chai')) return `${IMG}/cat_beverages.jpg`;
  if (n.includes('dessert') || n.includes('sweet') || n.includes('jamun')) return `${IMG}/categories/desserts.jpg`;
  return `${IMG}/cat_chole_bhature.jpg`;
};

const getDishImage = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('paratha') || n.includes('kulcha') || n.includes('naan') || n.includes('roti')) return `${IMG}/dish_aloo_paratha.jpg`;
  if (n.includes('dal') || n.includes('chana') || n.includes('rajma')) return `${IMG}/cat_curries.jpg`;
  if (n.includes('paneer') || n.includes('curr') || n.includes('masala') || n.includes('kadai')) return `${IMG}/dish_paneer_butter_masala.jpg`;
  if (n.includes('biryani') || n.includes('rice') || n.includes('chawal')) return `${IMG}/dish_veg_biryani.jpg`;
  if (n.includes('samosa') || n.includes('pakora') || n.includes('chaat') || n.includes('tikki') || n.includes('bhalla')) return `${IMG}/dish_samosa.jpg`;
  if (n.includes('lassi') || n.includes('chai') || n.includes('drink') || n.includes('chaas') || n.includes('shikanji')) return `${IMG}/cat_beverages.jpg`;
  if (n.includes('jamun') || n.includes('rasmalai') || n.includes('halwa') || n.includes('phirni') || n.includes('kulfi')) return `${IMG}/categories/desserts.jpg`;
  return `${IMG}/dish_chole_bhature.jpg`;
};

const getCategorySubtitle = (cat) => {
  const n = (cat?.name || '').toLowerCase();
  if (n.includes('bhatur') || n.includes('chole')) return 'Our signature dish – loved by thousands';
  if (n.includes('paratha')) return 'Stuffed with rich flavours';
  if (n.includes('curr')) return 'Rich, aromatic and full of taste';
  return cat?.description || 'Freshly prepared with authentic North Indian spices';
};

/* ── Small Decorative Squiggle ── */
const Squiggle = ({ className = '' }) => (
  <svg viewBox="0 0 56 8" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M1 4c3.5-3.5 5.5-3.5 9 0s5.5 3.5 9 0 5.5-3.5 9 0 5.5 3.5 9 0 5.5 3.5 9 0 5.5 3.5 8 0" />
  </svg>
);

/* ── Category Bowl/Plate Icon ── */
const CategoryHeadingIcon = ({ index = 0, name = '' }) => {
  if (index === 0) {
    return (
      <span className="w-9 h-9 rounded-full bg-[#9E141D]/10 border border-[#9E141D]/25 flex items-center justify-center text-[#9E141D] shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 13h16a7 7 0 0 1-14 0Z" fill="#9E141D" fillOpacity="0.18" />
          <path d="M3 13h18M6 19h12M9 5c0 1.5-1 2.5-1 4M13 4c0 1.5-1 2.5-1 4M17 5c0 1.5-1 2.5-1 4" />
        </svg>
      </span>
    );
  }
  return (
    <span className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#D49A59] shadow-xs shrink-0 bg-[#2A140B]">
      <img
        src={getCategoryThumb(name)}
        alt=""
        className="w-full h-full object-cover"
      />
    </span>
  );
};

function OrderOnlineInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCatParam = searchParams?.get('category') || searchParams?.get('categoryName') || '';

  const {
    items: cartItems,
    itemCount,
    subtotal,
    specialInstructions,
    setSpecialInstructions,
    addItem,
    switchRestaurant,
    restaurant: cartRestaurant,
    updateQuantity,
    removeItem,
    clearCart,
    findCartIndex,
    getItemQuantity,
  } = useCart();
  const { user, isAuthenticated, updateUser } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isStripStuck, setIsStripStuck] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [orderMode, setOrderMode] = useState('delivery'); // 'delivery' | 'pickup'
  const [deliveryAddress, setDeliveryAddress] = useState('123 Main Street, New York, NY 10001');
  const [selectedCoords, setSelectedCoords] = useState({ lat: null, lng: null });
  const [eta, setEta] = useState({ pickup: 15, delivery: 35, isOutOfRange: false, reason: '' });
  const [loadingEta, setLoadingEta] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Lassi Lounge customization & conflict modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [repeatModal, setRepeatModal] = useState(null);
  const [conflictModal, setConflictModal] = useState(null);

  const stripRef = useRef(null);
  const catBtnRefs = useRef({});
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);
  const sectionRefs = useRef({});
  const manualScrollLockRef = useRef(false);
  const [rightColHeight, setRightColHeight] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chipStripRef = useRef(null);
  const chipBtnRefs = useRef({});

  /* ── Track mobile breakpoint (<768px) for the app-style mobile menu layout ── */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  /* ── Hydrate saved address & orderMode ── */
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const savedMode = localStorage.getItem('bhatura_order_mode');
        if (savedMode === 'pickup' || savedMode === 'delivery') setOrderMode(savedMode);
        const savedAddr = localStorage.getItem('bhatura_selected_address');
        if (savedAddr) {
          const parsed = JSON.parse(savedAddr);
          if (parsed?.street || parsed?.address || parsed?.formattedAddress) {
            setDeliveryAddress(
              parsed.formattedAddress ||
                [parsed.street || parsed.address, parsed.city, parsed.state, parsed.zipCode].filter(Boolean).join(', ')
            );
            setSelectedCoords({
              lat: parsed.lat ?? null,
              lng: parsed.lng ?? null,
            });
          }
        } else if (user?.addresses?.length > 0) {
          const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
          if (def) {
            setDeliveryAddress(
              [def.street || def.address, def.city, def.state, def.zipCode].filter(Boolean).join(', ')
            );
            setSelectedCoords({
              lat: def.lat ?? def.latitude ?? null,
              lng: def.lng ?? def.longitude ?? null,
            });
          }
        }
      } catch {
        /* ignore */
      }
    };

    syncFromStorage();
    window.addEventListener('bhatura-address-updated', syncFromStorage);
    return () => window.removeEventListener('bhatura-address-updated', syncFromStorage);
  }, [user]);

  /* ── Live ETA & Delivery Serviceability Check (same flow as Lassi Lounge OrderOnlineHero) ── */
  useEffect(() => {
    let alive = true;
    if (!deliveryAddress) {
      setEta({ pickup: 15, delivery: 35, isOutOfRange: false, reason: '' });
      return;
    }
    setLoadingEta(true);
    evaluateDeliveryEta({
      address: deliveryAddress,
      lat: selectedCoords?.lat,
      lng: selectedCoords?.lng,
      restaurant,
    })
      .then((res) => {
        if (!alive) return;
        setEta(res);
      })
      .finally(() => {
        if (alive) setLoadingEta(false);
      });
    return () => {
      alive = false;
    };
  }, [deliveryAddress, selectedCoords?.lat, selectedCoords?.lng, restaurant?._id]);

  /* ── Load Restaurant & Menu from Backend (same flow as Lassi Lounge) ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await restaurantAPI.getById(RESTAURANT_ID);
        const data = res?.data;
        if (!alive) return;
        setRestaurant(data || null);
        const cats = (data?.menu || [])
          .map((c) => ({
            ...c,
            items: (c.items || []).filter((i) => i.isAvailable !== false),
          }))
          .filter((c) => c.items.length > 0);
        setCategories(cats);
        if (cats.length > 0) {
          const match =
            initialCatParam &&
            cats.find((c) => c.name?.toLowerCase() === initialCatParam.toLowerCase());
          const targetCat = match || cats[0];
          setActiveCategoryId(targetCat._id);
          if (match) {
            setExpandedCategories({ [match._id]: true });
          }
        }
      } catch (err) {
        console.error('Failed to load Order Online menu:', err);
        toast.error('Failed to load menu. Please refresh.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialCatParam]);

  /* ── Synchronize Left Items Box Height with Right Cart Box (pixel-perfect bottom alignment) ── */
  useEffect(() => {
    const checkHeight = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop && rightColRef.current) {
        setRightColHeight(rightColRef.current.offsetHeight);
      } else {
        setRightColHeight(null);
      }
    };

    checkHeight();

    const el = rightColRef.current;
    let ro = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (window.innerWidth >= 1024) {
            setRightColHeight(entry.target.offsetHeight);
          }
        }
      });
      ro.observe(el);
    }

    window.addEventListener('resize', checkHeight);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', checkHeight);
    };
  }, [cartItems, appliedCoupon]);

  /* ── Scroll-Spy + Sticky Strip Compact State (tracks window & left column) ── */
  useEffect(() => {
    const checkActiveCategory = (container, isWindow = false) => {
      if (manualScrollLockRef.current || categories.length === 0) return;

      // When scrolled all the way to the bottom, keep the last category active
      if (container && container.scrollTop + container.clientHeight >= container.scrollHeight - 30) {
        const lastCat = categories[categories.length - 1];
        if (lastCat && lastCat._id !== activeCategoryId) {
          setActiveCategoryId(lastCat._id);
        }
        return;
      }

      const containerTop = isWindow ? (window.innerWidth < 768 ? 128 : 175) : (container?.getBoundingClientRect().top || 0);
      let bestCatId = categories[0]?._id;

      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const el = sectionRefs.current[cat._id];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // A section becomes active when its header reaches within 40px of container top
        if (rect.top <= containerTop + 40) {
          bestCatId = cat._id;
        } else {
          break;
        }
      }

      if (bestCatId && bestCatId !== activeCategoryId) {
        setActiveCategoryId(bestCatId);
      }
    };

    const onWindowScroll = () => {
      setIsStripStuck(window.scrollY > 280);
      if (window.innerWidth < 1024) {
        checkActiveCategory(null, true);
      }
    };

    const leftCol = leftColRef.current;
    const onLeftColScroll = () => {
      if (window.innerWidth >= 1024) {
        checkActiveCategory(leftCol, false);
      }
    };

    window.addEventListener('scroll', onWindowScroll, { passive: true });
    leftCol?.addEventListener('scroll', onLeftColScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onWindowScroll);
      leftCol?.removeEventListener('scroll', onLeftColScroll);
    };
  }, [categories, activeCategoryId]);

  /* ── Keep Active Mobile Chip Centered in Sticky Chip Bar ── */
  useEffect(() => {
    if (!activeCategoryId || !chipStripRef.current) return;
    const btn = chipBtnRefs.current[activeCategoryId];
    const container = chipStripRef.current;
    if (btn) {
      const targetLeft = btn.offsetLeft - container.clientWidth / 2 + btn.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
  }, [activeCategoryId]);

  /* ── Keep Active Category Pill Centered in Horizontal Strip ── */
  useEffect(() => {
    if (!activeCategoryId || !stripRef.current) return;
    const btn = catBtnRefs.current[activeCategoryId];
    const container = stripRef.current;
    if (btn && container) {
      const targetLeft = btn.offsetLeft - container.clientWidth / 2 + btn.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
  }, [activeCategoryId]);

  /* ── Fuzzy Search with Fuse.js (Lassi Lounge Order Online pattern) ── */
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return categories;

    const allItems = categories.flatMap((cat) =>
      (cat.items || []).map((item) => ({ ...item, _catId: cat._id, _catName: cat.name }))
    );
    const fuse = new Fuse(allItems, {
      keys: ['name', 'description', '_catName'],
      threshold: 0.35,
    });
    const matchedIds = new Set(fuse.search(q).map((r) => r.item._id));

    return categories
      .map((cat) => ({
        ...cat,
        items: (cat.items || []).filter((i) => matchedIds.has(i._id)),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, searchQuery]);

  /* ── Scroll Category Carousel ── */
  const scrollStrip = (dir) => {
    stripRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  /* ── Selecting a category scrolls to it smoothly AND expands all its dishes ── */
  const handleSelectCategory = (catId) => {
    setActiveCategoryId(catId);
    setExpandedCategories((prev) => ({ ...prev, [catId]: true }));

    manualScrollLockRef.current = true;
    setTimeout(() => {
      const el = sectionRefs.current[catId];
      const container = leftColRef.current;
      const isFirst = categories[0]?._id === catId;

      if (container && window.innerWidth >= 1024) {
        // 1. Scroll window so the category strip is pinned and the dishes/cart area takes center stage
        const heroEl = document.querySelector('main > section:first-child');
        const targetWindowY = heroEl ? heroEl.offsetHeight : 400;
        window.scrollTo({ top: targetWindowY, behavior: 'smooth' });

        // 2. Simultaneously scroll left dishes container to the clicked category
        if (isFirst) {
          container.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (el) {
          const containerRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const scrollDelta = elRect.top - containerRect.top;
          const targetTop = container.scrollTop + scrollDelta - 10;
          container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }
      } else if (el) {
        // On mobile, the entire window scrolls to the category
        if (window.innerWidth < 768) {
          const elRect = el.getBoundingClientRect();
          const targetTop = window.scrollY + elRect.top - 124;
          window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        } else if (isFirst) {
          const heroEl = document.querySelector('main > section:first-child');
          const targetTop = heroEl ? heroEl.offsetHeight : 350;
          window.scrollTo({ top: targetTop, behavior: 'smooth' });
        } else {
          const elRect = el.getBoundingClientRect();
          const targetTop = window.scrollY + elRect.top - 165;
          window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }
      }

      setTimeout(() => {
        manualScrollLockRef.current = false;
      }, 900);
    }, 40);
  };

  const handleModeChange = (mode) => {
    setOrderMode(mode);
    try {
      localStorage.setItem('bhatura_order_mode', mode);
    } catch {
      /* ignore */
    }
  };

  /* ── Add to Cart & Real Cart Stepper Handlers (0 when not in cart, increments/decrements live) ── */
  const performAddToCart = (item, opts = {}) => {
    if (
      process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE !== 'true' &&
      cartRestaurant &&
      restaurant &&
      cartRestaurant._id !== restaurant._id
    ) {
      setConflictModal({ item, opts });
      return;
    }
    const quantity = opts.quantity || 1;
    const unitPrice = Number(opts.size?.price ?? item.price ?? 0);
    const addOnTotal = (opts.addOns || []).reduce((s, a) => s + (Number(a.price) || 0), 0);

    addItem(
      {
        _id: item._id,
        menuItemId: item._id,
        name: item.name,
        price: unitPrice,
        image: resolveImageUrl(item.image) || getDishImage(item.name),
        quantity,
        selectedSize: opts.size || null,
        addOns: opts.addOns || [],
        specialInstructions: opts.instructions || '',
        lineTotal: (unitPrice + addOnTotal) * quantity,
      },
      restaurant
    );
    toast.success(`${item.name} added to cart`, { duration: 1500 });
  };

  const handleCardAddOrPlus = (item, e) => {
    e?.stopPropagation();
    const hasCustom = (item.sizeVariations?.length || 0) > 0 || (item.addOns?.length || 0) > 0;
    if (hasCustom) {
      const idx = findCartIndex(item);
      if (idx > -1) {
        setRepeatModal({ item, lastCartItem: cartItems[idx] });
      } else {
        setSelectedItem(item);
      }
      return;
    }

    const idx = findCartIndex(item);
    if (idx > -1) {
      const cur = cartItems[idx].quantity || cartItems[idx].qty || 1;
      updateQuantity(idx, cur + 1);
    } else {
      performAddToCart(item, { quantity: 1 });
    }
  };

  const handleCardStepMinus = (item, e) => {
    e?.stopPropagation();
    const idx = findCartIndex(item);
    if (idx > -1) {
      const cur = cartItems[idx].quantity || cartItems[idx].qty || 1;
      updateQuantity(idx, cur - 1);
    }
  };

  const handleToggleFavorite = async (item, e) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      toast('Please login to save favourites');
      router.push('/login?redirect=/order-online');
      return;
    }
    try {
      const res = await authAPI.toggleFavoriteItem(item._id);
      if (res?.data && updateUser) updateUser({ favoriteItems: res.data });
      toast.success('Favourites updated');
    } catch {
      toast.error('Could not update favourites');
    }
  };

  /* ── Copy & Coupon Validation ── */
  const handleCopyCoupon = () => {
    navigator.clipboard?.writeText('BHATURA20');
    setCopiedCode(true);
    setCouponInput('BHATURA20');
    toast.success('Code BHATURA20 copied! Click Apply in Your Order to use it.');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return toast.error('Please enter a coupon code');
    }
    if (subtotal <= 0) {
      setCouponError('Add items to your order first');
      return toast.error('Add items to your order first');
    }
    setCouponError('');

    setCouponLoading(true);
    try {
      if (code === 'BHATURA20') {
        const disc = Number((subtotal * 0.2).toFixed(2));
        const cObj = { code: 'BHATURA20', discountType: 'percentage', value: 20, discountAmount: disc };
        setAppliedCoupon(cObj);
        localStorage.setItem('bhatura_applied_coupon', JSON.stringify(cObj));
        toast.success('Coupon BHATURA20 applied! (20% Off)');
      } else {
        const res = await couponAPI.validate({
          code,
          restaurantId: restaurant?._id || RESTAURANT_ID,
          orderAmount: subtotal,
        });
        const data = res?.data || res;
        const disc = Number(data?.discountAmount || (subtotal * 0.1).toFixed(2));
        const cObj = { code, discountAmount: disc, ...data };
        setAppliedCoupon(cObj);
        localStorage.setItem('bhatura_applied_coupon', JSON.stringify(cObj));
        toast.success(`Coupon ${code} applied!`);
      }
    } catch (err) {
      const msg = err?.message || 'Invalid or expired coupon code';
      setCouponError(msg);
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  /* ── Bill Calculation (matches reference UI: Delivery Fee $2.99, Taxes 9%) ── */
  const discountAmount = useMemo(() => {
    if (!appliedCoupon || subtotal <= 0) return 0;
    if (appliedCoupon.code === 'BHATURA20') return Number((subtotal * 0.2).toFixed(2));
    return Math.min(subtotal, Number(appliedCoupon.discountAmount || 0));
  }, [appliedCoupon, subtotal]);

  const deliveryFee = cartItems.length > 0 && orderMode === 'delivery' ? 2.99 : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxes = cartItems.length > 0 ? Number((taxableAmount * 0.09).toFixed(2)) : 0;
  const totalAmount = cartItems.length > 0 ? Number((taxableAmount + deliveryFee + taxes).toFixed(2)) : 0;

  return (
    <div className="min-h-screen bg-[#FDF6EA] text-[#1C1917] flex flex-col selection:bg-[#9E141D]/15 selection:text-[#9E141D]">
      {/* ═══ SHARED HEADER (z-[100]) ═══ */}
      <BhaturaHeader onOpenAddressModal={() => setIsAddressModalOpen(true)} />

      <main className="flex-1 pb-24 md:pb-12">
        {/* ═══════════════════════════════════════════════════════════════════
            1. HERO BANNER ("ORDER ONLINE - Authentic Flavours Delivered To You")
            Uses clean contact_hero_bg.jpg (no extra left crop image)
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#180A05] min-h-[290px] sm:min-h-[350px] lg:min-h-[400px] flex items-center">
          <Image
            src={`${IMG}/contact_hero_bg.jpg`}
            alt="Authentic Chole Bhature platter at Bhatura & Co"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          {/* Soft atmospheric gradient on the left so text stays ultra-legible while right dish pops */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 via-48% to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 sm:py-12">
            <div className="max-w-xl">
              <span className="inline-block text-xs sm:text-sm font-bold text-[#F5C253] tracking-[0.22em] uppercase">
                Order Online
              </span>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-5xl lg:text-[54px] font-black leading-[1.08] mt-1.5 mb-3.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                <span className="text-white block">Authentic Flavours</span>
                <span className="text-[#F5C253] block mt-0.5">Delivered To You</span>
              </h1>
              <p className="text-white/90 text-xs sm:text-sm lg:text-[15.5px] leading-relaxed max-w-lg">
                Enjoy our delicious Chole Bhature and a wide range of North Indian favourites at your doorstep.
                Freshly prepared with love, tradition and the finest ingredients.
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

              {/* Lassi-Lounge-style Delivery & Pickup Live ETA Cards + Serviceability Check */}
              <div className="mt-5 w-full max-w-md">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                  {/* Delivery Box */}
                  <div
                    onClick={() => {
                      handleModeChange('delivery');
                      setIsAddressModalOpen(true);
                    }}
                    className={`relative flex items-center gap-3 px-3.5 sm:px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                      eta.isOutOfRange
                        ? 'bg-[#374151]/95 border-red-400/50 text-white shadow-md hover:bg-[#434d5b]'
                        : orderMode === 'delivery'
                        ? 'bg-gradient-to-r from-[#8B1E1E] to-[#5C0612] border-[#F5C253]/60 text-white shadow-lg hover:brightness-110'
                        : 'bg-black/55 backdrop-blur-sm border-white/25 text-white hover:border-[#F5C253]/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                      <Bike className={`w-5 h-5 ${eta.isOutOfRange ? 'text-red-300' : 'text-[#F5C253]'}`} />
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="font-bold text-sm leading-tight tracking-wide">Delivery</span>
                      <span
                        className={`text-[11.5px] font-medium tracking-wide mt-0.5 truncate ${
                          eta.isOutOfRange ? 'text-red-300 font-bold' : 'text-white/85'
                        }`}
                      >
                        {loadingEta ? (
                          <span className="inline-block w-12 h-3 bg-white/20 rounded animate-pulse" />
                        ) : eta.isOutOfRange ? (
                          'Out of range'
                        ) : deliveryAddress ? (
                          `${eta.delivery || 35} mins`
                        ) : (
                          'Set Address'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Pickup Box */}
                  <div
                    onClick={() => handleModeChange('pickup')}
                    className={`flex items-center gap-3 px-3.5 sm:px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                      orderMode === 'pickup'
                        ? 'bg-gradient-to-r from-[#8B1E1E] to-[#5C0612] border-[#F5C253]/60 text-white shadow-lg'
                        : 'bg-white/95 border-[#E5D7C3] text-[#1C1917] shadow-sm hover:border-[#F5C253]'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        orderMode === 'pickup' ? 'bg-white/15 text-[#F5C253]' : 'bg-[#8B1E1E]/10 text-[#8B1E1E]'
                      }`}
                    >
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="font-bold text-sm leading-tight tracking-wide">Pickup</span>
                      <span
                        className={`text-[11.5px] font-medium tracking-wide mt-0.5 ${
                          orderMode === 'pickup' ? 'text-white/85' : 'text-[#57534E]'
                        }`}
                      >
                        {loadingEta ? (
                          <span className="inline-block w-12 h-3 bg-stone-200 rounded animate-pulse" />
                        ) : (
                          `${eta.pickup || 15} mins`
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address Serviceability Prompt Below Boxes */}
                <div className="min-h-[22px] mt-2 flex items-center">
                  {deliveryAddress && eta.isOutOfRange ? (
                    <div className="flex items-center gap-2 max-w-full flex-wrap">
                      <p className="text-[11px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                        Out of range — Too far for delivery
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddressModalOpen(true)}
                        className="text-[11px] text-[#F5C253] hover:text-white font-bold uppercase tracking-wider underline cursor-pointer shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                      className="text-[11.5px] text-white/90 hover:text-[#F5C253] font-medium flex items-center gap-1.5 transition-colors truncate max-w-full cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#F5C253] shrink-0" />
                      <span className="truncate">
                        Delivering to: <strong className="text-white font-semibold">{deliveryAddress}</strong>
                      </span>
                      <span className="text-[#F5C253] underline font-bold ml-1 shrink-0">Change</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Smooth Cream Bottom Wave into Category Carousel */}
          <div className="absolute -bottom-[1px] left-0 right-0 h-8 sm:h-10 pointer-events-none z-10">
            <svg viewBox="0 0 1440 44" preserveAspectRatio="none" className="w-full h-full block">
              <path
                d="M0,26 C180,0 380,4 680,22 C940,37 1180,38 1440,10 L1440,44 L0,44 Z"
                fill="#FDF6EA"
              />
            </svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            2. HIGH Z-INDEX (z-[85]) CATEGORY CAROUSEL STRIP
            Non-sticky on mobile (<md), sticky on desktop (md:)
        ═══════════════════════════════════════════════════════════════════ */}
        {/* ═══ MOBILE: App-style sticky category chip bar (Swiggy / Zomato pattern) ═══ */}
        <div className="md:hidden sticky top-16 z-[85] bg-[#FDF6EA]/95 backdrop-blur-md border-b border-[#EADBC8] shadow-[0_6px_16px_rgba(92,6,18,0.08)]">
          <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9E141D]">Browse Menu</span>
            <span className="text-[10.5px] font-semibold text-[#78716C]">
              {categories.reduce((n, c) => n + (c.items?.length || 0), 0)} dishes • {categories.length} categories
            </span>
          </div>
          <div
            ref={chipStripRef}
            className="flex items-center gap-2 overflow-x-auto px-4 pb-2.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
          >
            {(loading ? Array.from({ length: 5 }).map((_, i) => ({ _id: `sk-${i}`, skeleton: true })) : categories).map((cat) => {
              if (cat.skeleton) {
                return <span key={cat._id} className="h-9 w-24 shrink-0 rounded-full bg-[#EFE3D2] animate-pulse" />;
              }
              const isActive = cat._id === activeCategoryId;
              const thumb = resolveImageUrl(cat.image) || getCategoryThumb(cat.name);
              return (
                <button
                  key={cat._id}
                  ref={(el) => {
                    chipBtnRefs.current[cat._id] = el;
                  }}
                  type="button"
                  onClick={() => handleSelectCategory(cat._id)}
                  className={`shrink-0 h-9 pl-1 pr-3.5 rounded-full flex items-center gap-2 text-[12.5px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#9E141D] to-[#7A0F16] text-white border-transparent shadow-[0_4px_12px_rgba(158,20,29,0.35)]'
                      : 'bg-white text-[#1C1917] border-[#E8D9C5]'
                  }`}
                >
                  <img
                    src={thumb}
                    alt=""
                    className={`w-7 h-7 rounded-full object-cover ${isActive ? 'ring-2 ring-[#F5B53D]' : ''}`}
                    onError={(e) => {
                      const fallback = getCategoryThumb(cat.name);
                      if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
                    }}
                  />
                  <span>{cat.name}</span>
                  <span className={`text-[10.5px] font-bold ${isActive ? 'text-[#F5D28A]' : 'text-[#A8A29E]'}`}>
                    {cat.items?.length || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <section
          className={`hidden md:block relative md:sticky md:top-[70px] z-[85] transition-all duration-200 border-b border-[#EADBC8] ${
            isStripStuck
              ? 'bg-[#FDF6EA] py-2 md:shadow-[0_6px_20px_rgba(92,6,18,0.12)]'
              : 'bg-[#FDF6EA] pt-2 sm:pt-3 pb-3.5 sm:pb-5'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Left Arrow */}
            <button
              type="button"
              onClick={() => scrollStrip(-1)}
              aria-label="Scroll categories left"
              className="hidden md:flex absolute left-1 lg:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-[#E5D5C0] items-center justify-center text-[#57534E] hover:bg-[#9E141D] hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft size={17} />
            </button>

            {/* Right Arrow */}
            <button
              type="button"
              onClick={() => scrollStrip(1)}
              aria-label="Scroll categories right"
              className="hidden md:flex absolute right-1 lg:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-[#E5D5C0] items-center justify-center text-[#57534E] hover:bg-[#9E141D] hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight size={17} />
            </button>

            <div
              ref={stripRef}
              className="flex items-center justify-between gap-4 sm:gap-6 overflow-x-auto scroll-smooth px-2 md:px-10 pt-2 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {loading
                ? Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center shrink-0">
                      <div className="w-[74px] h-[74px] sm:w-[82px] sm:h-[82px] rounded-full bg-[#EFE3D2] animate-pulse" />
                      <div className="w-16 h-3.5 mt-2 rounded bg-[#EFE3D2] animate-pulse" />
                    </div>
                  ))
                : categories.map((cat) => {
                    const isActive = cat._id === activeCategoryId;
                    const thumb = resolveImageUrl(cat.image) || getCategoryThumb(cat.name);
                    return (
                      <button
                        key={cat._id}
                        ref={(el) => {
                          catBtnRefs.current[cat._id] = el;
                        }}
                        type="button"
                        onClick={() => handleSelectCategory(cat._id)}
                        className="flex flex-col items-center shrink-0 group focus:outline-none cursor-pointer"
                      >
                        <span
                          className={`relative rounded-full p-[3px] transition-all duration-200 ${
                            isStripStuck
                              ? 'w-[50px] h-[50px] sm:w-[56px] sm:h-[56px]'
                              : 'w-[70px] h-[70px] sm:w-[82px] sm:h-[82px]'
                          } ${
                            isActive
                              ? 'bg-gradient-to-b from-[#C0262D] to-[#7A0F16] shadow-[0_6px_16px_rgba(158,20,29,0.32)] scale-105'
                              : 'bg-gradient-to-b from-[#E5C18E] to-[#B78349] shadow-xs group-hover:scale-105'
                          }`}
                        >
                          <span className="block w-full h-full rounded-full overflow-hidden bg-[#241109]">
                            <img
                              src={thumb}
                              alt={cat.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                const fallback = getCategoryThumb(cat.name);
                                if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
                              }}
                            />
                          </span>
                        </span>

                        <span
                          className={`mt-1.5 text-[11.5px] sm:text-[12.5px] font-bold whitespace-nowrap transition-all ${
                            isActive
                              ? 'px-3 py-0.5 rounded-[6px] bg-[#9E141D] text-white shadow-xs'
                              : 'text-[#1C1917] group-hover:text-[#9E141D]'
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

        {/* ═══════════════════════════════════════════════════════════════════
            3. TWO-COLUMN MAIN AREA
            - Left column: Dishes scroll container
            - Right column: Cart box; scrolling over it scrolls the page down
              so the footer smoothly comes into view!
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
          <div className="flex flex-col lg:flex-row items-start gap-6 xl:gap-7">
            
            {/* ───────────────────────────────────────────────────────────────
                LEFT COLUMN: SEARCH + PROMO BANNER + CATEGORY SECTIONS
                On desktop, has independent smooth scroll so items scroll
                cleanly without moving the cart or window!
            ─────────────────────────────────────────────────────────────── */}
            <div
              ref={leftColRef}
              style={
                rightColHeight && isDesktop
                  ? { height: `${rightColHeight}px` }
                  : undefined
              }
              className="relative flex-1 w-full min-w-0 lg:overflow-y-auto lg:pr-3 [scrollbar-width:thin] [scrollbar-color:#D8C4AB_transparent] scroll-smooth pb-8"
            >
              
              {/* A. Search Bar + Delivery / Pickup Toggle Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8074]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for dishes, e.g. Chole Bhature, Paratha, Paneer..."
                    className="w-full h-11 pl-10 pr-9 rounded-lg border border-[#E5D7C3] bg-white text-sm text-[#1C1917] placeholder:text-[#9C9084] focus:outline-none focus:border-[#9E141D] shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8074] hover:text-[#9E141D]"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Delivery / Pickup Toggle Pill */}
                <div className="flex items-center bg-white rounded-lg border border-[#E5D7C3] p-1 shrink-0 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleModeChange('delivery')}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-md text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                      orderMode === 'delivery'
                        ? 'bg-[#9E141D] text-white shadow-xs'
                        : 'text-[#57534E] hover:text-[#9E141D]'
                    }`}
                  >
                    <Bike size={16} />
                    <span>Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('pickup')}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-md text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                      orderMode === 'pickup'
                        ? 'bg-[#9E141D] text-white shadow-xs'
                        : 'text-[#9E141D] hover:bg-[#9E141D]/5'
                    }`}
                  >
                    <Store size={15} />
                    <span>Pickup</span>
                  </button>
                </div>
              </div>

              {/* B. "Get 20% Off On Your First Online Order" Banner */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#3B0609] via-[#7A0E16] to-[#52080E] border border-[#9E141D]/30 shadow-[0_8px_24px_rgba(92,6,18,0.14)] mt-4 mb-6">
                {/* Decorative Mandala Glow on Right */}
                <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full border border-[#F2C15A]/20 pointer-events-none" />
                <div className="absolute right-8 -top-8 w-28 h-28 rounded-full border border-[#F2C15A]/15 pointer-events-none" />

                <div className="grid grid-cols-1 sm:grid-cols-12 items-center">
                  {/* Left Dish Platter Image */}
                  <div className="sm:col-span-5 relative h-[135px] sm:h-[155px] overflow-hidden">
                    <img
                      src={`${IMG}/offer_plate_maroon.jpg`}
                      alt="Chole Bhature Platter"
                      className="w-full h-full object-cover object-center scale-105"
                      style={{
                        WebkitMaskImage: 'linear-gradient(to right, #000 72%, transparent 100%)',
                        maskImage: 'linear-gradient(to right, #000 72%, transparent 100%)',
                      }}
                    />
                  </div>

                  {/* Right Offer Copy + Dashed Code Box */}
                  <div className="sm:col-span-7 px-5 py-4 sm:py-3.5 text-center sm:text-left flex flex-col items-center sm:items-start justify-center">
                    <h2 className="font-['Playfair_Display'] text-2xl sm:text-[34px] font-black text-white leading-tight drop-shadow-xs">
                      Get 20% Off
                    </h2>
                    <p className="text-[#F2C15A] text-sm sm:text-[17px] font-bold mt-0.5">
                      On Your First Online Order
                    </p>

                    <div className="mt-2.5 inline-flex items-center gap-3 px-4 py-1.5 rounded-lg border border-dashed border-[#F2C15A]/80 bg-black/25 text-white">
                      <span className="text-xs sm:text-[13px] font-medium text-white/90">
                        Use Code: <strong className="font-extrabold tracking-wider text-white">BHATURA20</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCoupon}
                        aria-label="Copy coupon code BHATURA20"
                        className="p-1 rounded hover:bg-white/10 text-[#F2C15A] transition-colors cursor-pointer"
                      >
                        {copiedCode ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* C. Stacked Category Sections */}
              {loading ? (
                <div className="space-y-8">
                  {Array.from({ length: 3 }).map((_, sIdx) => (
                    <div key={sIdx}>
                      <div className="h-7 w-56 bg-[#EFE3D2] rounded animate-pulse mb-4" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((__, cIdx) => (
                          <div key={cIdx} className="bg-white rounded-xl border border-[#EFE3D3] overflow-hidden">
                            <div className="h-[150px] bg-[#EFE3D2] animate-pulse" />
                            <div className="p-3.5 space-y-2">
                              <div className="h-4 w-2/3 bg-[#EFE3D2] rounded animate-pulse" />
                              <div className="h-3 w-full bg-[#EFE3D2] rounded animate-pulse" />
                              <div className="h-9 w-full bg-[#EFE3D2] rounded animate-pulse mt-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#EADBC8] p-12 text-center">
                  <SearchX className="w-10 h-10 text-[#9E141D] mx-auto mb-2.5" />
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1C1917]">
                    No dishes found for &ldquo;{searchQuery}&rdquo;
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B625A] mt-1">
                    Try searching for Chole Bhature, Paratha, Paneer, Dal or Lassi.
                  </p>
                </div>
              ) : (
                <div className="space-y-8 pb-8">
                  {filteredCategories.map((cat, catIdx) => {
                    const totalInCat = (cat.items || []).length;
                    const isExpanded = Boolean(expandedCategories[cat._id] || searchQuery.trim() || isMobile);
                    const visibleItems = isExpanded ? cat.items : (cat.items || []).slice(0, 3);
                    const isFeaturedFirstSection = catIdx === 0;

                    return (
                      <div
                        key={cat._id}
                        ref={(el) => {
                          sectionRefs.current[cat._id] = el;
                        }}
                        className="scroll-mt-[124px] md:scroll-mt-6"
                      >
                        {/* Section Header Row */}
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <div className="flex flex-wrap items-baseline gap-2.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <CategoryHeadingIcon index={catIdx} name={cat.name} />
                              <h3 className="font-['Playfair_Display'] text-2xl sm:text-[27px] font-black text-[#8B1E1E] leading-none">
                                {cat.name}
                              </h3>
                            </div>
                            <span className="text-xs sm:text-[13px] text-[#57534E] font-medium">
                              {getCategorySubtitle(cat)}
                            </span>
                            <Squiggle className="hidden sm:inline-block w-11 h-2 text-[#9E141D]/70 self-center" />
                          </div>

                          {totalInCat > 3 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCategories((prev) => ({
                                  ...prev,
                                  [cat._id]: !prev[cat._id],
                                }))
                              }
                              className="hidden md:inline-flex shrink-0 text-xs sm:text-[13px] font-bold text-[#9E141D] hover:text-[#6E0D14] items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[#9E141D]/5 transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <>
                                  <span>Show Less</span>
                                  <ChevronUp size={14} />
                                </>
                              ) : (
                                <>
                                  <span>View All ({totalInCat})</span>
                                  <ArrowRight size={14} />
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* 3-Column Dish Cards Grid (Scrollable box on mobile when expanded with >6 items) */}
                        <div className="flex flex-col gap-3 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-4">
                          {visibleItems.map((item) => {
                            const inCartQty = getItemQuantity(item);
                            const isFav = user?.favoriteItems?.some((f) => (f._id || f) === item._id);
                            const imgSrc = resolveImageUrl(item.image) || getDishImage(item.name);

                            if (isMobile) {
                              return (
                                <article
                                  key={item._id}
                                  onClick={() => router.push(getItemUrl(item, RESTAURANT_ID))}
                                  className="relative flex gap-3 bg-white rounded-2xl border border-[#EDE0CE] p-3 shadow-[0_3px_14px_rgba(92,6,18,0.06)] active:scale-[0.99] transition-transform cursor-pointer"
                                >
                                  {/* Left: Info */}
                                  <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`w-[14px] h-[14px] bg-white rounded-[3px] border-[1.5px] flex items-center justify-center shrink-0 ${
                                          item.isVeg === false ? 'border-[#C0262D]' : 'border-[#15803D]'
                                        }`}
                                      >
                                        <span className={`w-[6px] h-[6px] rounded-full ${item.isVeg === false ? 'bg-[#C0262D]' : 'bg-[#15803D]'}`} />
                                      </span>
                                      {isFeaturedFirstSection && (
                                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#B45309] bg-[#FEF3C7] px-1.5 py-[1px] rounded">
                                          ★ Bestseller
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="font-['Playfair_Display'] font-bold text-[16px] text-[#1C1917] leading-snug mt-1 line-clamp-2">
                                      {item.name}
                                    </h4>
                                    <span className="text-[15px] font-black text-[#9E141D] mt-0.5">
                                      ${Number(item.price || 0).toFixed(2)}
                                    </span>
                                    <p className="text-[11.5px] text-[#6B625A] leading-relaxed line-clamp-2 mt-1">
                                      {item.description || 'Traditional North Indian delicacy prepared fresh with authentic spices.'}
                                    </p>
                                  </div>

                                  {/* Right: Image + floating ADD / stepper */}
                                  <div className="relative w-[112px] shrink-0 pb-4">
                                    <div className="relative w-[112px] h-[104px] rounded-xl overflow-hidden bg-[#231109] shadow-sm">
                                      <img
                                        src={imgSrc}
                                        alt={item.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const f = getDishImage(item.name);
                                          if (!e.currentTarget.src.endsWith(f)) e.currentTarget.src = f;
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={(e) => handleToggleFavorite(item, e)}
                                        aria-label={`Favourite ${item.name}`}
                                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/45 text-white flex items-center justify-center"
                                      >
                                        <Heart size={12} className={isFav ? 'fill-[#E11D2A] text-[#E11D2A]' : 'text-white'} />
                                      </button>
                                    </div>

                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[92px]"
                                    >
                                      {inCartQty > 0 ? (
                                        <div className="h-9 rounded-lg bg-[#9E141D] text-white flex items-center justify-between shadow-[0_6px_14px_rgba(158,20,29,0.35)] overflow-hidden">
                                          <button
                                            type="button"
                                            onClick={(e) => handleCardStepMinus(item, e)}
                                            aria-label="Decrease quantity"
                                            className="w-8 h-full flex items-center justify-center active:bg-black/20"
                                          >
                                            <Minus size={14} strokeWidth={3} />
                                          </button>
                                          <span className="text-[13px] font-extrabold">{inCartQty}</span>
                                          <button
                                            type="button"
                                            onClick={(e) => handleCardAddOrPlus(item, e)}
                                            aria-label="Increase quantity"
                                            className="w-8 h-full flex items-center justify-center active:bg-black/20"
                                          >
                                            <Plus size={14} strokeWidth={3} />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={(e) => handleCardAddOrPlus(item, e)}
                                          className="w-full h-9 rounded-lg bg-white border border-[#9E141D]/40 text-[#9E141D] text-[13px] font-extrabold tracking-wide shadow-[0_6px_14px_rgba(92,6,18,0.18)] active:scale-95 transition-transform flex items-center justify-center gap-1"
                                        >
                                          ADD <Plus size={13} strokeWidth={3} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </article>
                              );
                            }

                            return (
                              <article
                                key={item._id}
                                onClick={() => router.push(getItemUrl(item, RESTAURANT_ID))}
                                className="group bg-white rounded-xl border border-[#EDE0CE] shadow-[0_3px_14px_rgba(92,6,18,0.05)] hover:shadow-[0_10px_26px_rgba(139,30,30,0.13)] transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                              >
                                {/* Dish Image */}
                                <div className="relative h-[152px] w-full overflow-hidden bg-[#231109]">
                                  <img
                                    src={imgSrc}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                      const f = getDishImage(item.name);
                                      if (!e.currentTarget.src.endsWith(f)) e.currentTarget.src = f;
                                    }}
                                  />

                                  {/* Top-Right Favourite Heart Circle */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleFavorite(item, e)}
                                    aria-label={`Favourite ${item.name}`}
                                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                                  >
                                    <Heart
                                      size={14}
                                      className={isFav ? 'fill-[#E11D2A] text-[#E11D2A]' : 'text-white'}
                                    />
                                  </button>

                                  {/* Bottom-Left Veg Badge */}
                                  <span
                                    className={`absolute bottom-2.5 left-2.5 w-4 h-4 bg-white rounded-[3px] border-[1.5px] flex items-center justify-center shadow-2xs ${
                                      item.isVeg === false ? 'border-[#C0262D]' : 'border-[#15803D]'
                                    }`}
                                  >
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        item.isVeg === false ? 'bg-[#C0262D]' : 'bg-[#15803D]'
                                      }`}
                                    />
                                  </span>
                                </div>

                                {/* Card Content */}
                                <div className="p-3.5 flex-1 flex flex-col justify-between">
                                  <div>
                                    <h4 className="font-['Playfair_Display'] font-bold text-[15px] text-[#1C1917] leading-snug line-clamp-1">
                                      {item.name}
                                    </h4>
                                    <p className="text-[11.5px] text-[#6B625A] leading-relaxed line-clamp-2 mt-1 min-h-[34px]">
                                      {item.description ||
                                        'Traditional North Indian delicacy prepared fresh with authentic spices.'}
                                    </p>
                                  </div>

                                  {isFeaturedFirstSection ? (
                                    /* First section ("Chole Bhature"): Price + Real Cart Stepper (0 when not in cart), then full-width Add to Cart button */
                                    <div className="mt-3 pt-2 border-t border-[#F4ECE0]" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-between mb-2.5">
                                        <span className="text-[18px] font-black text-[#9E141D]">
                                          ${Number(item.price || 0).toFixed(2)}
                                        </span>

                                        <div className="inline-flex items-center h-7 rounded-md border border-[#E2D4C1] bg-[#FBF6EE] overflow-hidden">
                                          <button
                                            type="button"
                                            disabled={inCartQty === 0}
                                            onClick={(e) => handleCardStepMinus(item, e)}
                                            aria-label="Decrease quantity"
                                            className="w-7 h-full flex items-center justify-center text-[#57534E] hover:bg-[#EFE3D2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                          >
                                            <Minus size={12} strokeWidth={2.5} />
                                          </button>
                                          <span className="min-w-[24px] text-center text-xs font-bold text-[#1C1917]">
                                            {inCartQty}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => handleCardAddOrPlus(item, e)}
                                            aria-label="Increase quantity"
                                            className="w-7 h-full flex items-center justify-center text-[#57534E] hover:bg-[#EFE3D2] transition-colors cursor-pointer"
                                          >
                                            <Plus size={12} strokeWidth={2.5} />
                                          </button>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => handleCardAddOrPlus(item, e)}
                                        className="w-full h-9 rounded-lg bg-[#9E141D] hover:bg-[#7D0F17] active:scale-[0.99] text-white text-xs sm:text-[13px] font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                                      >
                                        <ShoppingCart size={14} />
                                        <span>{inCartQty > 0 ? `In Cart (${inCartQty}) • Add +1` : 'Add to Cart'}</span>
                                      </button>
                                    </div>
                                  ) : (
                                    /* Other sections ("Parathas", "Curries", etc.): Single compact row with Price + Real Cart Stepper (0 when not in cart) + Add to Cart button */
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-3 pt-2.5 border-t border-[#F4ECE0] flex items-center justify-between gap-1.5"
                                    >
                                      <span className="text-[16px] font-black text-[#9E141D] shrink-0">
                                        ${Number(item.price || 0).toFixed(2)}
                                      </span>

                                      <div className="inline-flex items-center h-7 rounded-md border border-[#E2D4C1] bg-[#FBF6EE] overflow-hidden shrink-0">
                                        <button
                                          type="button"
                                          disabled={inCartQty === 0}
                                          onClick={(e) => handleCardStepMinus(item, e)}
                                          aria-label="Decrease quantity"
                                          className="w-6 h-full flex items-center justify-center text-[#57534E] hover:bg-[#EFE3D2] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                          <Minus size={11} strokeWidth={2.5} />
                                        </button>
                                        <span className="min-w-[20px] text-center text-[11px] font-bold text-[#1C1917]">
                                          {inCartQty}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => handleCardAddOrPlus(item, e)}
                                          aria-label="Increase quantity"
                                          className="w-6 h-full flex items-center justify-center text-[#57534E] hover:bg-[#EFE3D2] cursor-pointer"
                                        >
                                          <Plus size={11} strokeWidth={2.5} />
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => handleCardAddOrPlus(item, e)}
                                        className="h-7 px-2.5 rounded-md bg-[#9E141D] hover:bg-[#7D0F17] text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                                      >
                                        {inCartQty > 0 ? `Added (${inCartQty})` : 'Add to Cart'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ───────────────────────────────────────────────────────────────
                RIGHT COLUMN: "YOUR ORDER" SIDEBAR
                Natural page flow: scrolling over this area scrolls the page,
                smoothly bringing the footer into view!
            ─────────────────────────────────────────────────────────────── */}
            <aside ref={rightColRef} className="hidden md:block w-full lg:w-[350px] xl:w-[365px] shrink-0">
              
              {/* 1. Top "Deliver to" Address Pill Card */}
              <div
                className={`rounded-xl border px-3.5 py-2.5 mb-3 flex items-center justify-between gap-2 shadow-2xs ${
                  orderMode === 'delivery' && eta.isOutOfRange
                    ? 'bg-red-50 border-red-300'
                    : 'bg-[#FAF0E1] border-[#E8D8C3]'
                }`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <MapPin
                    size={16}
                    className={`shrink-0 mt-0.5 ${
                      orderMode === 'delivery' && eta.isOutOfRange
                        ? 'text-red-600 fill-red-600/15'
                        : 'text-[#9E141D] fill-[#9E141D]/15'
                    }`}
                  />
                  <div className="min-w-0">
                    <span
                      className={`block text-[11px] font-bold leading-tight ${
                        orderMode === 'delivery' && eta.isOutOfRange ? 'text-red-700' : 'text-[#1C1917]'
                      }`}
                    >
                      {orderMode === 'pickup'
                        ? `Pickup from (~${eta.pickup || 15} mins)`
                        : eta.isOutOfRange
                        ? 'Out of range — Too far for delivery'
                        : `Deliver to${eta.delivery ? ` (~${eta.delivery} mins)` : ''}`}
                    </span>
                    <span className="block text-[11.5px] text-[#57534E] truncate">
                      {orderMode === 'pickup'
                        ? restaurant?.address?.street || '123 Main Street, New York, NY 10001'
                        : deliveryAddress}
                    </span>
                  </div>
                </div>
                {orderMode === 'delivery' && (
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="text-xs font-bold text-[#9E141D] underline hover:text-[#6E0D14] shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* 2. Main "Your Order" Card */}
              <div className="bg-[#FAF0E1] rounded-2xl border border-[#E8D8C3] p-4 shadow-[0_8px_28px_rgba(92,6,18,0.06)]">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E6D5BE]">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={19} className="text-[#9E141D]" strokeWidth={2.2} />
                    <h2 className="font-['Playfair_Display'] text-xl font-black text-[#8B1E1E]">
                      Your Order
                    </h2>
                    <span className="text-xs font-semibold text-[#57534E]">
                      ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        clearCart();
                        toast.success('Cart cleared');
                      }}
                      className="text-xs font-bold text-[#9E141D] underline hover:text-[#6E0D14] cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Cart Items List */}
                {cartItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#9E141D]/10 text-[#9E141D] flex items-center justify-center mx-auto mb-2.5">
                      <ShoppingCart size={22} />
                    </div>
                    <p className="text-sm font-bold text-[#1C1917]">Your order basket is empty</p>
                    <p className="text-xs text-[#6B625A] mt-1">
                      Add delicious bhature, parathas or curries from the menu to get started.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E6D5BE]">
                    {cartItems.map((ci, idx) => {
                      const qty = ci.quantity || ci.qty || 1;
                      const unitPrice = Number(ci.selectedSize?.price ?? ci.price ?? 0);
                      const thumb = resolveImageUrl(ci.image) || getDishImage(ci.name);
                      return (
                        <div key={`${ci.menuItemId || ci._id || idx}-${idx}`} className="py-3 flex items-center gap-3">
                          <img
                            src={thumb}
                            alt={ci.name}
                            className="w-14 h-14 rounded-lg object-cover border border-[#E2D2BC] shrink-0 bg-[#231109]"
                            onError={(e) => {
                              const f = getDishImage(ci.name);
                              if (!e.currentTarget.src.endsWith(f)) e.currentTarget.src = f;
                            }}
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className="font-['Playfair_Display'] text-[13.5px] font-bold text-[#1C1917] truncate">{ci.name}</h4>
                            <p className="text-[13px] font-extrabold text-[#9E141D] mt-0.5">
                              ${unitPrice.toFixed(2)}
                            </p>

                            {/* Stepper */}
                            <div className="inline-flex items-center h-6 rounded border border-[#DFC0A8] bg-white mt-1 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateQuantity(idx, qty - 1)}
                                aria-label="Decrease item quantity"
                                className="w-6 h-full flex items-center justify-center text-[#57534E] hover:bg-[#F5E9D8] cursor-pointer"
                              >
                                <Minus size={11} strokeWidth={2.5} />
                              </button>
                              <span className="min-w-[22px] text-center text-xs font-bold text-[#1C1917]">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(idx, qty + 1)}
                                aria-label="Increase item quantity"
                                className="w-6 h-full flex items-center justify-center text-[#57534E] hover:bg-[#F5E9D8] cursor-pointer"
                              >
                                <Plus size={11} strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            aria-label={`Remove ${ci.name}`}
                            className="p-1.5 text-[#9E141D] hover:bg-[#9E141D]/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Special Instructions */}
                <div className="pt-3 border-t border-[#E6D5BE]">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                    <FileText size={13} className="text-[#9E141D]" />
                    <span>Add Special Instructions</span>
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. No onion, extra spicy, etc."
                    className="mt-1.5 w-full h-9 px-3 rounded-lg border border-[#E2D3C0] bg-white text-xs text-[#1C1917] placeholder:text-[#9C9084] focus:outline-none focus:border-[#9E141D]"
                  />
                </div>

                {/* Bill Breakdown */}
                <div className="mt-3 pt-3 border-t border-[#E6D5BE] space-y-1.5 text-[13px]">
                  <div className="flex items-center justify-between text-[#44403C]">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="font-bold text-[#1C1917]">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#44403C]">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-[#1C1917]">${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#44403C]">
                    <span>Taxes</span>
                    <span className="font-bold text-[#1C1917]">${taxes.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-[#15803D] font-semibold">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-2 mt-1.5 border-t border-[#E6D5BE] flex items-center justify-between">
                    <span className="text-base font-extrabold text-[#1C1917]">Total</span>
                    <span className="text-xl font-black text-[#9E141D]">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Proceed to Checkout Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (cartItems.length === 0) {
                      toast.error('Please add at least one dish to proceed to checkout');
                      return;
                    }
                    if (orderMode === 'delivery' && eta.isOutOfRange) {
                      toast.error('Selected address is out of delivery range. Please change address or select Pickup.');
                      setIsAddressModalOpen(true);
                      return;
                    }
                    router.push('/checkout');
                  }}
                  className="mt-3.5 w-full h-11 rounded-xl bg-gradient-to-b from-[#A61922] to-[#7A1218] hover:from-[#8B1E1E] hover:to-[#5C0612] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(158,20,29,0.28)] transition-all cursor-pointer"
                >
                  <ShoppingCart size={16} />
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </button>

                {/* Coupon Code Box */}
                <form onSubmit={handleApplyCoupon} noValidate className="mt-3.5 pt-3 border-t border-[#E6D5BE]">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917] mb-1.5">
                    <Tag size={13} className="text-[#9E141D] fill-[#9E141D]" />
                    <span>Have a Coupon Code?</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponError) setCouponError('');
                      }}
                      placeholder="Enter coupon code"
                      className={`flex-1 h-9 px-3 rounded-lg border text-xs font-semibold text-[#1C1917] placeholder:font-normal placeholder:text-[#9C9084] focus:outline-none transition-colors ${
                        couponError
                          ? 'border-red-500 bg-red-50/20 focus:border-red-500'
                          : 'border-[#E2D3C0] bg-white focus:border-[#9E141D]'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="h-9 px-4 rounded-lg bg-[#9E141D] hover:bg-[#7A1218] text-white text-xs font-bold transition-colors shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-red-600 text-[11px] font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0 text-red-500" />
                      <span>{couponError}</span>
                    </p>
                  )}
                </form>

                {/* 3 Info Rows (Estimated Delivery, Delivery To, Safe & Secure Payment) */}
                <div className="mt-3.5 pt-3 border-t border-[#E6D5BE] space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Clock size={16} className="text-[#9E141D] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#1C1917] leading-tight">
                        {orderMode === 'pickup' ? 'Estimated Pickup Time' : 'Estimated Delivery Time'}
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 font-medium ${
                          orderMode === 'delivery' && eta.isOutOfRange ? 'text-red-600 font-bold' : 'text-[#57534E]'
                        }`}
                      >
                        {loadingEta
                          ? 'Checking ETA...'
                          : orderMode === 'pickup'
                          ? `${eta.pickup || 15} - ${(eta.pickup || 15) + 5} mins`
                          : eta.isOutOfRange
                          ? 'Out of range — Too far for delivery'
                          : eta.delivery
                          ? `~${eta.delivery} mins`
                          : '30 - 45 mins'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <MapPin size={16} className="text-[#9E141D] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-bold text-[#1C1917] leading-tight">Delivery to</p>
                        <p className="text-[#57534E] text-[11px] mt-0.5 leading-snug">
                          {deliveryAddress}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                      className="text-[11px] font-bold text-[#9E141D] underline shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-[#9E141D] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#1C1917] leading-tight">Safe &amp; Secure Payment</p>
                      <p className="text-[#57534E] text-[11px] mt-0.5">100% Secure Checkout</p>
                    </div>
                  </div>
                </div>

                {/* Payment Method Badges */}
                <div className="mt-3 pt-2.5 border-t border-[#E6D5BE] flex items-center justify-between gap-1.5">
                  <span className="h-6 px-2 rounded bg-white border border-[#E2D3C0] text-[#1A1F71] font-black italic text-[11px] flex items-center justify-center">
                    VISA
                  </span>
                  <span className="h-6 px-2 rounded bg-white border border-[#E2D3C0] flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-[#EB001B] inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#F79E1B] inline-block -ml-1.5" />
                  </span>
                  <span className="h-6 px-2 rounded bg-[#006FCF] text-white font-black text-[9.5px] tracking-tight flex items-center justify-center">
                    AMEX
                  </span>
                  <span className="h-6 px-2 rounded bg-white border border-[#E2D3C0] text-[#1C1917] font-bold text-[10.5px] flex items-center justify-center">
                     Pay
                  </span>
                  <span className="h-6 px-2 rounded bg-white border border-[#E2D3C0] text-[#1C1917] font-bold text-[10.5px] flex items-center justify-center">
                    <span className="text-[#4285F4] font-extrabold mr-0.5">G</span>Pay
                  </span>
                </div>
              </div>
            </aside>

          </div>
        </section>
      </main>

      {/* ═══ SHARED FOOTER ═══ */}
      <BhaturaFooter />

      {/* ═══ ADDRESS MODAL ═══ */}
      {isAddressModalOpen && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          onSelect={(locationData) => {
            if (locationData) {
              const { address, lat, lng, addressDetails, flatNo } = locationData;
              const addr = addressDetails || {};
              const streetBase = `${addr.house_number || ''} ${addr.road || ''}`.trim();
              const rawText =
                address ||
                locationData.formattedAddress ||
                [locationData.street, locationData.city, locationData.state, locationData.zipCode]
                  .filter(Boolean)
                  .join(', ');

              if (rawText) {
                const parsed = parseAddressString(rawText, {
                  street: streetBase || locationData.street || undefined,
                  addressLine2: flatNo || locationData.addressLine2 || undefined,
                  city: addr.city || addr.town || addr.village || addr.suburb || locationData.city || undefined,
                  state: addr.state
                    ? addr.state.substring(0, 2).toUpperCase()
                    : locationData.state || undefined,
                  zipCode: addr.postcode
                    ? addr.postcode.substring(0, 5)
                    : locationData.zipCode || undefined,
                  lat: lat ?? null,
                  lng: lng ?? null,
                  label: 'Pinned Location',
                });

                setDeliveryAddress(parsed.formattedAddress || rawText);
                setSelectedCoords({ lat: parsed.lat, lng: parsed.lng });
                try {
                  localStorage.setItem('bhatura_selected_address', JSON.stringify(parsed));
                  window.dispatchEvent(new Event('bhatura-address-updated'));
                } catch {
                  /* ignore */
                }
              }
            }
            setIsAddressModalOpen(false);
          }}
        />
      )}

      {/* ═══ ITEM CUSTOMIZATION MODAL (Lassi Lounge Flow) ═══ */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={(item, quantity, selectedSize, selectedAddOns, instructions) => {
            performAddToCart(item, {
              size: selectedSize,
              addOns: selectedAddOns,
              instructions,
              quantity,
            });
            setSelectedItem(null);
          }}
        />
      )}

      {/* ═══ REPEAT CUSTOMIZATION MODAL (Lassi Lounge Flow) ═══ */}
      {repeatModal && (
        <PortalModal isOpen={true} onClose={() => setRepeatModal(null)} title="Repeat Customization?" size="sm">
          <div className="space-y-4 text-[#1C1917]">
            <p className="text-sm text-[#57534E]">
              You already have <strong>{repeatModal.lastCartItem?.name}</strong> in your order. Would you like to repeat the same customization or choose new options?
            </p>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(repeatModal.item);
                  setRepeatModal(null);
                }}
                className="flex-1 py-2.5 rounded-lg border border-[#9E141D] text-[#9E141D] font-bold text-xs uppercase tracking-wider"
              >
                Choose New
              </button>
              <button
                type="button"
                onClick={() => {
                  performAddToCart(repeatModal.item, {
                    size: repeatModal.lastCartItem?.selectedSize,
                    addOns: repeatModal.lastCartItem?.addOns,
                    instructions: repeatModal.lastCartItem?.specialInstructions,
                  });
                  setRepeatModal(null);
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#9E141D] text-white font-bold text-xs uppercase tracking-wider"
              >
                Repeat Last
              </button>
            </div>
          </div>
        </PortalModal>
      )}

      {/* ═══ RESTAURANT CONFLICT MODAL ═══ */}
      {conflictModal && (
        <PortalModal isOpen={true} onClose={() => setConflictModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-auto">
            <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1C1917] mb-2">Start a new cart?</h3>
            <p className="text-sm text-[#57534E] mb-4">
              Your cart contains items from another order. Adding this dish will clear your current cart.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConflictModal(null)}
                className="flex-1 py-2 rounded-xl border border-[#E5D7C3] text-sm font-bold text-[#57534E]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  switchRestaurant(conflictModal.item, restaurant);
                  setConflictModal(null);
                }}
                className="flex-1 py-2 rounded-xl bg-[#9E141D] text-white text-sm font-bold"
              >
                Yes, start fresh
              </button>
            </div>
          </div>
        </PortalModal>
      )}
    </div>
  );
}

export default function BhaturaOrderOnlinePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDF6EA]" />}>
      <OrderOnlineInner />
    </Suspense>
  );
}
