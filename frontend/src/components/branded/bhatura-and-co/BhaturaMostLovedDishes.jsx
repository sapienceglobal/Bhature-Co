'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { restaurantAPI, authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co';

const defaultDishes = [
  {
    _id: '6ae0af85c3e1fc7e6e12be0a',
    name: 'Chole Bhature',
    price: 12.99,
    description: 'Classic punjabi chole with fluffy bhature',
    image: '/assets/images/branded/bhatura-and-co/dish_chole_bhature_exact.png',
    isVeg: true,
  },
  {
    _id: '6ae0af85c3e1fc7e6e12be0b',
    name: 'Aloo Paratha',
    price: 9.99,
    description: 'Stuffed with spiced potatoes, served with curd',
    image: '/assets/images/branded/bhatura-and-co/dish_aloo_paratha_exact.png',
    isVeg: true,
  },
  {
    _id: '6ae0af85c3e1fc7e6e12be0c',
    name: 'Paneer Butter Masala',
    price: 13.99,
    description: 'Rich, creamy and full of flavour',
    image: '/assets/images/branded/bhatura-and-co/dish_paneer_butter_masala_exact.png',
    isVeg: true,
  },
  {
    _id: '6ae0af85c3e1fc7e6e12be0d',
    name: 'Veg Biryani',
    price: 11.99,
    description: 'Aromatic basmati rice with mixed vegetables',
    image: '/assets/images/branded/bhatura-and-co/dish_veg_biryani_exact.png',
    isVeg: true,
  },
  {
    _id: '6ae0af85c3e1fc7e6e12be0e',
    name: 'Samosa (2 pcs)',
    price: 6.99,
    description: 'Crispy pastry with spiced potato filling',
    image: '/assets/images/branded/bhatura-and-co/dish_samosa_exact.png',
    isVeg: true,
  },
];

