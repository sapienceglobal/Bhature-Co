'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, Navigation, MapPin, Search, X, Check } from 'lucide-react';

// fix for default marker icon issues in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Updates parent with map's center coordinates when user finishes dragging
function MapCenterWatcher({ onMapSettle }) {
  const map = useMap();
  const onMapSettleRef = useRef(onMapSettle);
  onMapSettleRef.current = onMapSettle;

  useEffect(() => {
    const t1 = setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 150);
    const t2 = setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 450);

    const handleMoveEnd = () => {
      const center = map.getCenter();
      onMapSettleRef.current({ lat: center.lat, lng: center.lng });
    };

    map.on('moveend', handleMoveEnd);
    handleMoveEnd();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.off('moveend', handleMoveEnd);
    };
  }, [map]);

  return null;
}

export default function MapLocationPicker({
  initialCenter,
  onLocationSelect,
  onAddressChange,
}) {
  const [center, setCenter] = useState(
    initialCenter || { lat: 40.5602, lng: -74.3498 } // Default Oak Tree Rd, Edison, NJ
  );
  const [currentAddress, setCurrentAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [flatNo, setFlatNo] = useState('');
  const [landmark, setLandmark] = useState('');

  // Search State
  const [searchInput, setSearchInput] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const sessionTokenRef = useRef(null);

  const getSessionToken = () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15);
    }
    return sessionTokenRef.current;
  };

  const mapRef = useRef(null);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setCenter({ lat: newLat, lng: newLng });
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], mapRef.current.getZoom(), {
            animate: true,
            duration: 0.5,
          });
        }
      },
      (err) => console.error(err)
    );
  }, []);

  useEffect(() => {
    if (!initialCenter) {
      locateMe();
    } else if (mapRef.current) {
      mapRef.current.setView([initialCenter.lat, initialCenter.lng], mapRef.current.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    }
  }, [initialCenter, locateMe]);

  const geocodeTimeout = useRef(null);

  const reverseGeocode = useCallback(
    async (lat, lng) => {
      setIsGeocoding(true);
      try {
        const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
        const data = await res.json();

        let addressString = data.display_name || 'Selected Location';

        if (data.address) {
          setAddressDetails(data.address);
          const { road, house_number, suburb, city, town, state, postcode } = data.address;
          const mainPart = [house_number, road].filter(Boolean).join(' ');
          const secondaryPart = [suburb, city || town, state, postcode]
            .filter(Boolean)
            .join(', ');
          const constructed = [mainPart, secondaryPart].filter(Boolean).join(', ');
          if (constructed.length > 5) {
            addressString = constructed;
          }
        }

        setCurrentAddress(addressString);
        if (onAddressChange) {
          onAddressChange({
            address: addressString,
            lat,
            lng,
            details: data.address,
          });
        }
      } catch (err) {
        console.error('Reverse geocoding error:', err);
        setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } finally {
        setIsGeocoding(false);
      }
    },
    [onAddressChange]
  );

  const handleMapSettle = useCallback(
    (newCenter) => {
      setCenter((prev) => {
        const dist = Math.hypot(newCenter.lat - prev.lat, newCenter.lng - prev.lng);
        if (dist < 0.00005 && currentAddress) {
          return prev;
        }
        if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
        geocodeTimeout.current = setTimeout(() => {
          reverseGeocode(newCenter.lat, newCenter.lng);
        }, 450);
        return newCenter;
      });
    },
    [reverseGeocode, currentAddress]
  );

  const handleConfirm = () => {
    const formattedParts = [
      flatNo ? `Apt/Flat ${flatNo}` : '',
      currentAddress,
      landmark ? `(Near ${landmark})` : '',
    ].filter(Boolean);

    onLocationSelect({
      address: formattedParts.join(', '),
      lat: center.lat,
      lng: center.lng,
      addressDetails,
      flatNo,
      landmark,
    });
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 3) {
      setSearchSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/location/autocomplete?q=${encodeURIComponent(val)}&sessionToken=${getSessionToken()}`
        );
        const data = await res.json();
        setSearchSuggestions(data || []);
      } catch (err) {
        console.error('Nominatim search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSuggestionSelect = async (suggestion) => {
    setSearchInput(suggestion.display_name);
    setSearchSuggestions([]);

    if (suggestion.place_id) {
      try {
        setIsGeocoding(true);
        const res = await fetch(
          `/api/location/place?place_id=${suggestion.place_id}&sessionToken=${sessionTokenRef.current || ''}`
        );
        const data = await res.json();
        sessionTokenRef.current = null;
        if (data.lat && data.lng) {
          const newCenter = { lat: parseFloat(data.lat), lng: parseFloat(data.lng) };
          setCenter(newCenter);
          if (mapRef.current) {
            mapRef.current.setView([newCenter.lat, newCenter.lng], 18, { animate: true });
          }
        }
      } catch (err) {
        console.error('Place details error:', err);
      } finally {
        setIsGeocoding(false);
      }
    } else if (suggestion.lat && suggestion.lon) {
      const newCenter = { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) };
      setCenter(newCenter);
      if (mapRef.current) {
        mapRef.current.setView([newCenter.lat, newCenter.lng], 18, { animate: true });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDF8EE] relative animate-in fade-in duration-300 rounded-b-2xl overflow-hidden">
      {/* Map Container */}
      <div className="relative flex-1 min-h-[220px] sm:min-h-[280px] w-full bg-[#F5E6D3]">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={17}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${
              process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_4so6_1_49d0bb5acb4e92a5afa7d397'
            }`}
          />
          <MapCenterWatcher onMapSettle={handleMapSettle} />
        </MapContainer>

        {/* Floating Search Bar on Map */}
        <div className="absolute top-3.5 left-4 right-4 z-[500]">
          <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border-2 border-[#E6D3BA] focus-within:border-[#8B1E1E] transition-colors">
            <Search className="ml-3.5 h-4 w-4 text-[#8B1E1E] shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search street, landmark, or ZIP code..."
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[#1C1917] font-semibold px-3 py-2.5 text-xs sm:text-sm placeholder:text-[#78716C] placeholder:font-normal"
            />
            {isSearching && (
              <div className="pr-3.5">
                <Loader2 className="h-4 w-4 text-[#8B1E1E] animate-spin" />
              </div>
            )}
            {searchInput && !isSearching && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchSuggestions([]);
                  setIsSearching(false);
                }}
                className="pr-3.5 text-stone-400 hover:text-[#8B1E1E] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {searchSuggestions.length > 0 && (
            <ul className="mt-1.5 bg-white rounded-2xl shadow-xl border-2 border-[#E6D3BA] overflow-hidden max-h-44 overflow-y-auto divide-y divide-[#F5EBE0]">
              {searchSuggestions.map((s, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionSelect(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#FDF7ED] transition-colors text-xs sm:text-sm cursor-pointer"
                  >
                    <p className="font-bold text-[#1C1917] leading-tight truncate">
                      {s.display_name.split(',')[0]}
                    </p>
                    <p className="text-[11px] text-[#78716C] mt-0.5 truncate">{s.display_name}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Center Fixed Royal Maroon & Gold Marker Pin */}
        <div
          className="absolute top-1/2 left-1/2 z-[400] pointer-events-none flex flex-col items-center"
          style={{ transform: 'translate(-50%, -100%)' }}
        >
          <div
            className={`transition-transform duration-300 ease-out ${
              isGeocoding ? '-translate-y-3' : 'translate-y-0'
            }`}
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="#8B1E1E"
              stroke="#D4AF37"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0px 6px 10px rgba(74,9,11,0.4))' }}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3.5" fill="#FFFDF9" stroke="none" />
            </svg>
          </div>
          <div className="w-2.5 h-2.5 bg-[#8B1E1E] border-2 border-[#D4AF37] rounded-full absolute bottom-[-4px] shadow-sm" />
        </div>

        {/* Locate Me FAB */}
        <button
          type="button"
          onClick={locateMe}
          title="Recenter on my GPS location"
          className="absolute bottom-4 right-4 z-[400] bg-white text-[#8B1E1E] hover:bg-[#8B1E1E] hover:text-white p-3 rounded-xl shadow-lg border-2 border-[#E6D3BA] active:scale-95 transition-all cursor-pointer"
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {/* Royal Heritage Address Confirmation Bottom Sheet */}
      <div className="bg-gradient-to-b from-[#FCF3E8] to-[#FDF8EE] shadow-[0_-10px_25px_rgba(74,9,11,0.08)] p-4 sm:p-5 z-[500] relative flex flex-col gap-3 shrink-0 border-t-2 border-[#E6D3BA]">
        {/* Geocoded Address Preview Card */}
        <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-[#E6D3BA] shadow-xs min-h-[58px]">
          <div className="w-9 h-9 rounded-xl bg-[#8B1E1E]/10 text-[#8B1E1E] flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[#4A090B] text-xs uppercase tracking-wider mb-0.5">
              Pinned Delivery Address
            </h4>
            {isGeocoding ? (
              <div className="flex items-center gap-2 text-[#78716C] text-xs font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B1E1E]" />
                <span>Fetching exact street address...</span>
              </div>
            ) : (
              <p className="text-[#1C1917] text-xs sm:text-sm font-semibold leading-snug line-clamp-2">
                {currentAddress}
              </p>
            )}
          </div>
        </div>

        {/* Optional Apt/Suite & Landmark Row */}
        <div className="grid grid-cols-2 gap-2.5">
          <input
            type="text"
            value={flatNo}
            onChange={(e) => setFlatNo(e.target.value)}
            placeholder="Apt / Suite / Floor (optional)"
            className="bg-white rounded-xl border border-[#E6D3BA] focus:border-[#8B1E1E] outline-none px-3 py-2 text-xs text-[#1C1917] placeholder:text-[#78716C] font-medium"
          />
          <input
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Delivery note / Landmark"
            className="bg-white rounded-xl border border-[#E6D3BA] focus:border-[#8B1E1E] outline-none px-3 py-2 text-xs text-[#1C1917] placeholder:text-[#78716C] font-medium"
          />
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isGeocoding || !currentAddress}
          className="w-full bg-gradient-to-r from-[#8B1E1E] via-[#9E141D] to-[#701515] hover:from-[#701515] hover:to-[#5C0612] text-white font-bold py-3.5 rounded-xl border border-[#D4AF37]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(139,30,30,0.3)] active:scale-[0.99] cursor-pointer text-sm"
        >
          {isGeocoding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4 text-[#D4AF37] stroke-[3]" />
          )}
          <span>Confirm Delivery Location</span>
          <span className="text-[#D4AF37] font-black">→</span>
        </button>
      </div>
    </div>
  );
}
