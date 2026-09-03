"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LINZ_CENTER, MAP_STYLE, type FestivalLocation, type LinzPoint } from "./lib";

const COLORS: Record<string, string> = {
  festival: "#ff2d55",
  trinkbrunnen: "#00b3ff",
  wc: "#8b5cf6",
  defibrillator: "#f59e0b",
  hecke: "#22c55e",
  wlan: "#64748b",
};

export default function Map({
  locations,
  points,
}: {
  locations: FestivalLocation[];
  points: LinzPoint[];
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    map.current = new MapLibreMap({
      container: container.current,
      style: MAP_STYLE,
      center: LINZ_CENTER,
      zoom: 12.4,
    });
    map.current.addControl(new NavigationControl(), "top-right");
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const markers: Marker[] = [];

    const add = (lat: number, lon: number, color: string, size: number, label: string) => {
      const el = document.createElement("div");
      el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:0 0 0 1.5px rgba(0,0,0,.35)`;
      el.title = label;
      markers.push(new Marker({ element: el }).setLngLat([lon, lat]).addTo(m));
    };

    points.forEach((p) => add(p.lat, p.lon, COLORS[p.kind] ?? "#999", 6, `${p.kind}: ${p.name ?? ""}`));
    locations.forEach((l) => add(l.lat, l.lon, COLORS.festival, 11, l.name));

    return () => markers.forEach((mk) => mk.remove());
  }, [locations, points]);

  return <div ref={container} className="h-full w-full" />;
}
