import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import 'leaflet/dist/leaflet.css';
import {
  VINHOMES_ZONES,
  VINHOMES_MAP_CENTER,
  VINHOMES_MAP_DEFAULT_ZOOM,
  VINHOMES_MAP_OVERVIEW_ZOOM,
  ZONE_TYPES,
} from '../../data/vinhomesEcoPoints';
import './VinhomesEcoMap.css';

const PIN_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Mọi điểm dùng cùng style: nhãn pill + chấm gradient + pulse */
const createZoneMarkerIcon = (zone) => {
  const label = escapeHtml(zone.name);
  const pinSize = 40;
  const totalHeight = 38 + pinSize + 8;
  const width = Math.min(Math.max(zone.name.length * 7.5 + 40, 130), 220);

  return L.divIcon({
    className: 'vinhomes-map-marker-wrap',
    html: `
      <div class="vinhomes-map-pin" role="img" aria-label="${label}">
        <div class="vinhomes-map-pin-label">${label}</div>
        <div class="vinhomes-map-pin-icon">
          ${PIN_SVG}
        </div>
      </div>
    `,
    iconSize: [width, totalHeight],
    iconAnchor: [width / 2, totalHeight - 4],
    popupAnchor: [0, -(totalHeight - 8)],
  });
};

const buildPopupHtml = (zone) => {
  const typeLabel = ZONE_TYPES[zone.type] || 'Khu Vinhomes';
  return `
    <div class="vinhomes-map-popup">
      <span class="vinhomes-map-popup-badge">${escapeHtml(typeLabel)}</span>
      <h4 class="vinhomes-map-popup-title">${escapeHtml(zone.name)}</h4>
      <p class="vinhomes-map-popup-desc">${escapeHtml(zone.description)}</p>
    </div>
  `;
};

const VinhomesEcoMap = ({ className = '' }) => {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const fitAllZones = useCallback(() => {
    const map = mapRef.current;
    if (!map || markersRef.current.length === 0) return;
    const group = L.featureGroup(markersRef.current);
    map.fitBounds(group.getBounds().pad(0.08), {
      animate: true,
      maxZoom: VINHOMES_MAP_OVERVIEW_ZOOM,
    });
  }, []);

  const focusSmartCity = useCallback(() => {
    mapRef.current?.setView(VINHOMES_MAP_CENTER, VINHOMES_MAP_DEFAULT_ZOOM, { animate: true });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: VINHOMES_MAP_CENTER,
      zoom: VINHOMES_MAP_DEFAULT_ZOOM,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    markersRef.current = VINHOMES_ZONES.map((zone) => {
      const marker = L.marker([zone.lat, zone.lng], {
        icon: createZoneMarkerIcon(zone),
        title: zone.name,
        riseOnHover: true,
      });

      marker.bindPopup(buildPopupHtml(zone), {
        className: 'vinhomes-map-popup-shell',
        maxWidth: 260,
        minWidth: 200,
      });

      marker.addTo(map);
      return marker;
    });

    mapRef.current = map;

    window.setTimeout(() => {
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.08), { maxZoom: VINHOMES_MAP_OVERVIEW_ZOOM });
      }
    }, 120);

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  return (
    <div className={`vinhomes-eco-map ${className}`.trim()}>
      <div ref={containerRef} className="vinhomes-eco-map__canvas" aria-label={t('components.map.ariaLabel')} />

      <div className="vinhomes-eco-map__actions">
        <button type="button" className="vinhomes-eco-map__action-btn" onClick={fitAllZones}>
          Xem toàn bộ
        </button>
        <button
          type="button"
          className="vinhomes-eco-map__action-btn vinhomes-eco-map__action-btn--ghost"
          onClick={focusSmartCity}
        >
          Smart City
        </button>
      </div>
    </div>
  );
};

export default VinhomesEcoMap;
