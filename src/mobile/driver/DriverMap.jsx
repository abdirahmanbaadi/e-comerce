import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { hasGoogleMapsKey, loadGoogleMaps } from '../../utils/googleMaps';

/** Customer destination — classic black map pin. */
const CUSTOMER_PIN_SVG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <path fill="#111111" d="M18 0C8.06 0 0 8.06 0 18c0 12.75 18 30 18 30s18-17.25 18-30C36 8.06 27.94 0 18 0z"/>
      <circle cx="18" cy="18" r="6.5" fill="#ffffff"/>
    </svg>`
  );

/** Driver — truck in black circle. */
const TRUCK_MARKER_SVG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#1a1a1a" stroke="#fff" stroke-width="3"/>
      <g fill="#fff" transform="translate(8 12)">
        <path d="M1 6h12v8H1z"/><path d="M13 9h6l3 4v3h-9z"/>
        <circle cx="6" cy="15" r="2.2"/><circle cx="17" cy="15" r="2.2"/>
      </g>
    </svg>`
  );

const destIcon = L.icon({
  iconUrl: CUSTOMER_PIN_SVG,
  iconSize: [36, 48],
  iconAnchor: [18, 46],
  popupAnchor: [0, -40],
});

const driverIcon = L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;border-radius:999px;background:#1a1a1a;color:#fff;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.32)"><i class="fa-solid fa-truck" style="font-size:15px"></i></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function googleCustomerIcon(maps) {
  return {
    url: CUSTOMER_PIN_SVG,
    scaledSize: new maps.Size(36, 48),
    anchor: new maps.Point(18, 46),
  };
}

function googleDriverIcon(maps) {
  return {
    url: TRUCK_MARKER_SVG,
    scaledSize: new maps.Size(40, 40),
    anchor: new maps.Point(20, 20),
  };
}

async function fetchOsrmRoute(from, to) {
  if (!from || !to) return null;
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('route failed');
  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route?.geometry?.coordinates?.length) return null;
  return {
    latlngs: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    durationMin: Math.max(1, Math.round(route.duration / 60)),
  };
}

/**
 * Prefer Google Maps (VITE_GOOGLE_MAPS_API_KEY) — clear buildings + Directions route.
 * Fallback: CARTO Voyager + OSRM (free, no key).
 */
export default function DriverMap({
  customer,
  driver,
  className = '',
  followDriver = false,
  recenterTick = 0,
  onRouteInfo,
}) {
  const useGoogle = hasGoogleMapsKey();
  if (useGoogle) {
    return (
      <GoogleDriverMap
        customer={customer}
        driver={driver}
        className={className}
        followDriver={followDriver}
        recenterTick={recenterTick}
        onRouteInfo={onRouteInfo}
      />
    );
  }
  return (
    <LeafletDriverMap
      customer={customer}
      driver={driver}
      className={className}
      followDriver={followDriver}
      recenterTick={recenterTick}
      onRouteInfo={onRouteInfo}
    />
  );
}

function GoogleDriverMap({
  customer,
  driver,
  className = '',
  followDriver = false,
  recenterTick = 0,
  onRouteInfo,
}) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const directionsSvc = useRef(null);
  const directionsRend = useRef(null);
  const driverMarker = useRef(null);
  const customerMarker = useRef(null);
  const routeKey = useRef('');
  const onRouteInfoRef = useRef(onRouteInfo);
  onRouteInfoRef.current = onRouteInfo;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current || mapInst.current) return;
        const center = customer || driver || { lat: 2.0469, lng: 45.3182 };
        const map = new maps.Map(mapRef.current, {
          center,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
          ],
        });
        mapInst.current = map;
        directionsSvc.current = new maps.DirectionsService();
        directionsRend.current = new maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#2f6b45',
            strokeOpacity: 1,
            strokeWeight: 6,
          },
        });
        setReady(true);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Google Maps failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapInst.current || !window.google?.maps) return;
    const maps = window.google.maps;
    const map = mapInst.current;

    if (customer?.lat != null) {
      const icon = googleCustomerIcon(maps);
      if (!customerMarker.current) {
        customerMarker.current = new maps.Marker({
          map,
          position: customer,
          icon,
          zIndex: 2,
        });
      } else {
        customerMarker.current.setPosition(customer);
        customerMarker.current.setIcon(icon);
      }
    }

    if (driver?.lat != null) {
      const icon = googleDriverIcon(maps);
      if (!driverMarker.current) {
        driverMarker.current = new maps.Marker({
          map,
          position: driver,
          icon,
          zIndex: 3,
        });
      } else {
        driverMarker.current.setPosition(driver);
        driverMarker.current.setIcon(icon);
      }
      if (followDriver) map.panTo(driver);
    }
  }, [ready, customer, driver, followDriver]);

  useEffect(() => {
    if (!ready || !mapInst.current || !recenterTick) return;
    const map = mapInst.current;
    if (driver?.lat != null) map.panTo(driver);
    else if (customer?.lat != null) map.panTo(customer);
  }, [recenterTick, ready, customer, driver]);

  useEffect(() => {
    if (!ready || !directionsSvc.current || !directionsRend.current) return;
    if (!customer?.lat || !driver?.lat) return;

    const key = `${driver.lat.toFixed(4)},${driver.lng.toFixed(4)}-${customer.lat.toFixed(4)},${customer.lng.toFixed(4)}`;
    if (routeKey.current === key) return;
    routeKey.current = key;

    const maps = window.google.maps;
    directionsSvc.current.route(
      {
        origin: driver,
        destination: customer,
        travelMode: maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status !== 'OK' || !result) {
          onRouteInfoRef.current?.({ distanceKm: null, durationMin: null, road: false });
          return;
        }
        directionsRend.current.setDirections(result);
        const leg = result.routes?.[0]?.legs?.[0];
        if (leg) {
          onRouteInfoRef.current?.({
            distanceKm: Math.round((leg.distance.value / 1000) * 10) / 10,
            durationMin: Math.max(1, Math.round(leg.duration.value / 60)),
            road: true,
            provider: 'google',
          });
        }
      }
    );
  }, [ready, customer, driver]);

  return (
    <div className={`relative z-0 overflow-hidden ${className}`}>
      <div ref={mapRef} className="h-full min-h-[180px] w-full" />
      {error ? (
        <div className="absolute inset-x-3 bottom-3 z-10 rounded-xl bg-white/95 px-3 py-2 text-[0.72rem] font-semibold text-[#9b3b2e] shadow">
          {error}
          <span className="mt-1 block font-medium text-[#6b6b6b]">
            Add VITE_GOOGLE_MAPS_API_KEY to .env and enable Maps JavaScript API + Directions API.
          </span>
        </div>
      ) : null}
      {!ready && !error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f3f3f3]/70 text-[0.8rem] font-semibold text-[#5a5a5a]">
          Loading Google Maps…
        </div>
      ) : null}
    </div>
  );
}

