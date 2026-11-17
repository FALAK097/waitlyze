export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_FRAMES = 4254; // 70.89s @ 60fps

export interface CameraKeyframe {
  frame: number;
  /** Target center in window coordinates (window is 1480x860 centered on stage) */
  focusX: number;
  focusY: number;
  /** Camera zoom multiplier (1 = full window view) */
  zoom: number;
  /** 3D tilt angles in degrees */
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  /** Focus rectangle in window coordinates (x, y, w, h) for Depth-of-Field sharpness */
  dofRect: [number, number, number, number];
  /** Blur radius (px) outside dofRect (0 = everything sharp) */
  dofBlur: number;
}

export interface ChapterSpec {
  id: string;
  label: string | null;
  startFrame: number;
  endFrame: number;
  activeTab: "builder" | "signups" | "emails" | "analytics" | "settings";
  /** 0..1 lime intensity in the halftone field */
  limeProgress: number;
  /** 0..1 world-map formation in the halftone field */
  mapMorph: number;
}

export const WINDOW_W = 1480;
export const WINDOW_H = 860;

export const CHAPTERS: ChapterSpec[] = [
  {
    id: "intro",
    label: null,
    startFrame: 0,
    endFrame: 251, // 0.00 - 4.18s
    activeTab: "builder",
    limeProgress: 0.08,
    mapMorph: 0,
  },
  {
    id: "waitlist",
    label: "WAITLIST",
    startFrame: 251,
    endFrame: 520, // 4.18 - 8.66s
    activeTab: "builder",
    limeProgress: 0.15,
    mapMorph: 0,
  },
  {
    id: "builder",
    label: "BUILDER",
    startFrame: 520,
    endFrame: 979, // 8.66 - 16.32s
    activeTab: "builder",
    limeProgress: 0.25,
    mapMorph: 0,
  },
  {
    id: "brand",
    label: "BRAND KIT",
    startFrame: 979,
    endFrame: 1282, // 16.32 - 21.36s
    activeTab: "builder",
    limeProgress: 0.42,
    mapMorph: 0,
  },
  {
    id: "publish",
    label: "PUBLISH",
    startFrame: 1282,
    endFrame: 1569, // 21.36 - 26.15s
    activeTab: "builder",
    limeProgress: 0.62,
    mapMorph: 0,
  },
  {
    id: "signups",
    label: "SIGNUPS",
    startFrame: 1569,
    endFrame: 1934, // 26.15 - 32.23s
    activeTab: "signups",
    limeProgress: 0.74,
    mapMorph: 0.1,
  },
  {
    id: "referrals",
    label: "REFERRALS",
    startFrame: 1934,
    endFrame: 2430, // 32.23 - 40.50s
    activeTab: "signups",
    limeProgress: 0.85,
    mapMorph: 0.2,
  },
  {
    id: "emails",
    label: "EMAILS",
    startFrame: 2430,
    endFrame: 2834, // 40.50 - 47.23s
    activeTab: "emails",
    limeProgress: 0.9,
    mapMorph: 0.3,
  },
  {
    id: "analytics",
    label: "ANALYTICS",
    startFrame: 2834,
    endFrame: 3314, // 47.23 - 55.24s
    activeTab: "analytics",
    limeProgress: 0.96,
    mapMorph: 0.55,
  },
  {
    id: "momentum",
    label: "MOMENTUM",
    startFrame: 3314,
    endFrame: 3810, // 55.24 - 63.50s (breakdown + 59.61s frame 3577 drop)
    activeTab: "analytics",
    limeProgress: 1.0,
    mapMorph: 1.0,
  },
  {
    id: "endcard",
    label: null,
    startFrame: 3810,
    endFrame: 4254, // 63.50 - 70.89s
    activeTab: "analytics",
    limeProgress: 1.0,
    mapMorph: 0.85,
  },
];

