import React from "react";
import { AbsoluteFill, Audio, Composition, staticFile } from "remotion";

import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH, WaitlyzeLaunch } from "./WaitlyzeLaunch";

const fontFaceCss = `
@font-face {
  font-family: 'Paper Mono';
  src: url('${staticFile("fonts/PaperMono-Variable.woff2")}') format('woff2');
  font-weight: 100 800;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'Manrope Local';
  src: url('${staticFile("fonts/Manrope-700.woff2")}') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'Manrope Local';
  src: url('${staticFile("fonts/Manrope-700.woff2")}') format('woff2');
  font-weight: 800;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'Hanken Local';
  src: url('${staticFile("fonts/Hanken-500.woff2")}') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'Hanken Local';
  src: url('${staticFile("fonts/Hanken-500.woff2")}') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'Hanken Local';
  src: url('${staticFile("fonts/Hanken-500.woff2")}') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'Hanken Local';
  src: url('${staticFile("fonts/Hanken-500.woff2")}') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: block;
}
:root {
  --wl-font-display: 'Manrope Local', system-ui, sans-serif;
  --wl-font-sans: 'Hanken Local', system-ui, sans-serif;
}
* {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
}
`;

export const LaunchFilm: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: fontFaceCss }} />
      <Audio src={staticFile("soundtrack.mp3")} volume={1} />
      <WaitlyzeLaunch />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LaunchFilm"
      component={LaunchFilm}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
