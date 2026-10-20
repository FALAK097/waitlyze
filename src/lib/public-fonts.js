import { Archivo, Bricolage_Grotesque, Figtree, Hanken_Grotesk, Manrope } from "next/font/google";

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
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--wl-bricolage",
});
const figtree = Figtree({ subsets: ["latin"], display: "swap", variable: "--wl-figtree" });
const archivo = Archivo({ subsets: ["latin"], display: "swap", variable: "--wl-archivo" });
export const publicFontClasses = `${body.variable} ${display.variable} ${bricolage.variable} ${figtree.variable} ${archivo.variable}`;