export const DROP_FRAME = 3577; // 59.61s bass drop
export const BREAKDOWN_START = 3314; // 55.24s hush

export const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  // 00: Cold open — tilted full window emerging from darkness
  {
    frame: 0,
    focusX: 740,
    focusY: 430,
    zoom: 0.88,
    rotateX: 11,
    rotateY: -14,
    rotateZ: 2.2,
    dofRect: [0, 0, 1480, 860],
    dofBlur: 0,
  },
  {
    frame: 220,
    focusX: 740,
    focusY: 430,
    zoom: 0.95,
    rotateX: 7.5,
    rotateY: -9.5,
    rotateZ: 1.4,
    dofRect: [0, 0, 1480, 860],
    dofBlur: 0,
  },
  // 01: WAITLIST — push tight into top-left header & title
  {
    frame: 285,
    focusX: 295,
    focusY: 125,
    zoom: 2.08,
    rotateX: 2.0,
    rotateY: -2.5,
    rotateZ: 0.2,
    dofRect: [16, 20, 720, 215],
    dofBlur: 5,
  },
  {
    frame: 495,
    focusX: 310,
    focusY: 125,
    zoom: 2.04,
    rotateX: 1.8,
    rotateY: -2.0,
    rotateZ: 0.1,
    dofRect: [16, 20, 740, 215],
    dofBlur: 5,
  },
  // 02: BUILDER — pan to left editor + right live preview
  {
    frame: 565,
    focusX: 620,
    focusY: 455,
    zoom: 1.38,
    rotateX: 2.5,
    rotateY: -3.0,
    rotateZ: 0.3,
    dofRect: [20, 150, 1420, 680],
    dofBlur: 3.5,
  },
  {
    frame: 760,
    focusX: 910,
    focusY: 465,
    zoom: 1.5,
    rotateX: 2.0,
    rotateY: 2.5,
    rotateZ: -0.2,
    dofRect: [460, 160, 990, 660],
    dofBlur: 4.5,
  },
  {
    frame: 950,
    focusX: 920,
    focusY: 465,
    zoom: 1.48,
    rotateX: 2.0,
    rotateY: 2.0,
    rotateZ: -0.2,
    dofRect: [460, 160, 990, 660],
    dofBlur: 4.5,
  },
  // 03: BRAND KIT — focus on brand swatches & live preview card
  {
    frame: 1020,
    focusX: 610,
    focusY: 525,
    zoom: 1.58,
    rotateX: 1.5,
    rotateY: -2.0,
    rotateZ: 0,
    dofRect: [24, 260, 1420, 580],
    dofBlur: 4,
  },
  {
    frame: 1255,
    focusX: 760,
    focusY: 495,
    zoom: 1.44,
    rotateX: 2.0,
    rotateY: -1.5,
    rotateZ: 0,
    dofRect: [24, 200, 1420, 630],
    dofBlur: 3.5,
  },
  // 04: PUBLISH — push into top-right publish button + share popover
  {
    frame: 1320,
    focusX: 1120,
    focusY: 245,
    zoom: 1.84,
    rotateX: 1.8,
    rotateY: 3.0,
    rotateZ: -0.3,
    dofRect: [660, 28, 810, 480],
    dofBlur: 5,
  },
  {
    frame: 1545,
    focusX: 1105,
    focusY: 260,
    zoom: 1.8,
    rotateX: 1.8,
    rotateY: 2.4,
    rotateZ: -0.2,
    dofRect: [650, 28, 820, 490],
    dofBlur: 5,
  },
  // 05: SIGNUPS — pan to Signups tab & verified subscriber table
  {
    frame: 1615,
    focusX: 710,
    focusY: 445,
    zoom: 1.38,
    rotateX: 2.6,
    rotateY: -2.2,
    rotateZ: 0.2,
    dofRect: [24, 95, 1430, 740],
    dofBlur: 3,
  },
  {
    frame: 1905,
    focusX: 730,
    focusY: 465,
    zoom: 1.42,
    rotateX: 2.0,
    rotateY: -1.6,
    rotateZ: 0.1,
    dofRect: [24, 130, 1430, 710],
    dofBlur: 3.5,
  },
  // 06: REFERRALS — zoom into Referral Cockpit & Leaderboard FLIP
  {
    frame: 1980,
    focusX: 830,
    focusY: 475,
    zoom: 1.5,
    rotateX: 1.6,
    rotateY: 2.2,
    rotateZ: -0.2,
    dofRect: [180, 150, 1280, 680],
    dofBlur: 4,
  },
  {
    frame: 2400,
    focusX: 810,
    focusY: 465,
    zoom: 1.46,
    rotateX: 2.0,
    rotateY: 1.6,
    rotateZ: -0.1,
    dofRect: [140, 150, 1320, 680],
    dofBlur: 3.5,
  },
  // 07: EMAILS — pan to Cohort Broadcast composer & delivery meter
  {
    frame: 2475,
    focusX: 830,
    focusY: 465,
    zoom: 1.46,
    rotateX: 2.0,
    rotateY: -1.8,
    rotateZ: 0.2,
    dofRect: [240, 150, 1220, 690],
    dofBlur: 4,
  },
  {
    frame: 2805,
    focusX: 910,
    focusY: 485,
    zoom: 1.5,
    rotateX: 1.8,
    rotateY: 1.4,
    rotateZ: 0,
    dofRect: [340, 165, 1130, 680],
    dofBlur: 4,
  },
  // 08: ANALYTICS — KPI strip + EvilCharts area curve
  {
    frame: 2880,
    focusX: 740,
    focusY: 440,
    zoom: 1.32,
    rotateX: 2.5,
    rotateY: -2.0,
    rotateZ: 0.2,
    dofRect: [20, 110, 1440, 730],
    dofBlur: 2.5,
  },
  {
    frame: 3290,
    focusX: 740,
    focusY: 460,
    zoom: 1.36,
    rotateX: 2.0,
    rotateY: 1.5,
    rotateZ: -0.1,
    dofRect: [20, 120, 1440, 720],
    dofBlur: 2.5,
  },
  // 09a: BREAKDOWN (55.24s - 59.61s) — weightless pull-back in the hush
  {
    frame: 3380,
    focusX: 740,
    focusY: 430,
    zoom: 0.9,
    rotateX: 9.5,
    rotateY: -11.5,
    rotateZ: 1.6,
    dofRect: [0, 0, 1480, 860],
    dofBlur: 0,
  },
  {
    frame: 3570,
    focusX: 740,
    focusY: 430,
    zoom: 0.86,
    rotateX: 10.5,
    rotateY: -12.5,
    rotateZ: 1.8,
    dofRect: [0, 0, 1480, 860],
    dofBlur: 0,
  },
  // 09b: BASS DROP (59.61s = frame 3577) — punchy hero lock as world map ignites
  {
    frame: 3592,
    focusX: 740,
    focusY: 430,
    zoom: 0.98,
    rotateX: 5.0,
    rotateY: 6.5,
    rotateZ: -0.8,
    dofRect: [0, 0, 1480, 860],
    dofBlur: 0,
  },
  {
    frame: 3790,
    focusX: 740,
    focusY: 430,
    zoom: 0.93,
    rotateX: 6.5,
    rotateY: 8.5,
    rotateZ: -1.1,
    dofRect: [0, 0, 1480, 860],
    dofBlur: 0,
  },
  // 10: END CARD — window tilts back and recedes into the field
  {
    frame: 3865,
    focusX: 740,
    focusY: 430,
    zoom: 0.72,
    rotateX: 18,
    rotateY: 14,
    rotateZ: -2.0,
    dofRect: [0, 0, 1480, 860],
    dofBlur: 8,
  },
];
