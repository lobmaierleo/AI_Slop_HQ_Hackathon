"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LINZ_CENTER, MAP_STYLE, POINT_TONE, type FestivalLocation, type LinzPoint } from "./lib";

export default function Map({
  locations,
  points,
}: {
  locations: FestivalLocation[];
  points: LinzPoint[];
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!container.current || map.current) return;
    // MapLibre wirft ohne WebGL2 eine Exception. Unbehandelt reisst die den
    // gesamten React-Baum ab und der Rest der Seite verschwindet mit — auf
    // aelteren Geraeten also alles statt nur die Karte.
    try {
      map.current = new MapLibreMap({
        container: container.current,
        style: MAP_STYLE,
        center: LINZ_CENTER,
        zoom: 12.4,
        attributionControl: { compact: true },
      });
      map.current.addControl(new NavigationControl({ showCompass: false }), "top-right");
    } catch {
      setFailed(true);
      return;
    }
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || failed) return;
    const markers: Marker[] = [];

    const add = (lat: number, lon: number, color: string, size: number, label: string) => {
      const el = document.createElement("div");
      el.style.cssText =
        `width:${size}px;height:${size}px;border-radius:9999px;background:${color};` +
        `border:1.5px solid #ffffff`;
      el.title = label;
      markers.push(new Marker({ element: el }).setLngLat([lon, lat]).addTo(m));
    };

    // Linzer Punkte zuerst, damit die Festivalorte darüber liegen.
    points.forEach((p) => add(p.lat, p.lon, POINT_TONE[p.kind], 7, `${p.kind}: ${p.name ?? ""}`));
    locations.forEach((l) => add(l.lat, l.lon, POINT_TONE.festival, 12, l.name));

    return () => markers.forEach((mk) => mk.remove());
  }, [locations, points, failed]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 text-center">
        <p className="max-w-[42ch] text-body text-ink-muted-80">
          Die Karte braucht WebGL2, das dieser Browser nicht bereitstellt.
          Alle Zahlen oben stammen aus denselben Daten und stimmen weiterhin.
        </p>
      </div>
    );
  }

  return <div ref={container} className="h-full w-full" />;
}
