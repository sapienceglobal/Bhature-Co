import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  MapPin,
  Navigation,
  History,
  Loader2,
  ArrowLeft,
  Home,
  Briefcase,
  Map,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/components/ui';
import dynamic from 'next/dynamic';

const MapLocationPicker = dynamic(() => import('@/components/shared/MapLocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[320px] bg-[#FAF3E8] rounded-b-2xl">
      <div className="w-14 h-14 rounded-full bg-[#8B1E1E]/10 border border-[#D4AF37]/40 flex items-center justify-center mb-3">
        <Loader2 className="w-7 h-7 text-[#8B1E1E] animate-spin" />
      </div>
      <p className="text-sm font-bold text-[#4A090B] font-['Playfair_Display'] tracking-wide">
        Loading Interactive Map...
      </p>
    </div>
  ),
});

export default function AddressModal({ isOpen, onClose, onSelect, onSelectAddress, initialView = 'map' }) {
  const emitSelect = (payload) => {
    onSelect?.(payload);
    onSelectAddress?.(payload);
  };
  const { user } = useAuth();
  const [view, setView] = useState(initialView);
  const [selectedCenter, setSelectedCenter] = useState(null);

  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const searchTimeout = useRef(null);
  const sessionTokenRef = useRef(null);
  const requestCount = useRef(0);

  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  // Body scroll lock when modal is open
  useEffect(() => {
    if (show) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [show]);

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
    let timeoutId;
    if (isOpen) {
      setMounted(true);
      timeoutId = setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
      timeoutId = setTimeout(() => setMounted(false), 300);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      onClose?.();
      setSearch('');
      setSuggestions([]);
      setView(initialView);
      setSelectedCenter(null);
    }, 280);
  };

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setSelectedCenter(null);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (show) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [show]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (val.trim().length < 3) {
      requestCount.current += 1;
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    searchTimeout.current = setTimeout(async () => {
      const currentReq = ++requestCount.current;
      try {
        const res = await fetch(
          `/api/location/autocomplete?q=${encodeURIComponent(val)}&sessionToken=${getSessionToken()}`
        );
        const data = await res.json();
        if (currentReq === requestCount.current) {
          setSuggestions(data || []);
        }
      } catch (err) {
        console.error('Nominatim search error:', err);
      } finally {
        if (currentReq === requestCount.current) {
          setIsLoading(false);
        }
      }
    }, 400);
  };

  const handleSuggestionSelect = async (suggestion) => {
    if (suggestion.place_id) {
      try {
        const res = await fetch(
          `/api/location/place?place_id=${suggestion.place_id}&sessionToken=${sessionTokenRef.current || ''}`
        );
        const data = await res.json();
        sessionTokenRef.current = null;
        if (data.lat && data.lng) {
          setSelectedCenter({ lat: parseFloat(data.lat), lng: parseFloat(data.lng) });
          setView('map');
          return;
        }
      } catch (err) {
        console.error('Place details error:', err);
      }
    }
    if (suggestion.lat && suggestion.lon) {
      setSelectedCenter({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
      setView('map');
    } else if (suggestion.display_name) {
      emitSelect({
        address: suggestion.display_name,
        lat: null,
        lng: null,
        addressDetails: suggestion.address || {},
      });
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        setView('map');
      },
      () => {
        setIsLocating(false);
        showToast('Unable to retrieve your location', 'error');
      }
    );
  };

  const handleFinalLocationConfirm = (locationData) => {
    emitSelect(locationData);
    setSearch('');
    setSuggestions([]);
    setView(initialView);
    setSelectedCenter(null);
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-4 font-sans">
      {/* Rich Warm Backdrop */}
      <div
        className={`fixed inset-0 bg-[#1C080A]/75 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          show ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Royal Heritage Modal Container */}
      <div
        className={`relative z-10 w-full sm:max-w-xl bg-[#FDF8EE] text-[#1C1917] sm:rounded-[28px] rounded-t-[28px] shadow-[0_25px_70px_rgba(28,8,10,0.45)] border-2 border-[#D4AF37]/40 overflow-hidden flex flex-col h-[88dvh] sm:h-[640px] sm:max-h-[88vh] transition-all duration-300 ease-out ${
          show
            ? 'opacity-100 translate-y-0 sm:scale-100'
            : 'opacity-0 translate-y-full sm:translate-y-4 sm:scale-95'
        }`}
      >
        {/* Royal Maroon & Gold Header */}
        <div className="relative bg-gradient-to-r from-[#4A090B] via-[#6D1318] to-[#4A090B] px-5 sm:px-6 pt-4 pb-4 border-b-2 border-[#D4AF37]/50 shrink-0 overflow-hidden">
          {/* Subtle Gold Ornamental Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#D4AF37]/15 blur-2xl pointer-events-none" />

          {/* Mobile Grab Handle */}
          <div className="pb-2 sm:hidden flex justify-center">
            <div className="w-11 h-1.5 bg-[#D4AF37]/40 rounded-full" />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {view === 'map' ? (
                <button
                  type="button"
                  onClick={() => setView('search')}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-[#D4AF37]/40 text-[#F5E6D3] flex items-center justify-center transition-all cursor-pointer shrink-0"
                  aria-label="Back to search or saved addresses"
                  title="Search or saved addresses"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setView('map')}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-[#D4AF37]/40 text-[#F5E6D3] flex items-center justify-center transition-all cursor-pointer shrink-0"
                  aria-label="Back to map"
                  title="Back to map"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  <Sparkles className="w-3 h-3" />
                  <span>Bhatura &amp; Co Express</span>
                </div>
                <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#FFFDF9] tracking-wide truncate">
                  {view === 'search' ? 'Select Delivery Location' : 'Pin Exact Doorstep'}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#D4AF37] text-[#F5E6D3] hover:text-[#3B060A] border border-[#D4AF37]/35 flex items-center justify-center transition-all cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2.3} />
            </button>
          </div>
        </div>

        {view === 'search' ? (
          <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-b from-[#FCF3E8] to-[#FDF8EE]">
            {/* Search Input Bar */}
            <div className="px-5 sm:px-6 pt-5 pb-4 relative z-40">
              <div className="relative flex items-center bg-white rounded-2xl border-2 border-[#E6D3BA] focus-within:border-[#8B1E1E] focus-within:ring-4 focus-within:ring-[#8B1E1E]/10 shadow-[0_8px_24px_rgba(92,6,18,0.08)] transition-all overflow-hidden">
                <Search className="ml-4 h-5 w-5 text-[#8B1E1E] shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search street address, neighborhood, or ZIP code..."
                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-[#1C1917] font-semibold px-3.5 py-3.5 text-sm sm:text-[15px] placeholder:text-[#78716C] placeholder:font-normal"
                  autoFocus
                />
                {search && !isLoading && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setSuggestions([]);
                    }}
                    className="mr-3 p-1 rounded-full text-stone-400 hover:text-[#8B1E1E] hover:bg-[#FAF0E1] transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isLoading && (
                  <Loader2 className="mr-4 h-5 w-5 text-[#8B1E1E] animate-spin shrink-0" />
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {suggestions && suggestions.length > 0 && (
                <div className="absolute left-5 right-5 sm:left-6 sm:right-6 top-[calc(100%-6px)] rounded-2xl border-2 border-[#E6D3BA] bg-white shadow-[0_20px_50px_rgba(59,6,10,0.22)] z-[100] overflow-hidden max-h-[260px] overflow-y-auto">
                  <ul className="divide-y divide-[#F5EBE0]">
                    {suggestions.map((s, idx) => (
                      <li key={s.place_id || idx}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionSelect(s)}
                          className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-[#FDF7ED] transition-colors text-left group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#8B1E1E]/10 group-hover:bg-[#8B1E1E] text-[#8B1E1E] group-hover:text-white flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1C1917] text-sm truncate group-hover:text-[#8B1E1E] transition-colors">
                              {s.main_text || s.display_name?.split(',')[0]}
                            </p>
                            <p className="text-xs text-[#78716C] mt-0.5 truncate">
                              {s.secondary_text ||
                                s.display_name?.split(',').slice(1).join(',').trim()}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#C99742] self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Scrollable Content: GPS Action, Interactive Map Button & Saved Addresses */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 space-y-3">
              {/* Action 1: Use Current GPS Location */}
              <button
                type="button"
                onClick={handleCurrentLocation}
                disabled={isLocating}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#FFFDF9] to-[#FAF0E1] border-2 border-[#E6D3BA] hover:border-[#8B1E1E] rounded-2xl shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isLocating
                        ? 'bg-[#D4AF37]/20 text-[#8B1E1E]'
                        : 'bg-[#8B1E1E]/10 text-[#8B1E1E] group-hover:bg-[#8B1E1E] group-hover:text-white'
                    }`}
                  >
                    <Navigation
                      className={`h-5 w-5 ${isLocating ? 'animate-pulse' : ''}`}
                    />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm sm:text-[15px] font-bold text-[#4A090B]">
                      {isLocating ? 'Detecting GPS Coordinates...' : 'Use My Current Location'}
                    </p>
                    <p className="text-xs text-[#78716C] font-medium mt-0.5 truncate">
                      Auto-detect exact street &amp; pin on map via GPS
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#F5E6D3] group-hover:bg-[#8B1E1E] flex items-center justify-center transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4 text-[#8B1E1E] group-hover:text-white transition-colors" />
                </div>
              </button>

              {/* Action 2: Open Interactive Map Directly */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCenter({ lat: 40.5602, lng: -74.3498 }); // Oak Tree Rd, Edison, NJ default
                  setView('map');
                }}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-[#E6D3BA] hover:border-[#D48228] rounded-2xl shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#D48228]/15 text-[#B45309] group-hover:bg-[#D48228] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <Map className="h-5 w-5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm sm:text-[15px] font-bold text-[#1C1917] group-hover:text-[#8B1E1E] transition-colors">
                      Pin Location on Interactive Map
                    </p>
                    <p className="text-xs text-[#78716C] font-medium mt-0.5 truncate">
                      Drag the map marker to your exact building entrance
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FAF0E1] group-hover:bg-[#D48228] flex items-center justify-center transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4 text-[#B45309] group-hover:text-white transition-colors" />
                </div>
              </button>

              {/* Saved Addresses Section */}
              {user?.savedAddresses?.length > 0 && (
                <div className="pt-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-2 h-2 rotate-45 bg-[#D48228]" />
                    <h3 className="text-[11px] font-black text-[#8B1E1E] uppercase tracking-[0.18em]">
                      Your Saved Addresses
                    </h3>
                    <div className="h-px bg-[#E6D3BA] flex-1" />
                  </div>

                  <ul className="space-y-2.5">
                    {user.savedAddresses.map((addr, idx) => {
                      const isWork = (addr.label || '').toLowerCase() === 'work';
                      return (
                        <li key={addr._id || idx}>
                          <button
                            type="button"
                            onClick={() =>
                              emitSelect({
                                address: addr.address,
                                lat: addr.lat,
                                lng: addr.lng,
                              })
                            }
                            className="w-full flex items-center gap-3.5 p-3.5 bg-white border border-[#E6D3BA] hover:border-[#8B1E1E] rounded-2xl hover:shadow-md transition-all group text-left cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[#FAF0E1] group-hover:bg-[#8B1E1E] text-[#8B1E1E] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                              {isWork ? (
                                <Briefcase className="h-4 w-4" />
                              ) : (
                                <Home className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-[#1C1917] group-hover:text-[#8B1E1E] transition-colors">
                                  {addr.label || 'Saved Address'}
                                </p>
                                {addr.isDefault && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1E1E]/10 text-[#8B1E1E]">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#78716C] mt-0.5 truncate font-medium">
                                {addr.address}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#C99742] shrink-0" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col bg-[#FDF8EE] text-[#1C1917] overflow-hidden">
            <MapLocationPicker
              initialCenter={selectedCenter}
              onLocationSelect={handleFinalLocationConfirm}
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
