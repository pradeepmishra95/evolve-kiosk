
/* ===== COLORS ===== */

export const colors = {

 primary: "#C8A96C",
 primaryLight: "#F3E0B6",
 primaryDark: "#8E6B36",
 secondary: "#6AA69A",
 secondarySoft: "#1F3838",

 background: "#071117",
 backgroundMuted: "#0D1A21",
 card: "rgba(13, 23, 29, 0.82)",
 cardStrong: "#132029",

 border: "rgba(200, 169, 108, 0.16)",
 borderStrong: "rgba(243, 224, 182, 0.26)",

 textPrimary: "#F7F1E6",
 textSecondary: "#C8BA9D",
 textMuted: "#8E816D",
 textOnAccent: "#1A140D"

}


/* ===== SPACING ===== */

export const spacing = {

 xs: "4px",
 sm: "8px",
 md: "16px",
 lg: "24px",
 xl: "40px",
 xxl: "60px"

}


/* ===== BORDER RADIUS ===== */

export const radius = {

 sm: "10px",
 md: "18px",
 lg: "28px",
 xl: "40px"

}


/* ===== FONT SIZE ===== */

export const fontSize = {

 xs: "12px",
 sm: "14px",
 md: "16px",
 lg: "20px",
 xl: "32px",
 xxl: "48px",
 hero: "72px"

}


/* ===== FONT WEIGHT ===== */

export const fontWeight = {

 light: 300,
 normal: 400,
 medium: 500,
 bold: 700

}


/* ===== SHADOW ===== */

export const shadow = {

 card: "0 30px 80px rgba(0, 0, 0, 0.34)",
 modal: "0 32px 120px rgba(0, 0, 0, 0.45)"

}


/* ===== BREAKPOINTS ===== */

export const breakpoints = {

 mobile: 768,
 tablet: 1024,
 desktop: 1280,
 largeDesktop: 1440

}


/* ===== TYPOGRAPHY SYSTEM ===== */

export const typography = {

 title: {
  fontSize: fontSize.xxl,
   fontWeight: fontWeight.bold,
  color: colors.textPrimary,
  fontFamily: "var(--font-cormorant), serif",
  letterSpacing: "0.04em"
 },

 subtitle: {
  fontSize: fontSize.xl,
  fontWeight: fontWeight.medium,
  color: colors.textPrimary,
  fontFamily: "var(--font-cormorant), serif",
  letterSpacing: "0.03em"
 },

 body: {
  fontSize: fontSize.md,
  fontWeight: fontWeight.normal,
  color: colors.textPrimary,
  fontFamily: "var(--font-manrope), sans-serif"
 },

 caption: {
  fontSize: fontSize.sm,
  fontWeight: fontWeight.normal,
  color: colors.textSecondary,
  fontFamily: "var(--font-manrope), sans-serif"
 }

}
