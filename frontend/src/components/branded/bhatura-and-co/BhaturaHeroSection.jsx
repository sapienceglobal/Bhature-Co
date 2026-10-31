'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bike,
  ShoppingBag,
  UtensilsCrossed,
  MapPin,
  Navigation,
  Loader2,
  CheckCircle2,
  X,
  Clock,
  Store,
  CalendarDays,
  Home,
  Briefcase,
  Map,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { restaurantAPI } from '@/lib/api';

const DEFAULT_RESTAURANT_ID = '6ae0a5f170397dd11111857e';
const BRANDED_RESTAURANT_SLUG = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co';

/* Haversine distance calculator in miles (same formula as backend etaController.js) */
export function calculateDistanceMiles(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* Shared Lassi-Lounge-style Delivery Serviceability & ETA Evaluator */
export async function evaluateDeliveryEta({ address = '', lat = null, lng = null, restaurant = null }) {
  const prepTime = Number(restaurant?.preparationTime || restaurant?.prepTime) || 15;
  const maxRadiusMiles = Number(restaurant?.deliveryRadius) || 12;
  const restCoords =
    Array.isArray(restaurant?.location?.coordinates) && restaurant.location.coordinates.length === 2
      ? restaurant.location.coordinates // [lng, lat]
      : [-73.8295, 40.6895];
  const restId = restaurant?._id || DEFAULT_RESTAURANT_ID;

  const trimmedAddr = (address || '').trim();
  let userLat = lat !== null && lat !== undefined && !isNaN(Number(lat)) ? Number(lat) : null;
  let userLng = lng !== null && lng !== undefined && !isNaN(Number(lng)) ? Number(lng) : null;

  if (!trimmedAddr && (userLat === null || userLng === null)) {
    return {
      pickup: prepTime,
      delivery: null,
      isOutOfRange: false,
    };
  }

  // 1. Fast check for non-US pincodes (e.g., 6-digit Indian PIN) or foreign cities/countries
  const normalizedAddress = trimmedAddr.toLowerCase();
  const isObviousForeignAddress =
    /\b[1-9][0-9]{5}\b/.test(normalizedAddress) ||
    /\b(india|delhi|new delhi|uttam nagar|bhagwati garden|dwarka|noida|gurgaon|gurugram|mumbai|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|ahmedabad|jaipur|lucknow|chandigarh|haryana|punjab|uttar pradesh|maharashtra|uk|london|australia|canada|france|germany|china|japan|dubai|uae)\b/i.test(
      normalizedAddress
    );

  // 2. If coordinates are missing, geocode the address so we can verify distance accurately
  if ((userLat === null || userLng === null) && trimmedAddr) {
    try {
      const geoRes = await fetch(`/api/location/geocode?address=${encodeURIComponent(trimmedAddr)}`);
      const geoData = await geoRes.json();
      if (geoRes.ok && Array.isArray(geoData) && geoData.length > 0) {
        const first = geoData[0];
        if (first.lat && first.lon) {
          userLat = parseFloat(first.lat);
          userLng = parseFloat(first.lon);
        }
        const countryCode = (first.address?.country_code || '').toLowerCase();
        if (countryCode && countryCode !== 'us') {
          return {
            pickup: prepTime,
            delivery: null,
            isOutOfRange: true,
            reason: 'Out of range — Delivery is only available within our local US service area',
            lat: userLat,
            lng: userLng,
          };
        }
      }
    } catch {
      /* ignore geocoding network errors */
    }
  }

  // 3. Calculate exact Haversine distance against restaurant coordinates
  let distanceMiles = null;
  if (userLat !== null && userLng !== null && Array.isArray(restCoords) && restCoords.length === 2) {
    const [restLng, restLat] = restCoords;
    distanceMiles = calculateDistanceMiles(restLat, restLng, userLat, userLng);
  }

  // 4. Call backend `/api/restaurants/:id/eta` (same endpoint used by Lassi Lounge OrderOnlineHero)
  let apiEta = null;
  try {
    const res = await restaurantAPI.getEta(restId, trimmedAddr, userLat, userLng);
    if (res?.success && res?.data) {
      apiEta = res.data;
    }
  } catch {
    /* fallback to client distance calculation below */
  }

  if (
    isObviousForeignAddress ||
    apiEta?.isOutOfRange ||
    (distanceMiles !== null && distanceMiles > maxRadiusMiles)
  ) {
    return {
      pickup: apiEta?.prepTime || prepTime,
      delivery: null,
      isOutOfRange: true,
      distanceMiles:
        distanceMiles !== null ? Math.round(distanceMiles) : apiEta?.distanceMiles || null,
      maxRadiusMiles: apiEta?.maxRadiusMiles || maxRadiusMiles,
      reason:
        apiEta?.reason ||
        (distanceMiles !== null
          ? `Address is ${Math.round(distanceMiles)} miles away (max delivery radius is ${maxRadiusMiles} miles)`
          : 'Out of range — Too far for delivery'),
      lat: userLat,
      lng: userLng,
    };
  }

  // If we neither got coordinates nor a valid API deliveryTime for a typed string, mark unverified/out-of-range
  if (userLat === null && userLng === null && !apiEta?.deliveryTime) {
    return {
      pickup: prepTime,
      delivery: null,
      isOutOfRange: true,
      reason: 'Could not verify delivery availability for this address',
      lat: null,
      lng: null,
    };
  }

  const estimatedDeliveryMins =
    apiEta?.deliveryTime ||
    prepTime + (distanceMiles !== null ? Math.max(10, Math.round(distanceMiles * 3) + 10) : 20);

  return {
    pickup: apiEta?.prepTime || prepTime,
    delivery: estimatedDeliveryMins,
    isOutOfRange: false,
    distanceMiles: distanceMiles !== null ? Number(distanceMiles.toFixed(1)) : null,
    maxRadiusMiles,
    lat: userLat,
    lng: userLng,
  };
}

/* Helper to parse a raw US address string into street, city, state, zipCode */
export function parseAddressString(rawStr = '', existingDetails = {}) {
  const cleanAddr = rawStr.replace(/,?\s*(USA|United States)$/i, '').trim();
  let street = existingDetails.street || existingDetails.addressLine1 || '';
  let addressLine2 = existingDetails.addressLine2 || '';
  let city = existingDetails.city || '';
  let state = existingDetails.state || 'NJ';
  let zipCode = existingDetails.zipCode || '';

  const zipRegex = /\b([A-Za-z]{2})?,?\s*(\d{5})(?:-\d{4})?\b/;
  const match = cleanAddr.match(zipRegex);

  if (match) {
    if (match[1]) state = match[1].toUpperCase();
    zipCode = match[2];

    let beforeZip = cleanAddr.slice(0, match.index).replace(/,\s*$/, '').trim();
    const parts = beforeZip
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      city = parts[parts.length - 1];
      street = parts[0];
      if (parts.length > 2) {
        addressLine2 = parts.slice(1, -1).join(', ');
      }
    } else if (parts.length === 1) {
      street = parts[0];
    }
  } else {
    const parts = cleanAddr
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 3) {
      street = parts[0];
      city = parts[parts.length - 2];
      const stCandidate = parts[parts.length - 1].replace(/[^A-Za-z]/g, '').toUpperCase();
      if (stCandidate.length === 2) state = stCandidate;
    } else if (parts.length === 2) {
      street = parts[0];
      city = parts[1];
    } else {
      street = cleanAddr;
    }
  }

  const displayLine1 = [street, addressLine2].filter(Boolean).join(', ') || cleanAddr;
  const displayLine2 = [city, [state, zipCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    ? `${[city, [state, zipCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')}, USA`
    : 'New Jersey, USA';

  return {
    formattedAddress: cleanAddr,
    address: cleanAddr,
    street: street || cleanAddr,
    addressLine1: street || cleanAddr,
    addressLine2,
    city: city || 'Edison',
    state: state || 'NJ',
    zipCode: zipCode || '08820',
    displayLine1,
    displayLine2,
    lat: existingDetails.lat ?? null,
    lng: existingDetails.lng ?? null,
    label: existingDetails.label || 'Delivery Address',
  };
}

export default function BhaturaHeroSection({ onOpenAddressModal }) {
  const router = useRouter();
  const { itemCount = 0 } = useCart();
  const { user } = useAuth();

  const [orderMode, setOrderMode] = useState('delivery'); // 'delivery' | 'pickup' | 'dinein'
  const [addressInput, setAddressInput] = useState('');
  const [selectedAddressObj, setSelectedAddressObj] = useState(null);
  const [addressError, setAddressError] = useState('');

  // Restaurant metadata & Live ETA / Delivery Range state (same flow as Lassi Lounge OrderOnlineHero)
  const [restaurant, setRestaurant] = useState(null);
  const [eta, setEta] = useState({ pickup: 15, delivery: null, isOutOfRange: false, reason: '' });
  const [loadingEta, setLoadingEta] = useState(false);

  // Autocomplete & GPS state
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchTimeoutRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const requestCountRef = useRef(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const getSessionToken = () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15);
    }
    return sessionTokenRef.current;
  };

  /* Fetch restaurant config (coordinates, deliveryRadius, prepTime) on mount */
  useEffect(() => {
    let alive = true;
    restaurantAPI
      .getById(BRANDED_RESTAURANT_SLUG)
      .then((res) => {
        if (alive && res?.data) {
          setRestaurant(res.data);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /* Hydrate mode and saved address on mount & when modal updates */
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const savedMode = localStorage.getItem('bhatura_order_mode');
        if (savedMode === 'delivery' || savedMode === 'pickup' || savedMode === 'dinein') {
          setOrderMode(savedMode);
        }
        const savedAddr = localStorage.getItem('bhatura_selected_address');
        if (savedAddr) {
          const parsed = JSON.parse(savedAddr);
          const text =
            parsed?.formattedAddress ||
            parsed?.address ||
            [parsed?.street || parsed?.addressLine1, parsed?.city, parsed?.state, parsed?.zipCode]
              .filter(Boolean)
              .join(', ');
          if (text) {
            setAddressInput(text);
            setSelectedAddressObj(parsed);
          }
        }
      } catch {
        /* ignore */
      }
    };

    syncFromStorage();
    window.addEventListener('bhatura-address-updated', syncFromStorage);
    return () => window.removeEventListener('bhatura-address-updated', syncFromStorage);
  }, []);

  /* Live ETA & Delivery Serviceability Check whenever selectedAddressObj or restaurant changes */
  useEffect(() => {
    let alive = true;
    const addrText =
      selectedAddressObj?.formattedAddress ||
      selectedAddressObj?.address ||
      selectedAddressObj?.street ||
      '';

    if (!addrText) {
      setEta({
        pickup: Number(restaurant?.preparationTime || restaurant?.prepTime) || 15,
        delivery: null,
        isOutOfRange: false,
        reason: '',
      });
      setLoadingEta(false);
      return;
    }

    setLoadingEta(true);
    evaluateDeliveryEta({
      address: addrText,
      lat: selectedAddressObj?.lat,
      lng: selectedAddressObj?.lng,
      restaurant,
    })
      .then((result) => {
        if (!alive) return;
        setEta(result);
      })
      .finally(() => {
        if (alive) setLoadingEta(false);
      });

    return () => {
      alive = false;
    };
  }, [
    selectedAddressObj?.formattedAddress,
    selectedAddressObj?.address,
    selectedAddressObj?.street,
    selectedAddressObj?.lat,
    selectedAddressObj?.lng,
    restaurant?._id,
  ]);

  /* Close autocomplete dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModeSwitch = (mode) => {
    setOrderMode(mode);
    setAddressError('');
    setDropdownOpen(false);
    try {
      localStorage.setItem('bhatura_order_mode', mode === 'dinein' ? 'pickup' : mode);
    } catch {
      /* ignore */
    }
  };

  const persistAddressObject = (addrObj) => {
    setSelectedAddressObj(addrObj);
    setAddressInput(addrObj.formattedAddress || addrObj.address || '');
    setAddressError('');
    try {
      localStorage.setItem('bhatura_selected_address', JSON.stringify(addrObj));
      localStorage.setItem('bhatura_order_mode', 'delivery');
      window.dispatchEvent(new Event('bhatura-address-updated'));
    } catch {
      /* ignore */
    }
  };

  /* Live address autocomplete as user types */
  const handleInputChange = (e) => {
    const val = e.target.value;
    setAddressInput(val);
    setSelectedAddressObj(null);
    setAddressError('');
    setDropdownOpen(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 3) {
      requestCountRef.current += 1;
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const reqId = ++requestCountRef.current;
      try {
        const res = await fetch(
          `/api/location/autocomplete?q=${encodeURIComponent(val)}&sessionToken=${getSessionToken()}`
        );
        const data = await res.json();
        if (reqId === requestCountRef.current) {
          setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
        }
      } catch {
        if (reqId === requestCountRef.current) setSuggestions([]);
      } finally {
        if (reqId === requestCountRef.current) setIsSearching(false);
      }
    }, 350);
  };

  /* Handle clicking an autocomplete suggestion */
  const handleSelectSuggestion = async (suggestion) => {
    setDropdownOpen(false);
    setSuggestions([]);

    if (suggestion.place_id) {
      try {
        setIsSearching(true);
        const res = await fetch(
          `/api/location/place?place_id=${suggestion.place_id}&sessionToken=${sessionTokenRef.current || ''}`
        );
        const data = await res.json();
        sessionTokenRef.current = null;

        if (data) {
          const street = data.address?.house_number
            ? `${data.address.house_number} ${data.address.road || ''}`.trim()
            : data.address?.road || suggestion.main_text || '';
          const city = data.address?.city || '';
          const state = (data.address?.state || 'NJ').substring(0, 2).toUpperCase();
          const zipCode = (data.address?.postcode || '').substring(0, 5);
          const fullText =
            suggestion.display_name || [street, city, `${state} ${zipCode}`.trim()].filter(Boolean).join(', ');

          const parsed = parseAddressString(fullText, {
            street,
            city,
            state,
            zipCode,
            lat: data.lat ? parseFloat(data.lat) : null,
            lng: data.lng ? parseFloat(data.lng) : null,
          });
          persistAddressObject(parsed);
          return;
        }
      } catch {
        /* fallback below */
      } finally {
        setIsSearching(false);
      }
    }

    const addr = suggestion.address || {};
    const street = `${addr.house_number || ''} ${addr.road || ''}`.trim();
    const city = addr.city || addr.town || addr.village || addr.suburb || '';
    const state = (addr.state || 'NJ').substring(0, 2).toUpperCase();
    const zipCode = (addr.postcode || '').substring(0, 5);
    const parsed = parseAddressString(suggestion.display_name || addressInput, {
      street,
      city,
      state,
      zipCode,
      lat: suggestion.lat ? parseFloat(suggestion.lat) : null,
      lng: suggestion.lon ? parseFloat(suggestion.lon) : null,
    });
    persistAddressObject(parsed);
  };

  /* Handle clicking a user's saved address */
  const handleSelectSavedUserAddress = (savedAddr) => {
    setDropdownOpen(false);
    const parsed = parseAddressString(savedAddr.address || '', {
      lat: savedAddr.lat ?? null,
      lng: savedAddr.lng ?? null,
      label: savedAddr.label || 'Home',
    });
    persistAddressObject(parsed);
  };

  /* Handle Use Current GPS Location */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setAddressError('Location access is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setAddressError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          const addr = data?.address || {};
          const street = `${addr.house_number || ''} ${addr.road || ''}`.trim();
          const city = addr.city || addr.town || addr.village || addr.suburb || '';
          const state = (addr.state_code || addr.state || 'NJ').substring(0, 2).toUpperCase();
          const zipCode = (addr.postcode || '').substring(0, 5);
          const fullStr =
            data?.display_name || [street, city, `${state} ${zipCode}`.trim()].filter(Boolean).join(', ');

          const parsed = parseAddressString(fullStr, {
            street,
            city,
            state,
            zipCode,
            lat,
            lng,
            label: 'Current Location',
          });
          persistAddressObject(parsed);
          setDropdownOpen(false);
        } catch {
          setAddressError('Could not detect street address. Please type your address.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setAddressError('Location permission denied. Please enter your address manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  /* Handle Primary Submit (Order Now / Checkout Now) */
  const handleOrderSubmit = async (e) => {
    if (e) e.preventDefault();

    if (orderMode === 'dinein') {
      router.push('/book-a-table');
      return;
    }

    if (orderMode === 'pickup') {
      try {
        localStorage.setItem('bhatura_order_mode', 'pickup');
      } catch {
        /* ignore */
      }
      router.push(itemCount > 0 ? '/checkout' : '/order-online');
      return;
    }

    // Delivery mode validation & geocoding
    const trimmed = addressInput.trim();
    if (!trimmed || trimmed.length < 4) {
      setDropdownOpen(false);
      setAddressError('Please enter your delivery address or use GPS/Map to continue.');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setAddressError('');

    try {
      let finalAddrObj = selectedAddressObj;

      if (!finalAddrObj || finalAddrObj.formattedAddress !== trimmed) {
        let geocoded = null;
        try {
          const res = await fetch(`/api/location/geocode?address=${encodeURIComponent(trimmed)}`);
          const data = await res.json();
          if (res.ok && Array.isArray(data) && data.length > 0) {
            const first = data[0];
            const addr = first.address || {};
            geocoded = {
              street: `${addr.house_number || ''} ${addr.road || ''}`.trim() || undefined,
              city: addr.city || addr.town || addr.village || addr.suburb || undefined,
              state: addr.state ? addr.state.substring(0, 2).toUpperCase() : undefined,
              zipCode: addr.postcode ? addr.postcode.substring(0, 5) : undefined,
              lat: first.lat ? parseFloat(first.lat) : null,
              lng: first.lon ? parseFloat(first.lon) : null,
            };
          }
        } catch {
          /* fallback to string parser */
        }

        finalAddrObj = parseAddressString(trimmed, geocoded || {});
      }

      // Check delivery serviceability & ETA before allowing navigation
      const etaCheck = await evaluateDeliveryEta({
        address: finalAddrObj.formattedAddress || finalAddrObj.address || trimmed,
        lat: finalAddrObj.lat,
        lng: finalAddrObj.lng,
        restaurant,
      });
      setEta(etaCheck);

      if (etaCheck.lat !== null && etaCheck.lng !== null && (!finalAddrObj.lat || !finalAddrObj.lng)) {
        finalAddrObj = { ...finalAddrObj, lat: etaCheck.lat, lng: etaCheck.lng };
      }

      persistAddressObject(finalAddrObj);
      setDropdownOpen(false);

      if (etaCheck.isOutOfRange) {
        // Stay on Hero so the user sees the red "Out of range — Too far for delivery" status & options
        return;
      }

      router.push(itemCount > 0 ? '/checkout' : '/order-online');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* z-30 ensures the floating autocomplete dropdown renders cleanly above the next section */
    <section className="relative z-30 overflow-visible bg-gradient-to-b from-[#FCF1E3] via-[#FAF0E1] via-60% to-[#E8BE90] min-h-[500px] lg:min-h-[560px] flex items-center">
      {/* Desktop 3D Hero Dish Artwork */}
      <div
        className="hidden lg:block absolute top-0 right-0 h-full w-[58%] xl:w-[54%] 2xl:w-[50%] pointer-events-none select-none z-0 overflow-hidden"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 18%)',
          maskImage: 'linear-gradient(to right, transparent 0%, #000 18%)',
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src="/assets/images/branded/bhatura-and-co/hero_dish_3d_v2.jpg"
            alt="Fluffy Bhature with Pindi Chhole, Onion, Lemon and Steam"
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover object-center"
          />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:py-16 relative z-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Typography, Badges, Order Controls */}
          <div className="lg:col-span-7 flex flex-col items-start text-left max-w-xl lg:max-w-none">
            {/* Tagline */}
            <span className="text-xs sm:text-sm font-bold text-[#D48228] tracking-[0.2em] uppercase mb-2">
              Authentic North Indian Food
            </span>

            {/* Main Headline */}
            <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-[54px] font-black text-[#1C1917] leading-[1.1] mb-3 tracking-tight">
              Fluffy Bhature.{' '}
              <span className="text-[#8B1E1E]">Rich Traditions.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[#57534E] text-sm sm:text-base lg:text-lg max-w-lg mb-6 leading-relaxed font-['Poppins']">
              Freshly prepared North Indian delicacies, delivered hot to your doorstep.
            </p>

            {/* 3 Feature Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-5 sm:mb-7 w-full max-w-lg">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[#1C1917]">
                <div className="w-7 h-7 rounded-full bg-[#8B1E1E]/10 flex items-center justify-center shrink-0 text-[#8B1E1E]">
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.5 3 8 7 9.5 0-4 1.5-8 5-11.5 3.5-3.5 7.5-5 11.5-5C25.5 5 12 2 12 2z" />
                    <path d="M9 15c3-3 6-5 10-6" />
                  </svg>
                </div>
                <span className="leading-tight">Premium Ingredients</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[#1C1917]">
                <div className="w-7 h-7 rounded-full bg-[#8B1E1E]/10 flex items-center justify-center shrink-0 text-[#8B1E1E]">
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path d="M6 18h12M6 14h12M7 14c-1.5 0-3-1.5-3-3.5 0-1.8 1.4-3.3 3.2-3.5C7.7 5.2 9.7 4 12 4s4.3 1.2 4.8 3C18.6 7.2 20 8.7 20 10.5c0 2-1.5 3.5-3 3.5" />
                  </svg>
                </div>
                <span className="leading-tight">Traditional Recipes</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[#1C1917]">
                <div className="w-7 h-7 rounded-full bg-[#8B1E1E]/10 flex items-center justify-center shrink-0 text-[#8B1E1E]">
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <span className="leading-tight">Fast & Reliable Delivery</span>
              </div>
            </div>

            {/* Mobile Hero Dish Preview */}
            <div className="lg:hidden w-full mb-6 relative rounded-2xl overflow-hidden shadow-xl aspect-[5/4]">
              <Image
                src="/assets/images/branded/bhatura-and-co/hero_dish_3d_v2.jpg"
                alt="Fluffy Bhature with Pindi Chhole"
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Order Mode Tab Pill Bar (with Live Lassi-Lounge-style ETA indicators) */}
            <div className="flex sm:inline-flex w-full sm:w-auto justify-between sm:justify-start items-center rounded-2xl bg-[#1E1B18] p-1.5 shadow-md mb-3.5">
              <button
                type="button"
                onClick={() => handleModeSwitch('delivery')}
                className={
                  'flex flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ' +
                  (orderMode === 'delivery'
                    ? 'bg-[#F26522] text-white shadow-sm'
                    : 'text-white/80 hover:text-white')
                }
              >
                <Bike size={16} />
                <span>Delivery</span>
                {selectedAddressObj && (
                  <span
                    className={`hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                      loadingEta
                        ? 'bg-black/20 text-white/90 animate-pulse'
                        : eta.isOutOfRange
                        ? 'bg-red-900/90 text-red-100'
                        : 'bg-black/25 text-white'
                    }`}
                  >
                    {loadingEta
                      ? '...'
                      : eta.isOutOfRange
                      ? 'Out of range'
                      : eta.delivery
                      ? `${eta.delivery} mins`
                      : ''}
                  </span>
                )}
              </button>
              <span className="h-4 w-px bg-white/20 mx-1" />
              <button
                type="button"
                onClick={() => handleModeSwitch('pickup')}
                className={
                  'flex flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ' +
                  (orderMode === 'pickup'
                    ? 'bg-[#F26522] text-white shadow-sm'
                    : 'text-white/80 hover:text-white')
                }
              >
                <ShoppingBag size={16} />
                <span>Pickup</span>
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/95 font-extrabold">
                  {eta.pickup || 15} mins
                </span>
              </button>
              <span className="h-4 w-px bg-white/20 mx-1" />
              <button
                type="button"
                onClick={() => handleModeSwitch('dinein')}
                className={
                  'flex flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ' +
                  (orderMode === 'dinein'
                    ? 'bg-[#F26522] text-white shadow-sm'
                    : 'text-white/80 hover:text-white')
                }
              >
                <UtensilsCrossed size={16} /> Dine-in
              </button>
            </div>

            {/* ── UNIFIED FIXED-HEIGHT ACTION BAR + RESERVED STATUS ROW (ZERO LAYOUT SHIFT) ── */}
            <div ref={wrapperRef} className="w-full max-w-lg relative z-40">
              {/* Fixed 60px Card Container so Delivery / Pickup / Dine-in never shift page height */}
              <div className="h-[60px] w-full">
                {/* MODE 1: DELIVERY */}
                {orderMode === 'delivery' && (
                  <form onSubmit={handleOrderSubmit} className="w-full h-full">
                    <div
                      className={`h-full flex items-center bg-white rounded-2xl shadow-lg border transition-colors duration-200 px-2 ${
                        addressError || (selectedAddressObj && eta.isOutOfRange)
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : dropdownOpen
                          ? 'border-[#8B1E1E] ring-2 ring-[#8B1E1E]/15'
                          : 'border-[#E8DEC8]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={onOpenAddressModal}
                        title="Pin exact location on map"
                        className="pl-2 pr-1.5 text-[#DC2626] hover:scale-110 transition-transform cursor-pointer shrink-0"
                      >
                        <MapPin size={22} className="fill-[#DC2626] text-white" />
                      </button>

                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Enter your delivery address, street or ZIP..."
                        value={addressInput}
                        onChange={handleInputChange}
                        onFocus={() => {
                          setAddressError('');
                          setDropdownOpen(true);
                        }}
                        className="w-full bg-transparent py-2 pr-2 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:outline-none font-medium"
                      />

                      {addressInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddressInput('');
                            setSelectedAddressObj(null);
                            setSuggestions([]);
                            setAddressError('');
                            inputRef.current?.focus();
                          }}
                          className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer shrink-0"
                          title="Clear address"
                        >
                          <X size={16} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        title="Use my current location"
                        className="p-2 mr-1 rounded-lg text-[#8B1E1E] hover:bg-[#8B1E1E]/10 transition-colors cursor-pointer shrink-0"
                      >
                        {isLocating ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Navigation size={17} />
                        )}
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-[44px] shrink-0 px-4 sm:px-5 rounded-xl bg-[#8B1E1E] hover:bg-[#701515] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <span>{itemCount > 0 ? `Checkout (${itemCount})` : 'Order Now'}</span>
                            <span className="text-[#D4AF37] font-black">→</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* MODE 2: PICKUP (Exact same 60px height) */}
                {orderMode === 'pickup' && (
                  <div className="h-full w-full bg-white rounded-2xl shadow-lg border border-[#E8DEC8] px-2 flex items-center justify-between gap-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5 min-w-0 pl-1.5">
                      <div className="w-10 h-10 rounded-xl bg-[#8B1E1E]/10 flex items-center justify-center text-[#8B1E1E] shrink-0">
                        <Store size={19} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-[#1C1917] truncate">
                            Bhatura &amp; Co — Edison, NJ
                          </span>
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Clock size={10} /> 15–20 mins
                          </span>
                        </div>
                        <p className="text-[11px] text-[#78716C] truncate">
                          Self-Pickup • $0 delivery fee, hot off the tandoor
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOrderSubmit}
                      className="h-[44px] shrink-0 px-4 sm:px-5 rounded-xl bg-[#8B1E1E] hover:bg-[#701515] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{itemCount > 0 ? `Checkout (${itemCount})` : 'Order Pickup'}</span>
                      <span className="text-[#D4AF37] font-black">→</span>
                    </button>
                  </div>
                )}

                {/* MODE 3: DINE-IN (Exact same 60px height) */}
                {orderMode === 'dinein' && (
                  <div className="h-full w-full bg-white rounded-2xl shadow-lg border border-[#E8DEC8] px-2 flex items-center justify-between gap-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5 min-w-0 pl-1.5">
                      <div className="w-10 h-10 rounded-xl bg-[#D48228]/15 flex items-center justify-center text-[#8B1E1E] shrink-0">
                        <CalendarDays size={19} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[#1C1917] truncate">
                          Dine-in at Bhatura &amp; Co
                        </p>
                        <p className="text-[11px] text-[#78716C] truncate">
                          Reserve a table for family &amp; friends • 11 AM – 10:30 PM
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => router.push('/order-online')}
                        className="hidden sm:inline-flex h-[44px] items-center px-3.5 rounded-xl border border-[#E8DEC8] hover:bg-[#FDF7ED] text-[#1C1917] text-xs font-bold transition-all cursor-pointer"
                      >
                        Menu
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push('/book-a-table')}
                        className="h-[44px] px-4 sm:px-5 rounded-xl bg-[#8B1E1E] hover:bg-[#701515] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Book Table</span>
                        <span className="text-[#D4AF37] font-black">→</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reserved 24px Status / Helper Row (Prevents vertical page jump when error or status shows) */}
              <div className="h-6 mt-1.5 px-2 flex items-center justify-between text-xs">
                {orderMode === 'delivery' && addressError ? (
                  <p className="font-semibold text-red-600 flex items-center gap-1.5 truncate animate-in fade-in duration-150">
                    <AlertCircle size={13} className="shrink-0" />
                    <span className="truncate">{addressError}</span>
                  </p>
                ) : orderMode === 'delivery' && loadingEta ? (
                  <div className="w-full flex items-center gap-1.5 text-[#8B1E1E] font-semibold animate-in fade-in duration-150">
                    <Loader2 size={13} className="animate-spin shrink-0" />
                    <span className="truncate">Checking delivery availability &amp; ETA...</span>
                  </div>
                ) : orderMode === 'delivery' && selectedAddressObj && eta.isOutOfRange ? (
                  <div className="w-full flex items-center justify-between gap-2 animate-in fade-in duration-150">
                    <p className="text-[11px] text-red-600 font-bold uppercase tracking-wider flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping inline-block shrink-0" />
                      <span className="truncate">
                        Out of range — Too far for delivery (
                        {selectedAddressObj.displayLine1 || selectedAddressObj.street})
                      </span>
                    </p>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={onOpenAddressModal}
                        className="text-[11px] text-[#4A090B] hover:text-[#D48228] font-bold uppercase tracking-wider underline cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeSwitch('pickup')}
                        className="text-[11px] text-[#8B1E1E] hover:text-[#D48228] font-bold uppercase tracking-wider underline cursor-pointer"
                      >
                        Pickup
                      </button>
                    </div>
                  </div>
                ) : orderMode === 'delivery' && selectedAddressObj ? (
                  <div className="w-full flex items-center justify-between text-[#15803D] font-semibold animate-in fade-in duration-150">
                    <span className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 size={13} className="shrink-0" />
                      <span className="truncate">
                        Delivering to:{' '}
                        <strong className="font-bold">
                          {selectedAddressObj.displayLine1 || selectedAddressObj.street}
                        </strong>
                        {eta.delivery ? ` • ETA ~${eta.delivery} mins` : ''}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={onOpenAddressModal}
                      className="text-[11px] text-[#8B1E1E] hover:underline ml-2 font-bold uppercase tracking-wider shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : orderMode === 'delivery' ? (
                  <div className="w-full flex items-center justify-between text-[#78716C] font-medium">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="hover:text-[#8B1E1E] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation size={11} className="text-[#8B1E1E]" />
                      <span>Use current GPS location</span>
                    </button>
                    <button
                      type="button"
                      onClick={onOpenAddressModal}
                      className="hover:text-[#8B1E1E] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Map size={11} className="text-[#D48228]" />
                      <span>Pin on map</span>
                    </button>
                  </div>
                ) : orderMode === 'pickup' ? (
                  <span className="text-[#57534E] font-medium truncate">
                    📍 Oak Tree Road, Edison, NJ • Freshly packed &amp; ready in {eta.pickup || 15}–
                    {(eta.pickup || 15) + 5} mins
                  </span>
                ) : (
                  <span className="text-[#57534E] font-medium truncate">
                    ✨ Instant table confirmation • Group &amp; family seating available
                  </span>
                )}
              </div>

              {/* Floating Autocomplete Dropdown (Positioned cleanly over the wave with high z-index) */}
              {orderMode === 'delivery' && dropdownOpen && (
                <div className="absolute left-0 right-0 top-[66px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(28,25,23,0.22)] border border-[#E8DEC8] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Quick Action Row: Current GPS + Interactive Map */}
                  <div className="grid grid-cols-2 divide-x divide-stone-100 border-b border-stone-100 bg-[#FAF6F0]">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-[#8B1E17] hover:bg-[#8B1E1E]/5 transition-colors cursor-pointer"
                    >
                      {isLocating ? (
                        <Loader2 size={15} className="animate-spin shrink-0" />
                      ) : (
                        <Navigation size={15} className="shrink-0" />
                      )}
                      <span className="truncate">Use Current Location</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAddressModal?.();
                      }}
                      className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-[#1C1917] hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <Map size={15} className="text-[#D48228] shrink-0" />
                      <span className="truncate">Pin Location on Map</span>
                    </button>
                  </div>

                  {/* Loading state */}
                  {isSearching && (
                    <div className="px-4 py-3 text-xs text-stone-500 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-[#8B1E1E]" />
                      <span>Searching matching addresses...</span>
                    </div>
                  )}

                  {/* Autocomplete Suggestions List */}
                  {!isSearching && suggestions.length > 0 && (
                    <div className="max-h-60 overflow-y-auto divide-y divide-stone-100">
                      {suggestions.map((sug, idx) => (
                        <button
                          key={sug.place_id || idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(sug)}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#FDF7ED] transition-colors flex items-start gap-2.5 cursor-pointer"
                        >
                          <MapPin size={16} className="text-[#8B1E1E] shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#1C1917] truncate">
                              {sug.main_text || sug.display_name?.split(',')[0]}
                            </p>
                            <p className="text-[11px] text-stone-500 truncate">
                              {sug.secondary_text || sug.display_name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Saved User Addresses (when logged in) */}
                  {!isSearching && suggestions.length === 0 && user?.savedAddresses?.length > 0 && (
                    <div className="p-2">
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Saved Addresses
                      </p>
                      {user.savedAddresses.slice(0, 3).map((sa, idx) => (
                        <button
                          key={sa._id || idx}
                          type="button"
                          onClick={() => handleSelectSavedUserAddress(sa)}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#FDF7ED] transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          {sa.label?.toLowerCase() === 'work' ? (
                            <Briefcase size={15} className="text-[#D48228] shrink-0" />
                          ) : (
                            <Home size={15} className="text-[#8B1E1E] shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-[#1C1917] mr-1.5">
                              {sa.label || 'Saved'}:
                            </span>
                            <span className="text-xs text-stone-600 truncate">{sa.address}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Right Column Spacer */}
          <div className="hidden lg:block lg:col-span-5 pointer-events-none" />
        </div>
      </div>

      {/* Bottom Smooth Organic Wave Transition into Categories */}
      <div className="absolute bottom-0 left-0 right-0 h-14 sm:h-20 pointer-events-none z-10 overflow-hidden">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d="M0,30 C360,62 720,66 1080,44 C1260,33 1360,26 1440,24"
            fill="none"
            stroke="#C9935E"
            strokeWidth="6"
            className="opacity-25"
            style={{ filter: 'blur(3px)' }}
          />
          <path
            d="M0,30 C360,62 720,66 1080,44 C1260,33 1360,26 1440,24 L1440,80 L0,80 Z"
            fill="#FDF7ED"
          />
          <path
            d="M0,30 C360,62 720,66 1080,44 C1260,33 1360,26 1440,24"
            fill="none"
            stroke="#FFFDF8"
            strokeWidth="3"
          />
        </svg>
      </div>
    </section>
  );
}
