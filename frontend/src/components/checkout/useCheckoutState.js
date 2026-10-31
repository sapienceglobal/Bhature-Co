'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { orderAPI, couponAPI, restaurantAPI, authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics';
import { saveClientLocation } from '@/utils/geolocationHelper';

const US_STATE_CODES = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
};

const resolveStateCode = (address, stateName) => {
  const isoCode = address?.['ISO3166-2-lvl4']?.split('-').pop();
  if (isoCode && isoCode.length === 2) return isoCode.toUpperCase();
  if (address?.state_code) return address.state_code.toUpperCase();
  if (US_STATE_CODES[stateName]) return US_STATE_CODES[stateName];
  return stateName ? stateName.substring(0, 2).toUpperCase() : '';
};

const ONLINE_PAYMENT_METHODS = ['stripe_online', 'credit_card', 'upi', 'paypal'];

const hasEmoji = (str) => Boolean(str && /[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(str));
const NAME_REGEX = /^[a-zA-Z0-9\s\-'.@_+]+$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function useCheckoutState() {
  const router = useRouter();
  const {
    items,
    restaurant: cachedRestaurant,
    subtotal,
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
    openCart,
    specialInstructions,
    setSpecialInstructions,
  } = useCart();
  const { isAuthenticated, user, refreshUser } = useAuth();

  const isSingleRestaurantMode = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

  const [step, setStep] = useState(2); // 1 = Cart, 2 = Delivery & Payment, 3 = Review & Place Order
  const [restaurant, setRestaurant] = useState(cachedRestaurant);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    if (cachedRestaurant && !restaurant) {
      setRestaurant(cachedRestaurant);
    }
  }, [cachedRestaurant, restaurant]);

  useEffect(() => {
    if (items && items.length > 0 && subtotal > 0) {
      try {
        trackBeginCheckout(items, subtotal);
      } catch (err) {
        console.warn('Failed to track begin_checkout on checkout load:', err);
      }
    }
  }, [items?.length, subtotal]);

  useEffect(() => {
    const targetId = cachedRestaurant?._id || process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co';
    restaurantAPI
      .getById(targetId)
      .then((res) => {
        if (res?.data) {
          setRestaurant(res.data);
        }
      })
      .catch((err) => console.error('Failed to refresh restaurant settings:', err));
  }, [cachedRestaurant?._id]);

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('NJ');
  const [zipCode, setZipCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [addressLat, setAddressLat] = useState(null);
  const [addressLng, setAddressLng] = useState(null);

  const [orderType, setOrderType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('stripe_online');

  // Delivery Time state (ASAP vs Schedule for Later)
  const [deliveryTimeOption, setDeliveryTimeOption] = useState('asap'); // 'asap' | 'scheduled'
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [scheduledSlot, setScheduledSlot] = useState('18:30');

  const scheduledTime = useMemo(() => {
    if (deliveryTimeOption !== 'scheduled' || !scheduledDate || !scheduledSlot) return null;
    try {
      const dt = new Date(`${scheduledDate}T${scheduledSlot}:00`);
      return isNaN(dt.getTime()) ? null : dt.toISOString();
    } catch {
      return null;
    }
  }, [deliveryTimeOption, scheduledDate, scheduledSlot]);

  const [tip, setTip] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [appliedCouponData, setAppliedCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [quoteTrigger, setQuoteTrigger] = useState(0);

  // auto-suggestion state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [addressVerified, setAddressVerified] = useState(false);
  const searchTimeoutRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const searchRequestCount = useRef(0);

  const getSessionToken = () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15);
    }
    return sessionTokenRef.current;
  };

  useEffect(() => {
    if (isAuthenticated) refreshUser();
  }, [isAuthenticated, refreshUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pendingCoupon = localStorage.getItem('pendingCouponCode');
    if (pendingCoupon && subtotal > 0 && restaurant?._id && !couponApplied) {
      setCouponCode(pendingCoupon);
      localStorage.removeItem('pendingCouponCode');

      const validatePending = async () => {
        setCouponLoading(true);
        try {
          const data = await couponAPI.validate(pendingCoupon, subtotal, restaurant._id);
          setCouponDiscount(data.data.discount);
          setAppliedCouponData(data.data);
          setCouponApplied(true);
          showToast(`Coupon applied! -$${data.data.discount.toFixed(2)}`, 'success');
        } catch (err) {
          showToast(err.message || 'Invalid coupon code', 'error');
          setCouponDiscount(0);
          setAppliedCouponData(null);
          setCouponApplied(false);
        } finally {
          setCouponLoading(false);
        }
      };
      validatePending();
    }
  }, [subtotal, restaurant?._id, couponApplied]);

  useEffect(() => {
    if (couponApplied && couponCode && subtotal > 0 && restaurant?._id) {
      const revalidate = async () => {
        try {
          const data = await couponAPI.validate(couponCode, subtotal, restaurant._id);
          if (data.data && typeof data.data.discount === 'number') {
            setCouponDiscount(data.data.discount);
            setAppliedCouponData(data.data);
          }
        } catch {
          showToast('Coupon removed: Cart total no longer meets requirements', 'error');
          setCouponApplied(false);
          setCouponDiscount(0);
          setAppliedCouponData(null);
          setCouponCode('');
        }
      };
      revalidate();
    }
  }, [subtotal, restaurant?._id, couponCode, couponApplied]);

  const handleSelectSavedAddress = (addrObj) => {
    if (!addrObj?.address) return;

    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('NJ');
    setZipCode('');

    const cleanAddr = addrObj.address.replace(/,?\s*USA$/i, '').trim();
    const zipRegex = /([A-Za-z]{2})(?:,)?\s+(\d{5})(?:-\d{4})?$/;
    const match = cleanAddr.match(zipRegex);

    if (match) {
      setState(match[1].toUpperCase());
      setZipCode(match[2]);

      let rest = cleanAddr.replace(zipRegex, '').trim();
      if (rest.endsWith(',')) rest = rest.slice(0, -1).trim();

      const parts = rest
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      if (parts.length > 0) {
        setCity(parts[parts.length - 1]);
        parts.pop();
      }

      if (parts.length > 0) {
        setAddressLine1(parts[0]);
        if (parts.length > 1) {
          setAddressLine2(parts.slice(1).join(', '));
        }
      }
    } else {
      setAddressLine1(cleanAddr);
    }

    setAddressLat(addrObj.lat ?? null);
    setAddressLng(addrObj.lng ?? null);
    setAddressVerified(true);
    setQuoteError(null);
    setQuoteTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name || '');
      if (!phone) setPhone(user.phone || '');
      if (!email) setEmail(user.email || '');

      if (user.savedAddresses && user.savedAddresses.length > 0 && !addressLine1) {
        const defaultAddr = user.savedAddresses.find((a) => a.isDefault) || user.savedAddresses[0];
        handleSelectSavedAddress(defaultAddr);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const compiledAddress = useMemo(() => {
    if (addressLine1 && !city && !zipCode) return addressLine1;
    if (!addressLine1.trim() || !city.trim() || !state.trim() || !zipCode.trim()) return '';
    return `${addressLine1}, ${addressLine2 ? addressLine2 + ', ' : ''}${city}, ${state} ${zipCode}`;
  }, [addressLine1, addressLine2, city, state, zipCode]);

  const rawTaxRate = restaurant?.taxRate ?? 8.875;
  const taxRateMultiplier = rawTaxRate < 1 ? rawTaxRate : rawTaxRate / 100;
  const tax = Math.round(subtotal * taxRateMultiplier * 100) / 100;

  const hasDeliveryAddressInput = Boolean(
    addressLine1.trim() || city.trim() || state.trim() || zipCode.trim() || addressVerified || addressLat !== null || addressLng !== null
  );

  const deliveryFee =
    orderType === 'delivery'
      ? deliveryQuote?.deliveryFee !== undefined
        ? deliveryQuote.deliveryFee
        : quoteError
          ? null
          : restaurant?.deliveryFee || 2.99
      : 0;

  const platformFee = 0;

  const rawServiceCharge = restaurant?.serviceCharge ?? 3.0;
  const serviceChargeMultiplier = rawServiceCharge < 1 ? rawServiceCharge : rawServiceCharge / 100;
  const serviceFee = Math.round(subtotal * serviceChargeMultiplier * 100) / 100;

  const packagingFee = restaurant?.packagingCharge || 0;
  const loyaltyDiscount = useLoyaltyPoints ? Math.floor(user?.loyaltyPoints || 0) / 100 : 0;

  const rawTotal = Math.max(
    0,
    subtotal +
      tax +
      (deliveryFee || 0) +
      platformFee +
      serviceFee +
      packagingFee +
      tip -
      couponDiscount -
      loyaltyDiscount
  );
  const total = restaurant?.roundOff ? Math.round(rawTotal) : Math.round(rawTotal * 100) / 100;

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        menuItemId: item.menuItemId || item._id,
        quantity: item.quantity || item.qty || 1,
        selectedSize: item.selectedSize,
        addOns: item.addOns,
        specialInstructions: item.specialInstructions || '',
      })),
    [items]
  );

  const checkoutPayload = useMemo(
    () => ({
      restaurantId: restaurant?._id || process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co',
      items: checkoutItems,
      orderType,
      tip,
      couponCode: couponApplied ? couponCode : undefined,
      useLoyaltyPoints,
      address: compiledAddress,
      addressLat,
      addressLng,
      specialInstructions,
      scheduledTime,
      customerPhone: phone,
      customerName: fullName,
      customerEmail: email,
    }),
    [
      restaurant?._id,
      checkoutItems,
      orderType,
      tip,
      couponApplied,
      couponCode,
      useLoyaltyPoints,
      compiledAddress,
      addressLat,
      addressLng,
      specialInstructions,
      scheduledTime,
      phone,
      fullName,
      email,
    ]
  );

  const triggerGeocoding = async (addrStr) => {
    try {
      const res = await fetch(`/api/location/geocode?address=${encodeURIComponent(addrStr)}`);
      const data = await res.json();
      if (res.ok && data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setAddressLat(lat);
        setAddressLng(lng);
        setAddressVerified(true);
        return { lat, lng };
      }
    } catch (err) {
      console.error('Silent geocoding error:', err);
    }

    // Fallback to restaurant's nearby coordinates if external geocoder has no match
    const restCoords = restaurant?.location?.coordinates;
    if (Array.isArray(restCoords) && restCoords.length === 2) {
      const lng = Number(restCoords[0]);
      const lat = Number(restCoords[1]);
      setAddressLat(lat);
      setAddressLng(lng);
      setAddressVerified(true);
      return { lat, lng };
    }
    return null;
  };

  const handleAddressLine1Change = (val) => {
    setAddressLine1(val);
    setAddressVerified(false);
    setAddressLat(null);
    setAddressLng(null);
    setDeliveryQuote(null);
    setQuoteError(null);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 3) {
      searchRequestCount.current += 1;
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    setSuggestionsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const currentReq = ++searchRequestCount.current;
      try {
        const res = await fetch(
          `/api/location/autocomplete?q=${encodeURIComponent(val)}&sessionToken=${getSessionToken()}`
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          if (currentReq === searchRequestCount.current) {
            setSuggestions(data);
          }
        } else if (currentReq === searchRequestCount.current) {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Failed to fetch address suggestions', err);
      } finally {
        if (currentReq === searchRequestCount.current) {
          setSuggestionsLoading(false);
        }
      }
    }, 450);
  };

  const handleSelectSuggestion = async (suggestion) => {
    if (suggestion.place_id) {
      try {
        const res = await fetch(
          `/api/location/place?place_id=${suggestion.place_id}&sessionToken=${sessionTokenRef.current || ''}`
        );
        const data = await res.json();
        sessionTokenRef.current = null;

        if (data) {
          setAddressLine1(
            data.address?.house_number
              ? `${data.address.house_number} ${data.address.road}`.trim()
              : data.address?.road || suggestion.main_text || ''
          );
          setCity(data.address?.city || '');
          setState(data.address?.state || 'NJ');
          setZipCode((data.address?.postcode || '').substring(0, 5));

          if (data.lat && data.lng) {
            setAddressLat(parseFloat(data.lat));
            setAddressLng(parseFloat(data.lng));
            setAddressVerified(true);
            setQuoteError(null);
            setQuoteTrigger((prev) => prev + 1);
          }
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Place details error:', err);
      }
      return;
    }

    const parts = (suggestion.display_name || '').split(',').map((p) => p.trim());
    const addr = suggestion.address || {};
    const road = addr.road || '';
    const houseNumber = addr.house_number || '';
    const line1 = `${houseNumber} ${road}`.trim() || parts.slice(0, 2).join(', ');

    const cityVal = addr.city || addr.town || addr.village || addr.suburb || '';
    const stateVal = (addr.state || '').substring(0, 2).toUpperCase() || 'NJ';
    const postcodeVal = addr.postcode || '';

    setAddressLine1(line1);
    setCity(cityVal);
    setState(stateVal);
    setZipCode(postcodeVal.substring(0, 5));

    setAddressLat(parseFloat(suggestion.lat));
    setAddressLng(parseFloat(suggestion.lon));
    setAddressVerified(true);
    setQuoteError(null);
    setQuoteTrigger((prev) => prev + 1);
    setSuggestions([]);
  };

  useEffect(() => {
    if (orderType !== 'delivery' || !restaurant?._id || items.length === 0) {
      setDeliveryQuote(null);
      setQuoteError(null);
      return;
    }

    if (!compiledAddress.trim()) {
      setDeliveryQuote(null);
      if (!hasDeliveryAddressInput) setQuoteError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        let lat = addressLat;
        let lng = addressLng;

        if (lat === null || lng === null) {
          const coords = await triggerGeocoding(compiledAddress);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
          }
        }

        const data = await orderAPI.getDeliveryQuote({
          restaurantId: restaurant?._id,
          address: compiledAddress,
          addressLat: lat,
          addressLng: lng,
          scheduledTime,
          items: checkoutItems,
        });
        setDeliveryQuote(data.data);
        setQuoteError(null);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Delivery quote failed';
        setQuoteError(errorMsg);
        setDeliveryQuote(null);

        if (errorMsg === 'Restaurant not found' || errorMsg.includes('no longer available')) {
          clearCart();
          showToast('Cart expired due to menu updates. Please start a new order.', 'error');
          router.push('/');
        }
      } finally {
        setQuoteLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compiledAddress, orderType, restaurant?._id, items.length, checkoutItems, addressLat, addressLng, quoteTrigger, scheduledTime]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsLocationLoading(true);
    setQuoteLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/location/reverse-geocode?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          );
          const data = await res.json();
          if (data) {
            const address = data.address || {};
            const parts = (data.display_name || '').split(',').map((p) => p.trim());
            const road =
              address.road ||
              address.pedestrian ||
              address.footway ||
              address.neighbourhood ||
              address.suburb ||
              '';
            const houseNumber = address.house_number || '';
            const line1 = `${houseNumber} ${road}`.trim() || parts[0] || '';

            let cityVal =
              address.city ||
              address.town ||
              address.village ||
              address.suburb ||
              address.county ||
              address.municipality ||
              address.city_district ||
              '';
            if (!cityVal && parts.length >= 4) {
              cityVal = parts[parts.length - 4] || '';
            }

            let stateName =
              address.state || address.region || address.state_district || address.province || '';
            if (!stateName && parts.length >= 3) {
              const penult = parts[parts.length - 2];
              const isNumericZip = /^\d+$/.test(penult) || /^\d+-\d+$/.test(penult) || /^\d{5,6}$/.test(penult);
              stateName = isNumericZip ? parts[parts.length - 3] || '' : penult || '';
            }

            let postcodeVal = address.postcode || address.postal_code || '';
            if (!postcodeVal) {
              const matchedPostcode = parts.find((p) => /^\d{5,6}$/.test(p));
              if (matchedPostcode) postcodeVal = matchedPostcode;
            }

            const stateCode = resolveStateCode(address, stateName);
            const zipCodeVal = postcodeVal ? postcodeVal.replace(/\D/g, '').substring(0, 5) : '';

            setAddressLine1(line1);
            setCity(cityVal);
            setState(stateCode || 'NJ');
            setZipCode(zipCodeVal);
            setAddressLat(pos.coords.latitude);
            setAddressLng(pos.coords.longitude);
            setAddressVerified(true);
            saveClientLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              city: cityVal,
              region: stateCode,
              country: 'US',
              display: [line1, cityVal, stateCode].filter(Boolean).join(', '),
            });
            setDeliveryQuote(null);
            setQuoteError(null);
            setQuoteTrigger((prev) => prev + 1);
            showToast('Current location detected successfully!', 'success');
          }
        } catch {
          showToast('Failed to reverse geocode location', 'error');
        } finally {
          setQuoteLoading(false);
          setIsLocationLoading(false);
        }
      },
      () => {
        setQuoteLoading(false);
        setIsLocationLoading(false);
        showToast('Unable to retrieve your location', 'error');
      }
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const data = await couponAPI.validate(couponCode.trim(), subtotal, restaurant?._id);
      setCouponDiscount(data.data.discount);
      setAppliedCouponData(data.data);
      setCouponApplied(true);
      showToast(`Coupon applied successfully! -$${data.data.discount.toFixed(2)}`, 'success');
    } catch (err) {
      showToast(err.message || 'Invalid coupon code', 'error');
      setCouponDiscount(0);
      setAppliedCouponData(null);
      setCouponApplied(false);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setAppliedCouponData(null);
    setCouponCode('');
  };

  const handleSaveAddressToProfile = async (label = 'Home') => {
    if (!compiledAddress.trim()) {
      showToast('Please enter a complete address first', 'warning');
      return;
    }
    let lat = addressLat;
    let lng = addressLng;
    if (lat === null || lng === null) {
      const coords = await triggerGeocoding(compiledAddress);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }
    if (isAuthenticated) {
      try {
        await authAPI.addAddress({
          label,
          address: compiledAddress,
          lat,
          lng,
          isDefault: !user?.savedAddresses?.length,
        });
        await refreshUser();
        showToast('Address saved to your account!', 'success');
      } catch (err) {
        showToast(err.message || 'Could not save address', 'error');
      }
    } else {
      setAddressVerified(true);
      setQuoteTrigger((prev) => prev + 1);
      showToast('Delivery address applied!', 'success');
    }
  };

  const isPhoneValid = phone
    ? !hasEmoji(phone) &&
      (typeof isValidPhoneNumber === 'function' && phone.startsWith('+')
        ? isValidPhoneNumber(phone)
        : phone.replace(/\D/g, '').length >= 10)
    : false;
  const isFullNameValid = fullName
    ? !hasEmoji(fullName) &&
      NAME_REGEX.test(fullName.trim()) &&
      fullName.trim().length >= 2 &&
      fullName.trim().length <= 50
    : false;
  const isEmailValid = email ? !hasEmoji(email) && EMAIL_REGEX.test(email.trim()) : false;

  const validateCheckoutFields = async () => {
    if (!fullName || !fullName.trim()) {
      showToast('Please enter your full name', 'warning');
      return false;
    }
    if (!email || !email.trim()) {
      showToast('Please enter your email address', 'warning');
      return false;
    }
    if (!phone || !phone.trim()) {
      showToast('Please enter your phone number for order updates', 'warning');
      return false;
    }
    if (!isFullNameValid) {
      showToast('Please enter a valid full name without emojis.', 'error');
      return false;
    }
    if (!isEmailValid) {
      showToast('Please enter a valid email address.', 'error');
      return false;
    }
    if (!isPhoneValid) {
      showToast('Please enter a valid 10-digit phone number.', 'error');
      return false;
    }
    if (orderType === 'delivery') {
      if (!compiledAddress.trim()) {
        showToast('Please select or enter a complete delivery address', 'warning');
        return false;
      }
      let currentLat = addressLat;
      let currentLng = addressLng;
      if (currentLat === null || currentLng === null) {
        setQuoteLoading(true);
        const coords = await triggerGeocoding(compiledAddress);
        setQuoteLoading(false);
        if (coords) {
          currentLat = coords.lat;
          currentLng = coords.lng;
        }
      }
      if (!deliveryQuote && restaurant?._id) {
        setQuoteLoading(true);
        try {
          const data = await orderAPI.getDeliveryQuote({
            restaurantId: restaurant._id,
            address: compiledAddress,
            addressLat: currentLat,
            addressLng: currentLng,
            scheduledTime,
            items: checkoutItems,
          });
          setDeliveryQuote(data.data);
          setQuoteError(null);
        } catch (err) {
          const errMsg = err.response?.data?.message || err.message || 'Delivery unavailable for this address';
          setQuoteError(errMsg);
          showToast(errMsg, 'error');
          setQuoteLoading(false);
          return false;
        } finally {
          setQuoteLoading(false);
        }
      }
      if (quoteError) {
        showToast(quoteError, 'error');
        return false;
      }
    }
    return true;
  };

  const handleContinueToPayment = async () => {
    const ok = await validateCheckoutFields();
    if (ok) setStep(2);
  };

  const handleContinueToReview = async () => {
    const ok = await validateCheckoutFields();
    if (ok) setStep(3);
  };

  const executeOrderCreation = async (paymentIntentId = null) => {
    setIsPlacingOrder(true);
    try {
      let finalPaymentMethod = paymentMethod;
      let savedCardId = undefined;

      if (paymentMethod && paymentMethod.startsWith('saved_card_')) {
        savedCardId = paymentMethod.replace('saved_card_', '');
        finalPaymentMethod = 'credit_card';
      } else if (['stripe_online', 'credit_card', 'upi', 'paypal'].includes(paymentMethod)) {
        finalPaymentMethod = 'credit_card';
      } else if (paymentMethod === 'cash_on_delivery') {
        finalPaymentMethod = 'cash';
      }

      if (city || addressLine1 || compiledAddress) {
        saveClientLocation({
          lat: addressLat,
          lng: addressLng,
          city: city || '',
          region: state || '',
          country: 'US',
          display: compiledAddress || [addressLine1, city, state].filter(Boolean).join(', '),
        });
      }

      const normalizedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;

      const orderData = {
        ...checkoutPayload,
        customerPhone: normalizedPhone,
        address: orderType === 'delivery' ? compiledAddress : restaurant?.address || 'Pickup at Restaurant',
        paymentMethod: finalPaymentMethod,
        savedCardId,
        courierNotes: deliveryInstructions || undefined,
        stripePaymentIntentId: paymentIntentId,
      };

      const data = await orderAPI.create(orderData);
      if (data?.data) {
        try {
          trackPurchase(data.data);
        } catch (trackErr) {
          console.warn('Failed to track purchase:', trackErr);
        }
      }
      clearCart();

      const trackingToken = data.data?.trackingToken;
      const targetUrl = trackingToken
        ? `/orders/${data.data._id}?token=${encodeURIComponent(trackingToken)}`
        : `/orders/${data.data._id}`;

      showToast(
        data.data?.isNewAccountCreated
          ? 'Order placed! Check your email to set your password.'
          : 'Order placed successfully! 🎉',
        'success'
      );
      router.push(targetUrl);
    } catch (err) {
      console.error('Checkout failed:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Checkout failed';
      showToast(errorMsg, 'error');

      if (errorMsg === 'Restaurant not found' || errorMsg.includes('no longer available')) {
        clearCart();
        router.push('/');
      }
    } finally {
      setIsPlacingOrder(false);
      setShowPaymentModal(false);
    }
  };

  const handlePlaceOrder = async () => {
    const ok = await validateCheckoutFields();
    if (!ok) return;

    if (ONLINE_PAYMENT_METHODS.includes(paymentMethod)) {
      setShowPaymentModal(true);
      return;
    }
    await executeOrderCreation();
  };

  return {
    router,
    isSingleRestaurantMode,
    isAuthenticated,
    step,
    setStep,
    fullName,
    setFullName,
    phone,
    setPhone,
    email,
    setEmail,
    addressLine1,
    setAddressLine1,
    addressLine2,
    setAddressLine2,
    city,
    setCity,
    state,
    setState,
    zipCode,
    setZipCode,
    deliveryInstructions,
    setDeliveryInstructions,
    orderType,
    setOrderType,
    paymentMethod,
    setPaymentMethod,
    deliveryTimeOption,
    setDeliveryTimeOption,
    scheduledDate,
    setScheduledDate,
    scheduledSlot,
    setScheduledSlot,
    scheduledTime,
    couponCode,
    setCouponCode,
    couponDiscount,
    couponApplied,
    appliedCouponData,
    couponLoading,
    useLoyaltyPoints,
    setUseLoyaltyPoints,
    loyaltyDiscount,
    showPaymentModal,
    setShowPaymentModal,
    isPlacingOrder,
    quoteLoading,
    isLocationLoading,
    quoteError,
    deliveryQuote,
    suggestions,
    suggestionsLoading,
    addressVerified,
    items,
    restaurant,
    subtotal,
    itemCount,
    updateQuantity,
    removeItem,
    openCart,
    specialInstructions,
    setSpecialInstructions,
    user,
    compiledAddress,
    checkoutPayload,
    tax,
    deliveryFee,
    platformFee,
    serviceFee,
    packagingFee,
    tip,
    setTip,
    total,
    isPhoneValid,
    isFullNameValid,
    isEmailValid,
    handleSelectSavedAddress,
    handleUseCurrentLocation,
    handleAddressLine1Change,
    handleSelectSuggestion,
    handleSaveAddressToProfile,
    handleApplyCoupon,
    handleRemoveCoupon,
    handleContinueToPayment,
    handleContinueToReview,
    handlePlaceOrder,
    executeOrderCreation,
  };
}
