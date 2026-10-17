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
  const wrapRef = useRef(null);
  const [active, setActive] = useState(null);
  const byCode = useMemo(() => new Map(countries.map((row) => [String(row.label || "").toUpperCase(), row])), [countries]);
  const max = useMemo(() => countries.reduce((current, row) => Math.max(current, metric === "signups" ? row.signups : row.visitors), 0), [countries, metric]);
  const valueOf = (row) => (metric === "signups" ? row?.signups : row?.visitors) || 0;

  const hide = () => setActive(null);

  const show = (event) => {
    const target = event.target.closest?.("[data-map-code]");
    if (!target) { hide(); return; }
    const code = target.getAttribute("data-map-code") || "";
    const name = target.getAttribute("data-map-name") || "Unknown";
    const row = byCode.get(code);
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const pointerX = "clientX" in event ? event.clientX - rect.left : rect.width / 2;
    const pointerY = "clientY" in event ? event.clientY - rect.top : rect.height / 2;
    const tooltipX = Math.min(Math.max(pointerX + 16, 90), Math.max(rect.width - 90, 90));
    const tooltipY = Math.min(Math.max(pointerY + 20, 8), Math.max(rect.height - 90, 8));
    setActive({
      code,
      name: code ? regionNames.of(code) || name : name,
      value: valueOf(row),
      x: tooltipX,
      y: tooltipY,
    });
  };

  return <div
    className="evil-world-map"
    ref={wrapRef}
    onPointerMove={show}
    onPointerLeave={hide}
    onPointerCancel={hide}
  >
    <ComposableMap role="group" aria-label="World map of visitor activity" projection="geoEqualEarth" projectionConfig={{ center: [4, 2], scale: 148 }} width={800} height={390}>
      <Geographies geography={world}>
        {({ geographies }) => geographies.map((geography) => {
          const name = geography.properties?.name || "Unknown";
          const code = COUNTRY_CODE_BY_NAME.get(normalized(name));
          const row = byCode.get(code);
          const label = code ? regionNames.of(code) || name : name;
          const visitors = row?.visitors || 0;
          const signups = row?.signups || 0;
          return <Geography
            key={geography.rsmKey}
            geography={geography}
            fill={fillFor(valueOf(row), max)}
            stroke="#cbd5dc"
            strokeWidth={0.55}
            data-map-code={code || ""}
            data-map-name={label}
            aria-label={`${label}: ${number.format(visitors)} visitors, ${number.format(signups)} signups`}
          />;
        })}
      </Geographies>
    </ComposableMap>
    {active ? <div className="evil-world-map-tooltip" style={{ "--map-tooltip-x": `${active.x}px`, "--map-tooltip-y": `${active.y}px` }}>
      <p><span aria-hidden="true">{flag(active.code)} </span>{active.name}</p>
      <div>
        <i data-series="visitors" aria-hidden="true" />
        <span>Visitors</span>
        <strong>{number.format(byCode.get(active.code)?.visitors || 0)}</strong>
      </div>
      <div>
        <i data-series="signups" aria-hidden="true" />
        <span>Signups</span>
        <strong>{number.format(byCode.get(active.code)?.signups || 0)}</strong>
      </div>
    </div> : null}
  </div>;
}