function LeafletDriverMap({
  customer,
  driver,
  className = '',
  followDriver = false,
  recenterTick = 0,
  onRouteInfo,
}) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const customerMarker = useRef(null);
  const driverMarker = useRef(null);
  const lineRef = useRef(null);
  const outlineRef = useRef(null);
  const routeKey = useRef('');
  const onRouteInfoRef = useRef(onRouteInfo);
  onRouteInfoRef.current = onRouteInfo;

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return undefined;

    const start = customer || driver || { lat: 2.0469, lng: 45.3182 };
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([start.lat, start.lng], 14);

    const retina = typeof window !== 'undefined' && window.devicePixelRatio > 1 ? '@2x' : '';
    L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}${retina}.png`,
      {
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      }
    ).addTo(map);

    mapInst.current = map;
    requestAnimationFrame(() => map.invalidateSize());
    const t = setTimeout(() => map.invalidateSize(), 220);

    return () => {
      clearTimeout(t);
      map.remove();
      mapInst.current = null;
      customerMarker.current = null;
      driverMarker.current = null;
      lineRef.current = null;
      outlineRef.current = null;
      routeKey.current = '';
    };
  }, []);

  useEffect(() => {
    const map = mapInst.current;
    if (!map || !recenterTick) return;
    map.invalidateSize();
    if (lineRef.current) {
      map.fitBounds(lineRef.current.getBounds(), { padding: [44, 44], maxZoom: 16 });
    } else if (driver?.lat != null) {
      map.setView([driver.lat, driver.lng], 15, { animate: true });
    } else if (customer?.lat != null) {
      map.setView([customer.lat, customer.lng], 15, { animate: true });
    }
  }, [recenterTick, customer, driver]);

  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    map.invalidateSize();

    if (customer?.lat != null && customer?.lng != null) {
      if (!customerMarker.current) {
        customerMarker.current = L.marker([customer.lat, customer.lng], { icon: destIcon }).addTo(map);
      } else {
        customerMarker.current.setLatLng([customer.lat, customer.lng]);
      }
    }

    if (driver?.lat != null && driver?.lng != null) {
      if (!driverMarker.current) {
        driverMarker.current = L.marker([driver.lat, driver.lng], { icon: driverIcon }).addTo(map);
      } else {
        driverMarker.current.setLatLng([driver.lat, driver.lng]);
      }
      if (followDriver) map.panTo([driver.lat, driver.lng], { animate: true });
    }
  }, [customer, driver, followDriver]);

  useEffect(() => {
    const map = mapInst.current;
    if (!map || !customer?.lat || !driver?.lat) return undefined;

    const key = `${driver.lat.toFixed(4)},${driver.lng.toFixed(4)}-${customer.lat.toFixed(4)},${customer.lng.toFixed(4)}`;
    if (routeKey.current === key && lineRef.current) return undefined;
    routeKey.current = key;

    let cancelled = false;

    (async () => {
      let latlngs = [
        [driver.lat, driver.lng],
        [customer.lat, customer.lng],
      ];
      let info = null;
      try {
        const road = await fetchOsrmRoute(driver, customer);
        if (road?.latlngs?.length) {
          latlngs = road.latlngs;
          info = { distanceKm: road.distanceKm, durationMin: road.durationMin, road: true };
        }
      } catch {
        info = { distanceKm: null, durationMin: null, road: false };
      }
      if (cancelled || !mapInst.current) return;

      if (outlineRef.current) {
        map.removeLayer(outlineRef.current);
        outlineRef.current = null;
      }
      if (lineRef.current) {
        map.removeLayer(lineRef.current);
        lineRef.current = null;
      }

      outlineRef.current = L.polyline(latlngs, {
        color: '#ffffff',
        weight: 10,
        opacity: 1,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      lineRef.current = L.polyline(latlngs, {
        color: '#2f6b45',
        weight: 6,
        opacity: 1,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      if (!followDriver) {
        map.fitBounds(lineRef.current.getBounds(), { padding: [52, 52], maxZoom: 16 });
      }
      onRouteInfoRef.current?.(info);
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, driver, followDriver]);

  return (
    <div className={`relative z-0 overflow-hidden ${className}`}>
      <div ref={mapRef} className="h-full min-h-[180px] w-full [&_.leaflet-container]:z-0" />
    </div>
  );
}
