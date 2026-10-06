// Google Fonts — Quicksand (wght 300..700) Configuration
// @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap');

export const QUICKSAND_GOOGLE_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap";

export const QUICKSAND_TTF_URLS = {
  LIGHT_300:
    "https://fonts.gstatic.com/s/quicksand/v37/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkKEo18E.ttf",
  REGULAR_400:
    "https://fonts.gstatic.com/s/quicksand/v37/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkP8o18E.ttf",
  MEDIUM_500:
    "https://fonts.gstatic.com/s/quicksand/v37/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkM0o18E.ttf",
  SEMIBOLD_600:
    "https://fonts.gstatic.com/s/quicksand/v37/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkCEv18E.ttf",
  BOLD_700:
    "https://fonts.gstatic.com/s/quicksand/v37/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkBgv18E.ttf",
};

export const QUICKSAND_FONT_MAP = {
  // Primary app font aliases (maps existing 'outfit*' styles across all screens to Quicksand)
  outfit: QUICKSAND_TTF_URLS.MEDIUM_500,
  "outfit-light": QUICKSAND_TTF_URLS.LIGHT_300,
  "outfit-regular": QUICKSAND_TTF_URLS.REGULAR_400,
  "outfit-medium": QUICKSAND_TTF_URLS.SEMIBOLD_600,
  "outfit-semibold": QUICKSAND_TTF_URLS.SEMIBOLD_600,
  "outfit-bold": QUICKSAND_TTF_URLS.BOLD_700,

  // Explicit Quicksand family names (300..700)
  Quicksand: QUICKSAND_TTF_URLS.MEDIUM_500,
  "Quicksand-Light": QUICKSAND_TTF_URLS.LIGHT_300,
  "Quicksand-Regular": QUICKSAND_TTF_URLS.REGULAR_400,
  "Quicksand-Medium": QUICKSAND_TTF_URLS.MEDIUM_500,
  "Quicksand-SemiBold": QUICKSAND_TTF_URLS.SEMIBOLD_600,
  "Quicksand-Bold": QUICKSAND_TTF_URLS.BOLD_700,

  quicksand: QUICKSAND_TTF_URLS.MEDIUM_500,
  "quicksand-light": QUICKSAND_TTF_URLS.LIGHT_300,
  "quicksand-regular": QUICKSAND_TTF_URLS.REGULAR_400,
  "quicksand-medium": QUICKSAND_TTF_URLS.SEMIBOLD_600,
  "quicksand-semibold": QUICKSAND_TTF_URLS.SEMIBOLD_600,
  "quicksand-bold": QUICKSAND_TTF_URLS.BOLD_700,
};

const Fonts = {
  LIGHT: "Quicksand-Light",
  REGULAR: "outfit",
  MEDIUM: "outfit-medium",
  SEMIBOLD: "Quicksand-SemiBold",
  BOLD: "outfit-bold",
};

export default Fonts;
