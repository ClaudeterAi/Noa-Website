import localFont from "next/font/local";

/**
 * Self-hosted typefaces (all SIL Open Font License). Files live in this folder, so builds never
 * depend on fonts.googleapis.com — a Vercel build on 16 Oct failed on that fetch — and visitors in
 * the UAE load fonts from Vercel's edge, not Google. Subsets: Latin (+ext) for the EN faces, Arabic
 * for the AR faces; the EN faces fall back for any Latin inside Arabic text.
 */

export const josefin = localFont({
  variable: "--font-josefin", display: "swap",
  src: [
    { path: "./josefin-sans-latin-200.woff2", weight: "200", style: "normal" },
    { path: "./josefin-sans-latin-300.woff2", weight: "300", style: "normal" },
    { path: "./josefin-sans-latin-400.woff2", weight: "400", style: "normal" },
  ],
});

export const cormorant = localFont({
  variable: "--font-cormorant", display: "swap",
  src: [
    { path: "./cormorant-latin-300.woff2", weight: "300", style: "normal" },
    { path: "./cormorant-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./cormorant-latin-300-italic.woff2", weight: "300", style: "italic" },
    { path: "./cormorant-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
});

export const plexArabic = localFont({
  variable: "--font-plex-arabic", display: "swap",
  src: [
    { path: "./ibm-plex-sans-arabic-arabic-200.woff2", weight: "200", style: "normal" },
    { path: "./ibm-plex-sans-arabic-arabic-300.woff2", weight: "300", style: "normal" },
    { path: "./ibm-plex-sans-arabic-arabic-400.woff2", weight: "400", style: "normal" },
  ],
});

export const naskh = localFont({
  variable: "--font-naskh", display: "swap",
  src: [
    { path: "./noto-naskh-arabic-arabic-400.woff2", weight: "400", style: "normal" },
    { path: "./noto-naskh-arabic-arabic-500.woff2", weight: "500", style: "normal" },
  ],
});
