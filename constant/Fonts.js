import { Platform } from "react-native";

// Local bundled font assets for Android & iOS standalone APKs (100% offline & crash-free)
const LOCAL_REGULAR_FONT = require("../assets/fonts/Outfit-Regular.ttf");
const LOCAL_BOLD_FONT = require("../assets/fonts/Outfit-Bold.ttf");

export const QUICKSAND_GOOGLE_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap";

export const QUICKSAND_TTF_URLS = {
  LIGHT_300:
    Platform.OS === "web"
      ? "https://fonts.gstatic.com/s/quicksand/v37/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkKEo18E.ttf"
      : LOCAL_REGULAR_FONT,
  REGULAR_400:
    Platform.OS === "web"
      ? "https://fonts.gstatic.com/s/quicksand/v37/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkP8o18E.ttf"
      : LOCAL_REGULAR_FONT,
  MEDIUM_500:
    Platform.OS === "web"
      ? "https://fonts.gstatic.com/s/quicksand/v37/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkM0o18E.ttf"
      : LOCAL_REGULAR_FONT,
  SEMIBOLD_600:
    Platform.OS === "web"
      ? "https://fonts.gstatic.com/s/quicksand/v37/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkCEv18E.ttf"
      : LOCAL_BOLD_FONT,
  BOLD_700:
    Platform.OS === "web"
      ? "https://fonts.gstatic.com/s/quicksand/v37/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkBgv18E.ttf"
      : LOCAL_BOLD_FONT,
};

export const QUICKSAND_FONT_MAP = {
  // Primary app font aliases (bundled locally for Android/iOS APKs)
  outfit: LOCAL_REGULAR_FONT,
  "outfit-light": LOCAL_REGULAR_FONT,
  "outfit-regular": LOCAL_REGULAR_FONT,
  "outfit-medium": LOCAL_REGULAR_FONT,
  "outfit-semibold": LOCAL_BOLD_FONT,
  "outfit-bold": LOCAL_BOLD_FONT,

  // Explicit Quicksand family names
  Quicksand: LOCAL_REGULAR_FONT,
  "Quicksand-Light": LOCAL_REGULAR_FONT,
  "Quicksand-Regular": LOCAL_REGULAR_FONT,
  "Quicksand-Medium": LOCAL_REGULAR_FONT,
  "Quicksand-SemiBold": LOCAL_BOLD_FONT,
  "Quicksand-Bold": LOCAL_BOLD_FONT,

  quicksand: LOCAL_REGULAR_FONT,
  "quicksand-light": LOCAL_REGULAR_FONT,
  "quicksand-regular": LOCAL_REGULAR_FONT,
  "quicksand-medium": LOCAL_REGULAR_FONT,
  "quicksand-semibold": LOCAL_BOLD_FONT,
  "quicksand-bold": LOCAL_BOLD_FONT,
};

const Fonts = {
  LIGHT: "outfit",
  REGULAR: "outfit",
  MEDIUM: "outfit-medium",
  SEMIBOLD: "outfit-bold",
  BOLD: "outfit-bold",
};

export default Fonts;

