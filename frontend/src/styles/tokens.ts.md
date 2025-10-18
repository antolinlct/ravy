//inutile pour le moment

export const colors = {
  primary: "#108FFF",
  primaryLight: "rgba(16, 143, 255, 0.15)",
  secondary: "#ACD3FD",

  background: "#FFFFFF",
  surface: "#FAFAFA",
  surfaceBlue: "#F6F8FF",

  border: "#EAEAEA",

  warning: "#FF0000",
  warningLight: "rgba(255, 0, 0, 0.10)",

  success: "#46C954",
  successLight: "rgba(70, 201, 84, 0.15)",

  dark: "#202633",
  gray: "#8492A5",

  gradient: {
    start: "#233DFF",
    middle: "#108FFF",
    end: "#00D1FF",
  },
} as const;

export const fontFamily = {
  poppins: "Poppins",
  funnel: "Funnel Display",
} as const;

export const fontSize = {
  header1: {
    size: "1.625rem",
    lineHeight: "2rem",
    fontFamily: '"Funnel Display"',
    fontWeight: 500,
  },
  header2: {
    size: "1.125rem",
    lineHeight: "1.5rem",
    fontFamily: '"Funnel Display"',
    fontWeight: 500,
  },
  header3: {
    size: "1rem",
    lineHeight: "1.5rem",
    fontFamily: "Poppins",
    fontWeight: 500,
  },
  header4: {
    size: "1rem",
    lineHeight: "1.5rem",
    fontFamily: "Poppins",
    fontWeight: 500,
  },
  textXs: {
    size: "0.6875rem",
    lineHeight: "0.875rem",
    fontFamily: "Poppins",
    fontWeight: 400,
  },
  textS: {
    size: "0.75rem",
    lineHeight: "1rem",
    fontFamily: "Poppins",
    fontWeight: 400,
  },
  textM: {
    size: "0.875rem",
    lineHeight: "1.25rem",
    fontFamily: "Poppins",
    fontWeight: 400,
  },
} as const;

export const borderRadius = {
  sm: "5px",
  md: "10px",
  lg: "15px",
} as const;

export const spacing = {
  xs: "4px",
  xsm: "5px",
  sm: "10px",
  md: "15px",
  lg: "20px",
} as const;

export const animation = {
  fadeInRight: {
    keyframes: {
      "0%": { opacity: "0", transform: "translateX(40px)" },
      "100%": { opacity: "1", transform: "translateX(0)" },
    },
    timing: "0.4s ease-out forwards",
  },
  fadeOutLeft: {
    keyframes: {
      "0%": { opacity: "1", transform: "translateX(0)" },
      "100%": { opacity: "0", transform: "translateX(-40px)" },
    },
    timing: "0.4s ease-in forwards",
  },
} as const;