export default function BhaturaMostLovedDishes() {
  const [dishes, setDishes] = useState(defaultDishes);
  const [restaurantData, setRestaurantData] = useState(null);
  const [favorites, setFavorites] = useState({});
  const { getItemQuantity, incrementItem, decrementItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const scrollRef = useRef(null);

  // Sync with live backend menu items so IDs and prices always match the Menu page & DB
  useEffect(() => {
    let alive = true;
    restaurantAPI
      .getById(RESTAURANT_ID)
      .then((res) => {
        if (!alive || !res?.data) return;
        setRestaurantData(res.data);
        const allBackendItems = (res.data.menu || []).flatMap((cat) => cat.items || []);
        if (allBackendItems.length > 0) {
          setDishes((prev) =>
            prev.map((d) => {
              const match = allBackendItems.find(
                (bi) =>
                  String(bi._id) === String(d._id) ||
                  (bi.name && bi.name.toLowerCase().trim() === d.name.toLowerCase().trim())
              );
              if (!match) return d;
              return {
                ...d,
                _id: match._id,
                price: Number(match.price ?? d.price),
                description: match.description || d.description,
                isVeg: match.isVeg !== false,
              };
            })
          );
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (user?.favoriteItems?.length) {
      const favMap = {};
      user.favoriteItems.forEach((f) => {
        favMap[String(f._id || f)] = true;
      });
      setFavorites((prev) => ({ ...prev, ...favMap }));
    }
  }, [user?.favoriteItems]);

  const toggleFavorite = async (id) => {
    const nextState = !favorites[id];
    setFavorites((prev) => ({ ...prev, [id]: nextState }));
    toast.success(nextState ? 'Saved to favorites ❤️' : 'Removed from favorites', { duration: 1500 });
    if (isAuthenticated) {
      try {
        await authAPI.toggleFavoriteItem(id);
      } catch {
        // ignore
      }
    }
  };

  const handleAddToCart = (dish) => {
    const prevQty = getItemQuantity(dish);
    incrementItem(
      {
        _id: dish._id,
        menuItemId: dish._id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        isVeg: dish.isVeg,
        quantity: 1,
      },
      restaurantData
    );
    if (prevQty === 0) {
      toast.success(`Added ${dish.name} to cart! 🛒`, { duration: 1800 });
    }
  };

  const handleDecrement = (dish) => {
    decrementItem(dish);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="pt-2 pb-14 sm:pb-16 bg-gradient-to-b from-[#F7E6D2] via-[#F8E9D7] to-[#F6E4CE] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-7 gap-4">
          <div>
            <span className="flex items-center gap-2 text-xl sm:text-2xl font-['Playfair_Display'] italic font-semibold text-[#C0262D] mb-1">
              <span className="w-5 h-[2px] bg-[#D48228]" />
              Chef&apos;s Special
              <span className="w-5 h-[2px] bg-[#D48228]" />
            </span>
            <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-[46px] font-black text-[#1C1917]">
              Most <span className="text-[#8B1E1E]">Loved Dishes</span>
            </h2>
            <p className="text-sm text-[#57534E] mt-1">
              Our signature dishes, loved by thousands for their authentic taste and quality.
            </p>
          </div>

          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#8B1E1E] text-[#8B1E1E] hover:bg-[#8B1E1E] hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 self-start sm:self-auto shadow-sm"
          >
            <span>View All Dishes</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Carousel Container with Far Left & Far Right Arrow Buttons */}
        <div className="relative">
          {/* Far Left Arrow Button */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-md border border-[#E5DED4] hover:bg-[#8B1E1E] hover:text-white text-[#1C1917] items-center justify-center transition-all duration-200"
            aria-label="Previous dishes"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Dishes Cards Grid */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5 scrollbar-none scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {dishes.map((dish) => {
              const qty = getItemQuantity(dish);

              return (
                <div
                  key={dish._id}
                  className="w-[220px] shrink-0 snap-start sm:w-auto bg-white rounded-2xl overflow-hidden border border-[#EBE3D7] shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group min-w-[215px] sm:min-w-0"
                >
                  {/* Dish Photo Box */}
                  <div
                    className="relative w-full overflow-hidden bg-neutral-900"
                    style={{ height: '142px', position: 'relative' }}
                  >
                    <Image
                      src={dish.image}
                      alt={dish.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                    />

                    {/* Red Circle Heart Favorite Button */}
                    <button
                      type="button"
                      onClick={() => toggleFavorite(dish._id)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#8B1E1E] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
                      aria-label="Favorite"
                    >
                      <Heart
                        size={14}
                        fill={favorites[dish._id] ? '#FFFFFF' : 'none'}
                        stroke="#FFFFFF"
                      />
                    </button>

                    {/* Veg Indicator Tag */}
                    <div className="absolute bottom-2 left-2 z-10">
                      <span className="w-4 h-4 bg-white/95 rounded-[3px] border border-emerald-600 flex items-center justify-center p-[2px] shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-['Playfair_Display'] font-bold text-sm sm:text-base text-[#1C1917] group-hover:text-[#8B1E1E] transition-colors leading-snug">
                        {dish.name}
                      </h3>

                      <p className="text-xs text-[#78716C] mt-1 line-clamp-2 leading-relaxed">
                        {dish.description}
                      </p>
                    </div>

                    {/* Price and Live Add / + - Stepper */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                      <span className="font-bold text-sm sm:text-base text-[#1C1917]">
                        ${dish.price.toFixed(2)}
                      </span>

                      {qty > 0 ? (
                        <div className="flex items-center h-8 rounded-lg bg-[#8B1E1E] text-white overflow-hidden shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleDecrement(dish)}
                            className="w-7 h-full flex items-center justify-center hover:bg-black/20 transition-colors"
                            aria-label={`Remove one ${dish.name}`}
                          >
                            <Minus size={13} strokeWidth={3} />
                          </button>
                          <span className="min-w-[22px] text-center text-xs font-extrabold select-none">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(dish)}
                            className="w-7 h-full flex items-center justify-center hover:bg-black/20 transition-colors"
                            aria-label={`Add one ${dish.name}`}
                          >
                            <Plus size={13} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(dish)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#8B1E1E] hover:bg-[#701515] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all transform active:scale-95"
                        >
                          Add +
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Far Right Arrow Button */}
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-md border border-[#E5DED4] hover:bg-[#8B1E1E] hover:text-white text-[#1C1917] items-center justify-center transition-all duration-200"
            aria-label="Next dishes"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Wave into Special Offer section */}
      <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1440 64" fill="none" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,30 C300,14 620,12 900,28 C1140,42 1320,44 1440,36 L1440,64 L0,64 Z" fill="#F6E7D5" />
          <path d="M0,30 C300,14 620,12 900,28 C1140,42 1320,44 1440,36" fill="none" stroke="#FFFDF8" strokeWidth="3" />
        </svg>
      </div>
    </section>
  );
}
