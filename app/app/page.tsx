"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  getCountries, getLinzPoints, getLocations, getProjects, getStreets,
  POINT_LABEL, POINT_TONE,
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

  const male = d ? d.streets.filter((s) => s.gender === "male").length : 0;
  const female = d ? d.streets.filter((s) => s.gender === "female").length : 0;
  const kinds = d
    ? d.points.reduce<Record<string, number>>((a, p) => { a[p.kind] = (a[p.kind] ?? 0) + 1; return a; }, {})
    : {};

  return (
    <>
      <GlobalNav />
      <SubNav />

      {/* Hero — helles Tile */}
      <section className="bg-canvas px-6 py-xxl text-center lg:py-section">
        <h1 className="mx-auto max-w-[15ch] text-display-md text-ink sm:text-display-lg lg:text-hero-display">
          Zwei Datenwelten, eine Karte.
        </h1>
        <p className="mx-auto mt-lg max-w-[46ch] text-lead-airy text-ink-muted-80 sm:text-lead">
          Das Programm des Ars Electronica Festivals 2026 und die offenen Daten der Stadt Linz,
          nebeneinandergelegt.
        </p>
        <div className="mt-xl flex flex-wrap items-center justify-center gap-sm">
          <a
            data-pill
            href="https://ars.electronica.art/negotiatinghumanity/de/"
            className="inline-flex rounded-pill bg-primary px-[22px] py-[11px] text-body text-on-primary"
          >
            Festival ansehen
          </a>
          <a
            data-pill
            href="https://github.com/lobmaierleo/AI_Slop_HQ_Hackathon"
            className="inline-flex rounded-pill border border-primary px-[22px] py-[11px] text-body text-primary"
          >
            Repository
          </a>
        </div>
      </section>

      {/* Kennzahlen — dunkles Tile */}
      <section className="bg-surface-tile-1 px-6 py-xxl lg:py-section">
        {err ? (
          <p className="text-center text-body text-body-muted">
            Daten fehlen: {err} — <code className="text-primary-on-dark">python3 scripts/build_app_data.py</code>
          </p>
        ) : !d ? (
          <p className="text-center text-body text-body-muted">lädt …</p>
        ) : (
          <div className="mx-auto grid max-w-[1440px] gap-xl sm:grid-cols-2 lg:grid-cols-4">
            <Stat n={d.projects.length} label="Festivalprojekte"
              sub={`davon ${d.projects.filter((p) => p.highlight).length} kuratierte Highlights`} />
            <Stat n={d.countries.length} label="Herkunftsländer der Beteiligten"
              sub={d.countries.slice(0, 3).map((c) => c.name).join(" · ")} />
            <Stat n={d.locations.length} label="Orte mit Koordinaten"
              sub="von 156 Locations im Programm" />
            <Stat n={`${male} : ${female}`} label="Linzer Straßen, männlich zu weiblich benannt"
              sub="aus dem Straßennamen-Datensatz" accent />
          </div>
        )}
      </section>

      {/* Karte — randlos, kein Radius */}
      <section className="h-[70vh] w-full bg-canvas-parchment">
        {d && <Map locations={d.locations} points={d.points} />}
      </section>

      {/* Legende — Pergament-Tile */}
      <section className="bg-canvas-parchment px-6 py-xxl">
        <div className="mx-auto max-w-[980px]">
          <h2 className="text-tagline text-ink">Was auf der Karte liegt</h2>
          <ul className="mt-lg flex flex-wrap gap-x-xl gap-y-sm">
            <LegendItem tone={POINT_TONE.festival} label={POINT_LABEL.festival} n={d?.locations.length} />
            {Object.entries(kinds).map(([k, n]) => (
              <LegendItem key={k}
                tone={POINT_TONE[k as keyof typeof POINT_TONE]}
                label={POINT_LABEL[k as keyof typeof POINT_LABEL]} n={n} />
            ))}
          </ul>
        </div>
      </section>

      <Footer />
    </>
  );
}

function GlobalNav() {
  return (
    <nav className="flex h-[44px] items-center justify-between bg-surface-black px-6 text-nav-link text-body-on-dark">
      <span>AI Hackathon · Ars Electronica 2026</span>
      <span className="hidden sm:inline">Negotiating Humanity</span>
    </nav>
  );
}

function SubNav() {
  return (
    <div className="sticky top-0 z-10 flex h-[52px] items-center justify-between border-b border-hairline bg-canvas-parchment/80 px-6 backdrop-blur-[20px] backdrop-saturate-150">
      <span className="text-tagline text-ink">Datenlabor</span>
      <a
        data-pill
        href="https://github.com/lobmaierleo/AI_Slop_HQ_Hackathon/blob/main/docs/ideas.md"
        className="rounded-pill bg-primary px-[22px] py-[8px] text-button-utility text-on-primary"
      >
        Ideen
      </a>
    </div>
  );
}

function Stat({ n, label, sub, accent }: {
  n: number | string; label: string; sub?: string; accent?: boolean;
}) {
  return (
    <div>
      <div className={`font-display text-display-lg tabular-nums ${accent ? "text-primary-on-dark" : "text-body-on-dark"}`}>
        {n}
      </div>
      <div className="mt-xs text-body text-body-on-dark">{label}</div>
      {sub && <div className="mt-xxs text-caption text-body-muted">{sub}</div>}
    </div>
  );
}

function LegendItem({ tone, label, n }: { tone: string; label: string; n?: number }) {
  return (
    <li className="flex items-center gap-xs text-caption text-ink-muted-80">
      <span className="inline-block size-[10px] rounded-pill border border-canvas" style={{ background: tone }} />
      {label}
      {n !== undefined && <span className="text-ink-muted-48 tabular-nums">{n}</span>}
    </li>
  );
}

function Footer() {
  return (
    <footer className="bg-canvas-parchment px-6 pb-xxl pt-xl">
      <div className="mx-auto max-w-[980px]">
        <p className="text-caption text-ink-muted-80">
          Arbeitsgerüst für den AI Hackathon am 11. und 12. September 2026 in der Grand Garage Linz.
          Die Startseite ist eine Sichtprüfung, kein Wettbewerbsbeitrag.
        </p>
        <p className="mt-sm text-fine-print text-ink-muted-48">
          Festivaldaten © Ars Electronica · Stadtdaten © Stadt Linz, data.linz.gv.at ·
          Kartengrundlage © OpenStreetMap, © CARTO
        </p>
      </div>
    </footer>
  );
}
