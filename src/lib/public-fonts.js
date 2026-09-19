import { Hanken_Grotesk, Manrope } from "next/font/google";

const body = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--wl-body",
});
const display = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--wl-display",
});
export const publicFontClasses = `${body.variable} ${display.variable}`;
