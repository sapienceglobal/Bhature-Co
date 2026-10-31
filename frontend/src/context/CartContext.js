'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authAPI, restaurantAPI } from '@/lib/api';
import { trackAddToCart } from '@/lib/analytics';

const CartContext = createContext(null);

const LEGACY_CART_STORAGE_KEY = 'marketplace_cart';
const LEGACY_CART_RESTAURANT_KEY = 'marketplace_cart_restaurant';

const getTenantId = () => (
  process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true'
    ? (process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co')
    : 'marketplace'
);

const buildCartStorageKeys = (userId, tenantOverride = null) => {
  const owner = userId ? `user_${userId}` : 'guest';
  const scope = `${tenantOverride || getTenantId()}_${owner}`;
  return {
    items: `cart:${scope}:items`,
    restaurant: `cart:${scope}:restaurant`,
    owner,
  };
};

const parseSafeJSON = (raw, fallback) => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const normalizeCartItem = (item) => {
  if (!item) return null;
  const targetId = String(item.menuItemId || item._id || item.id || item.name || '');
  const quantity = Math.max(1, Number(item.quantity || item.qty || 1));
  const basePrice = Number(item.selectedSize?.price ?? item.price ?? 0);
  const addOnTotal = (item.addOns || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);

  return {
    ...item,
    _id: item._id || targetId,
    menuItemId: targetId,
    price: Number(item.price ?? basePrice),
    quantity,
    qty: quantity,
    lineTotal: Math.round((basePrice + addOnTotal) * quantity * 100) / 100,
  };
};

export const isSameCartLine = (a, b) => {
  if (!a || !b) return false;
  const aId = String(a.menuItemId || a._id || a.id || '');
  const bId = String(b.menuItemId || b._id || b.id || '');
  const sameIdOrName =
    (aId && bId && aId === bId) ||
    (a.name && b.name && a.name.toLowerCase().trim() === b.name.toLowerCase().trim());
  const sameSize =
    (a.selectedSize?.name || a.selectedSize?.label || null) ===
    (b.selectedSize?.name || b.selectedSize?.label || null);
  const sameAddons = JSON.stringify(a.addOns || []) === JSON.stringify(b.addOns || []);
  return Boolean(sameIdOrName && sameSize && sameAddons);
};

const mergeCartItems = (baseItems = [], incomingItems = []) => {
  const merged = (Array.isArray(baseItems) ? baseItems : [])
    .map(normalizeCartItem)
    .filter(Boolean);

  for (const rawIncoming of Array.isArray(incomingItems) ? incomingItems : []) {
    const incoming = normalizeCartItem(rawIncoming);
    if (!incoming) continue;

    const existingIdx = merged.findIndex((existing) => isSameCartLine(existing, incoming));
    if (existingIdx > -1) {
      const currentQty = merged[existingIdx].quantity || merged[existingIdx].qty || 1;
      const incomingQty = incoming.quantity || incoming.qty || 1;
      const newQty = Math.min(99, currentQty + incomingQty);
      const basePrice = Number(merged[existingIdx].selectedSize?.price ?? merged[existingIdx].price ?? 0);
      const addOnTotal = (merged[existingIdx].addOns || []).reduce((s, a) => s + (Number(a.price) || 0), 0);

      merged[existingIdx] = {
        ...merged[existingIdx],
        image: merged[existingIdx].image || incoming.image || null,
        quantity: newQty,
        qty: newQty,
        lineTotal: Math.round((basePrice + addOnTotal) * newQty * 100) / 100,
      };
    } else {
      merged.push(incoming);
    }
  }

  return merged;
};

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [hydratedOwner, setHydratedOwner] = useState(null);
  const [serverHydratedOwner, setServerHydratedOwner] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const latestCartRef = useRef({ items: [], restaurant: null, specialInstructions: '', owner: null });
  const pendingGuestCartRef = useRef(null);
  const applyingServerCartRef = useRef(false);
  const saveTimerRef = useRef(null);

  const storageKeys = useMemo(() => buildCartStorageKeys(user?._id), [user?._id]);

  useEffect(() => {
    latestCartRef.current = { items, restaurant, specialInstructions, owner: hydratedOwner };
  }, [items, restaurant, specialInstructions, hydratedOwner]);

  // 1. Hydrate from localStorage & handle Guest -> Logged-in User cart migration
  useEffect(() => {
    if (authLoading) return;

    try {
      const rawUserItems = localStorage.getItem(storageKeys.items);
      const rawUserRestaurant = localStorage.getItem(storageKeys.restaurant);
      const rawUserInstructions = localStorage.getItem(storageKeys.items + '_instructions');

      let parsedItems = parseSafeJSON(rawUserItems, []);
      let parsedRestaurant = parseSafeJSON(rawUserRestaurant, null);
      let parsedInstructions = rawUserInstructions || '';

      // Legacy fallback if brand tenant key changed from lassi-lounge -> bhatura-and-co
      if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
        const legacyTenantKeys = buildCartStorageKeys(user?._id, 'lassi-lounge');
        const legacyTenantItems = parseSafeJSON(localStorage.getItem(legacyTenantKeys.items), []);
        if (legacyTenantItems.length > 0) {
          parsedItems = legacyTenantItems;
          parsedRestaurant = parsedRestaurant || parseSafeJSON(localStorage.getItem(legacyTenantKeys.restaurant), null);
          parsedInstructions = parsedInstructions || localStorage.getItem(legacyTenantKeys.items + '_instructions') || '';
          localStorage.removeItem(legacyTenantKeys.items);
          localStorage.removeItem(legacyTenantKeys.restaurant);
          localStorage.removeItem(legacyTenantKeys.items + '_instructions');
        }
      }

      const latestCart = latestCartRef.current;

      // If user just logged in (or reloaded while logged in) and there are guest items,
      // capture and merge them even if the user's localStorage key previously existed as "[]".
      if (user?._id) {
        const guestKeys = buildCartStorageKeys(null);
        const legacyGuestKeys = buildCartStorageKeys(null, 'lassi-lounge');

        const guestStorageItems = parseSafeJSON(localStorage.getItem(guestKeys.items), []);
        const legacyGuestStorageItems = parseSafeJSON(localStorage.getItem(legacyGuestKeys.items), []);
        const guestRestaurant =
          parseSafeJSON(localStorage.getItem(guestKeys.restaurant), null) ||
          parseSafeJSON(localStorage.getItem(legacyGuestKeys.restaurant), null) ||
          (latestCart.owner === 'guest' ? latestCart.restaurant : null);
        const guestInstructions =
          localStorage.getItem(guestKeys.items + '_instructions') ||
          localStorage.getItem(legacyGuestKeys.items + '_instructions') ||
          (latestCart.owner === 'guest' ? latestCart.specialInstructions : '');

        let guestItemsToMigrate = [];
        if (latestCart.owner === 'guest' && Array.isArray(latestCart.items) && latestCart.items.length > 0) {
          guestItemsToMigrate = latestCart.items;
        } else if (guestStorageItems.length > 0) {
          guestItemsToMigrate = guestStorageItems;
        } else if (legacyGuestStorageItems.length > 0) {
          guestItemsToMigrate = legacyGuestStorageItems;
        }

        if (guestItemsToMigrate.length > 0) {
          pendingGuestCartRef.current = {
            items: guestItemsToMigrate.map(normalizeCartItem).filter(Boolean),
            restaurant: guestRestaurant,
            specialInstructions: guestInstructions,
          };

          parsedItems = mergeCartItems(parsedItems, guestItemsToMigrate);
          parsedRestaurant = parsedRestaurant || guestRestaurant;
          parsedInstructions = parsedInstructions || guestInstructions;

          localStorage.setItem(storageKeys.items, JSON.stringify(parsedItems));
          if (parsedRestaurant) localStorage.setItem(storageKeys.restaurant, JSON.stringify(parsedRestaurant));
          if (parsedInstructions) localStorage.setItem(storageKeys.items + '_instructions', parsedInstructions);
        }

        // Clean up guest cart storage so it is never merged twice
        localStorage.removeItem(guestKeys.items);
        localStorage.removeItem(guestKeys.restaurant);
        localStorage.removeItem(guestKeys.items + '_instructions');
        localStorage.removeItem(legacyGuestKeys.items);
        localStorage.removeItem(legacyGuestKeys.restaurant);
        localStorage.removeItem(legacyGuestKeys.items + '_instructions');
      } else if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
        const legacyItems = parseSafeJSON(localStorage.getItem(LEGACY_CART_STORAGE_KEY), []);
        if (legacyItems.length > 0) {
          parsedItems = legacyItems;
          parsedRestaurant = parsedRestaurant || parseSafeJSON(localStorage.getItem(LEGACY_CART_RESTAURANT_KEY), null);
          parsedInstructions = parsedInstructions || localStorage.getItem(LEGACY_CART_STORAGE_KEY + '_instructions') || '';
        }
      }

      setItems((Array.isArray(parsedItems) ? parsedItems : []).map(normalizeCartItem).filter(Boolean));
      setRestaurant(parsedRestaurant || null);
      setSpecialInstructions(parsedInstructions || '');
      setServerHydratedOwner(user?._id ? null : storageKeys.owner);
    } catch {
      localStorage.removeItem(storageKeys.items);
      localStorage.removeItem(storageKeys.restaurant);
      localStorage.removeItem(storageKeys.items + '_instructions');
      setItems([]);
      setRestaurant(null);
      setSpecialInstructions('');
      setServerHydratedOwner(user?._id ? null : storageKeys.owner);
    } finally {
      setHydratedOwner(storageKeys.owner);
    }
  }, [authLoading, storageKeys.items, storageKeys.restaurant, storageKeys.owner, user?._id]);

  // 2. Sync with User DB Cart (/api/auth/me/cart) on login and merge any guest items
  useEffect(() => {
    if (authLoading || !user?._id || hydratedOwner !== storageKeys.owner) return;

    let cancelled = false;
    const localSnapshot = latestCartRef.current;
    const pendingGuest = pendingGuestCartRef.current;
    pendingGuestCartRef.current = null;

    const loadServerCart = async () => {
      try {
        const response = await authAPI.getCart();
        if (cancelled) return;

        const savedCart = response?.data || {};
        const serverItems = (Array.isArray(savedCart.items) ? savedCart.items : [])
          .map(normalizeCartItem)
          .filter(Boolean);
        const hasServerItems = serverItems.length > 0;
        const hasGuestItems = Array.isArray(pendingGuest?.items) && pendingGuest.items.length > 0;

        applyingServerCartRef.current = true;

        if (hasServerItems && hasGuestItems) {
          // User had a saved DB cart AND added items as a guest before logging in -> merge both!
          const mergedItems = mergeCartItems(serverItems, pendingGuest.items);
          const mergedRestaurant = savedCart.restaurant || pendingGuest.restaurant || localSnapshot.restaurant || null;
          const mergedInstructions = savedCart.specialInstructions || pendingGuest.specialInstructions || localSnapshot.specialInstructions || '';

          setItems(mergedItems);
          setRestaurant(mergedRestaurant);
          if (mergedInstructions) setSpecialInstructions(mergedInstructions);

          await authAPI.updateCart({
            items: mergedItems,
            restaurant: mergedRestaurant,
            specialInstructions: mergedInstructions,
          });
        } else if (hasServerItems) {
          setItems(serverItems);
          setRestaurant(savedCart.restaurant || localSnapshot.restaurant || null);
          if (savedCart.specialInstructions) {
            setSpecialInstructions(savedCart.specialInstructions);
          }
        } else if (hasGuestItems || localSnapshot.items.length > 0) {
          const itemsToPersist = hasGuestItems
            ? mergeCartItems(localSnapshot.items, pendingGuest.items)
            : localSnapshot.items;
          const restaurantToPersist = localSnapshot.restaurant || pendingGuest?.restaurant || null;
          const instructionsToPersist = localSnapshot.specialInstructions || pendingGuest?.specialInstructions || '';

          setItems(itemsToPersist);
          if (restaurantToPersist) setRestaurant(restaurantToPersist);

          await authAPI.updateCart({
            items: itemsToPersist,
            restaurant: restaurantToPersist,
            specialInstructions: instructionsToPersist,
          });
        }
      } catch {
        // Keep the user-scoped browser cache available if the network is down.
      } finally {
        if (!cancelled) {
          setServerHydratedOwner(storageKeys.owner);
          setTimeout(() => {
            applyingServerCartRef.current = false;
          }, 0);
        }
      }
    };

    loadServerCart();

    return () => {
      cancelled = true;
    };
  }, [authLoading, hydratedOwner, storageKeys.owner, user?._id]);

  // 3. Persist to scoped browser localStorage immediately on any cart change
  useEffect(() => {
    if (authLoading || hydratedOwner !== storageKeys.owner) return;
    localStorage.setItem(storageKeys.items, JSON.stringify(items));
    localStorage.setItem(storageKeys.items + '_instructions', specialInstructions);
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY + '_instructions');
  }, [authLoading, hydratedOwner, items, specialInstructions, storageKeys.items, storageKeys.owner]);

  // 4. Cross-tab real-time synchronization via window storage event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorageChange = (e) => {
      if (e.key === storageKeys.items && e.newValue !== null) {
        const nextItems = parseSafeJSON(e.newValue, []).map(normalizeCartItem).filter(Boolean);
        setItems(nextItems);
      } else if (e.key === storageKeys.items + '_instructions') {
        setSpecialInstructions(e.newValue || '');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKeys.items]);

  // 5. Auto-load / refresh active restaurant metadata
  useEffect(() => {
    if (authLoading || hydratedOwner !== storageKeys.owner) return;
    if (restaurant) {
      localStorage.setItem(storageKeys.restaurant, JSON.stringify(restaurant));

      restaurantAPI.getById(restaurant._id || process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co')
        .then((data) => {
          if (data?.data && JSON.stringify(data.data.operatingHours) !== JSON.stringify(restaurant.operatingHours)) {
            setRestaurant(data.data);
          }
        })
        .catch(() => {});
    } else {
      localStorage.removeItem(storageKeys.restaurant);

      if (process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true') {
        restaurantAPI.getById(process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'bhatura-and-co')
          .then((data) => {
            if (data?.data) setRestaurant(data.data);
          })
          .catch(() => {});
      }
    }
    localStorage.removeItem(LEGACY_CART_RESTAURANT_KEY);
  }, [authLoading, hydratedOwner, restaurant, storageKeys.owner, storageKeys.restaurant]);

  // 6. Debounced background persistence to user's MongoDB account when logged in
  useEffect(() => {
    if (
      authLoading ||
      !user?._id ||
      hydratedOwner !== storageKeys.owner ||
      serverHydratedOwner !== storageKeys.owner ||
      applyingServerCartRef.current
    ) {
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      authAPI.updateCart({ items, restaurant, specialInstructions }).catch(() => {});
    }, 300);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [authLoading, hydratedOwner, items, restaurant, specialInstructions, serverHydratedOwner, storageKeys.owner, user?._id]);

  const addItem = useCallback((item, restaurantData) => {
    if (
      process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE !== 'true' &&
      restaurant &&
      restaurantData &&
      restaurant._id !== restaurantData._id
    ) {
      return { conflict: true, pendingItem: item, pendingRestaurant: restaurantData };
    }

    if (restaurantData && !restaurant) {
      setRestaurant(restaurantData);
    }

    try {
      trackAddToCart(item);
    } catch (trackErr) {
      console.warn('Failed to track add_to_cart:', trackErr);
    }

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => isSameCartLine(i, item));
      const addedQty = Math.max(1, Number(item.quantity || item.qty || 1));

      if (existingIdx > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIdx].quantity || updated[existingIdx].qty || 1;
        const newQty = Math.min(99, currentQty + addedQty);
        const basePrice = Number(updated[existingIdx].selectedSize?.price ?? updated[existingIdx].price ?? 0);
        const addOnTotal = (updated[existingIdx].addOns || []).reduce((s, a) => s + (Number(a.price) || 0), 0);

        updated[existingIdx] = {
          ...updated[existingIdx],
          // Upgrade to real MongoDB _id if a real item object is passed later
          menuItemId:
            item._id && !String(item._id).startsWith('dish-')
              ? String(item._id)
              : updated[existingIdx].menuItemId,
          image: updated[existingIdx].image || item.image || null,
          quantity: newQty,
          qty: newQty,
          lineTotal: Math.round((basePrice + addOnTotal) * newQty * 100) / 100,
        };
        return updated;
      }

      const normalized = normalizeCartItem({ ...item, quantity: addedQty });
      return normalized ? [...prev, normalized] : prev;
    });

    return { conflict: false };
  }, [restaurant]);

  const switchRestaurant = useCallback((item, newRestaurant) => {
    setRestaurant(newRestaurant);
    const normalized = normalizeCartItem(item);
    setItems(normalized ? [normalized] : []);
  }, []);

  const removeItem = useCallback((index) => {
    setItems((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0 && process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE !== 'true') {
        setRestaurant(null);
      }
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((index, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(index);
      return;
    }
    setItems((prev) => {
      if (!prev[index]) return prev;
      const currentQty = prev[index].quantity || prev[index].qty || 1;

      if (newQuantity > currentQty) {
        try {
          trackAddToCart({
            ...prev[index],
            quantity: newQuantity - currentQty,
            qty: newQuantity - currentQty,
          });
        } catch (trackErr) {
          console.warn('Failed to track add_to_cart on quantity increase:', trackErr);
        }
      }

      const updated = [...prev];
      const clampedQty = Math.min(99, newQuantity);
      const basePrice = Number(updated[index].selectedSize?.price ?? updated[index].price ?? 0);
      const addOnTotal = (updated[index].addOns || []).reduce((s, a) => s + (Number(a.price) || 0), 0);

      updated[index] = {
        ...updated[index],
        quantity: clampedQty,
        qty: clampedQty,
        lineTotal: Math.round((basePrice + addOnTotal) * clampedQty * 100) / 100,
      };
      return updated;
    });
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE !== 'true') {
      setRestaurant(null);
    }
    setSpecialInstructions('');
    if (user?._id) {
      authAPI.clearCart().catch(() => {});
    }
  }, [user?._id]);

  // Helper methods so any component on any page can query or step quantities effortlessly
  const findCartIndex = useCallback((targetItem) => {
    if (!targetItem) return -1;
    const tId = String(targetItem.menuItemId || targetItem._id || targetItem.id || '');
    const tName = targetItem.name ? targetItem.name.toLowerCase().trim() : '';
    return items.findIndex((ci) => {
      const cId = String(ci.menuItemId || ci._id || ci.id || '');
      const cName = ci.name ? ci.name.toLowerCase().trim() : '';
      return (tId && cId && tId === cId) || (tName && cName && tName === cName);
    });
  }, [items]);

  const getItemQuantity = useCallback((targetItem) => {
    if (!targetItem) return 0;
    const tId = String(targetItem.menuItemId || targetItem._id || targetItem.id || '');
    const tName = targetItem.name ? targetItem.name.toLowerCase().trim() : '';
    return items.reduce((sum, ci) => {
      const cId = String(ci.menuItemId || ci._id || ci.id || '');
      const cName = ci.name ? ci.name.toLowerCase().trim() : '';
      const matched = (tId && cId && tId === cId) || (tName && cName && tName === cName);
      return matched ? sum + (ci.quantity || ci.qty || 0) : sum;
    }, 0);
  }, [items]);

  const incrementItem = useCallback((targetItem, restaurantData) => {
    const idx = findCartIndex(targetItem);
    if (idx > -1) {
      const currentQty = items[idx].quantity || items[idx].qty || 1;
      updateQuantity(idx, currentQty + 1);
      return { conflict: false, updated: true };
    }
    return addItem({ ...targetItem, quantity: 1 }, restaurantData || restaurant);
  }, [addItem, findCartIndex, items, restaurant, updateQuantity]);

  const decrementItem = useCallback((targetItem) => {
    const idx = findCartIndex(targetItem);
    if (idx > -1) {
      const currentQty = items[idx].quantity || items[idx].qty || 1;
      updateQuantity(idx, currentQty - 1);
    }
  }, [findCartIndex, items, updateQuantity]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // ── Computed values ───────────────────────────────────────────────────
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || i.qty || 0), 0);
  const subtotal = items.reduce((sum, i) => sum + (i.lineTotal || ((i.price || 0) * (i.quantity || i.qty || 1))), 0);

  const value = {
    items,
    restaurant,
    itemCount,
    subtotal,
    specialInstructions,
    setSpecialInstructions,
    addItem,
    switchRestaurant,
    updateQuantity,
    removeItem,
    clearCart,
    findCartIndex,
    getItemQuantity,
    incrementItem,
    decrementItem,
    isCartOpen,
    openCart,
    closeCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
