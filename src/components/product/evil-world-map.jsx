"use client";

import { useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps/core";
import world from "world-atlas/countries-110m.json";

const number = new Intl.NumberFormat();
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const MAP_FILLS = ["#eff5fa", "#d7e9f7", "#b9d9f2", "#91c2ea", "#62a8e2", "#347fbe"];
const GEO_ALIASES = {
  "bolivia": "BO",
  "brunei": "BN",
  "cote d ivoire": "CI",
  "dem rep congo": "CD",
  "dominican rep": "DO",
  "falkland is": "FK",
  "fr s antarctic lands": "TF",
  "iran": "IR",
  "laos": "LA",
  "moldova": "MD",
  "north korea": "KP",
  "palestine": "PS",
  "russia": "RU",
  "s korea": "KR",
  "solomon is": "SB",
  "somaliland": "SO",
  "south korea": "KR",
  "syria": "SY",
  "taiwan": "TW",
  "tanzania": "TZ",
  "the bahamas": "BS",
  "united states of america": "US",
  "venezuela": "VE",
  "vietnam": "VN",
  "w sahara": "EH",
};

function normalized(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
}

function flag(code) {
  const clean = String(code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return "";
  return String.fromCodePoint(...[...clean].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

const COUNTRY_CODE_BY_NAME = (() => {
  const names = new Map(Object.entries(GEO_ALIASES));
  for (let first = 65; first <= 90; first++) {
    for (let second = 65; second <= 90; second++) {
      const code = String.fromCharCode(first, second);
      try {
        const name = regionNames.of(code);
        if (name && name !== code && name !== "Unknown Region") names.set(normalized(name), code);
      } catch {}
    }
  }
  return names;
})();

function fillFor(value, max) {
  if (!value || !max) return MAP_FILLS[0];
  const level = Math.min(MAP_FILLS.length - 1, Math.max(1, Math.ceil((value / max) * (MAP_FILLS.length - 1))));
  return MAP_FILLS[level];
}

export function EvilWorldMap({ countries = [], metric = "visitors" }) {
  const containerRef = useRef(null);
  const [active, setActive] = useState(null);
  const byCode = useMemo(() => new Map(countries.map((row) => [String(row.label || "").toUpperCase(), row])), [countries]);
  const max = useMemo(() => countries.reduce((current, row) => Math.max(current, metric === "signups" ? row.signups : row.visitors), 0), [countries, metric]);
  const valueOf = (row) => (metric === "signups" ? row?.signups : row?.visitors) || 0;
  const shareOf = (row) => (metric === "signups" ? row?.signupsShare : row?.visitorsShare) || 0;

  const inspect = (event, geography) => {
    const name = geography.properties?.name || "Unknown";
    const code = COUNTRY_CODE_BY_NAME.get(normalized(name));
    const row = byCode.get(code);
    const rect = containerRef.current?.getBoundingClientRect();
    setActive({
      code,
      name: code ? regionNames.of(code) || name : name,
      value: valueOf(row),
      share: shareOf(row),
      x: rect && "clientX" in event ? Math.min(Math.max(event.clientX - rect.left, 120), Math.max(rect.width - 120, 120)) : (rect?.width || 0) / 2,
      y: 12,
    });
  };

  return <div className="evil-world-map" ref={containerRef} onMouseLeave={() => setActive(null)}>
    <ComposableMap role="group" aria-label="World map of visitor activity" projection="geoEqualEarth" projectionConfig={{ center: [4, 2], scale: 148 }} width={800} height={390}>
      <Geographies geography={world}>
        {({ geographies }) => geographies.map((geography) => {
          const name = geography.properties?.name || "Unknown";
          const code = COUNTRY_CODE_BY_NAME.get(normalized(name));
          const row = byCode.get(code);
          const label = `${code ? regionNames.of(code) || name : name}: ${number.format(valueOf(row))} ${metric}`;
          return <Geography
            key={geography.rsmKey}
            geography={geography}
            fill={fillFor(valueOf(row), max)}
            stroke="#cbd5dc"
            strokeWidth={0.55}
            tabIndex={row ? 0 : undefined}
            role={row ? "img" : undefined}
            aria-label={row ? label : undefined}
            onMouseEnter={(event) => inspect(event, geography)}
            onMouseMove={(event) => inspect(event, geography)}
            onFocus={(event) => inspect(event, geography)}
            onBlur={() => setActive(null)}
          />;
        })}
      </Geographies>
    </ComposableMap>
    {active ? <div className="evil-world-map-tooltip" style={{ "--map-tooltip-x": `${active.x}px`, "--map-tooltip-y": `${active.y}px` }}>
      <p><span aria-hidden="true">{flag(active.code)} </span>{active.name}</p>
      <div><i aria-hidden="true" /><span>{metric === "signups" ? "Signups" : "Visitors"}</span><strong>{number.format(active.value)}</strong></div>
      <small>{active.share}% of measured {metric}</small>
    </div> : null}
  </div>;
}
