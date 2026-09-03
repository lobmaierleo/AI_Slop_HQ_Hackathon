"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  getCountries, getLinzPoints, getLocations, getProjects, getStreets,
  type Country, type FestivalLocation, type FestivalProject, type LinzPoint, type LinzStreet,
} from "./lib";

const Map = dynamic(() => import("./Map"), { ssr: false });

type State = {
  locations: FestivalLocation[]; projects: FestivalProject[];
  countries: Country[]; points: LinzPoint[]; streets: LinzStreet[];
};

export default function Home() {
  const [d, setD] = useState<State | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getLocations(), getProjects(), getCountries(), getLinzPoints(), getStreets()])
      .then(([locations, projects, countries, points, streets]) =>
        setD({ locations, projects, countries, points, streets }))
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <Shell><p className="text-red-400">Daten fehlen: {err}<br />
    <code className="text-xs">python3 scripts/build_app_data.py</code></p></Shell>;
  if (!d) return <Shell><p className="animate-pulse text-neutral-500">lädt …</p></Shell>;

  const male = d.streets.filter((s) => s.gender === "male").length;
  const female = d.streets.filter((s) => s.gender === "female").length;
  const kinds = d.points.reduce<Record<string, number>>((a, p) => {
    a[p.kind] = (a[p.kind] ?? 0) + 1; return a;
  }, {});

  return (
    <Shell>
      <div className="grid gap-px bg-neutral-800 sm:grid-cols-2 lg:grid-cols-4">
        <Stat n={d.projects.length} label="Festivalprojekte" sub={`${d.projects.filter((p) => p.highlight).length} kuratierte Highlights`} />
        <Stat n={d.countries.length} label="Herkunftsländer" sub={d.countries.slice(0, 3).map((c) => c.name).join(" · ")} />
        <Stat n={d.locations.length} label="Orte mit Koordinaten" sub="von 156 Locations" />
        <Stat n={`${male} : ${female}`} label="Straßen m : w" sub="Linzer Straßennamen nach Geschlecht" accent />
      </div>

      <div className="mt-px h-[62vh] w-full bg-neutral-800">
        <Map locations={d.locations} points={d.points} />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-neutral-800 px-5 py-4 font-mono text-xs text-neutral-400">
        <Legend color="#ff2d55" label={`Festivalorte (${d.locations.length})`} />
        {Object.entries(kinds).map(([k, n]) => (
          <Legend key={k} color={
            { trinkbrunnen: "#00b3ff", wc: "#8b5cf6", defibrillator: "#f59e0b", hecke: "#22c55e", wlan: "#64748b" }[k] ?? "#999"
          } label={`${k} (${n})`} />
        ))}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-5 py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          AI Hackathon · Ars Electronica 2026 · Negotiating Humanity
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Datenlabor</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-400">
          Gerüst und Sichtprüfung. Beide Datenwelten geladen — Festivalprogramm und Open Data Linz.
          Die eigentliche Idee entsteht am Hackathon; siehe <code className="text-neutral-300">docs/ideas.md</code>.
        </p>
      </header>
      <div className="px-0">{children}</div>
    </main>
  );
}

function Stat({ n, label, sub, accent }: { n: number | string; label: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-neutral-950 px-5 py-6">
      <div className={`text-3xl font-semibold tabular-nums ${accent ? "text-[#ff2d55]" : ""}`}>{n}</div>
      <div className="mt-1 text-sm text-neutral-300">{label}</div>
      {sub && <div className="mt-1 truncate font-mono text-[11px] text-neutral-500">{sub}</div>}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
