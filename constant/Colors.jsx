// 4-Theme Palette System (In exact cycle order):
// 1. "default": Signature Cyber-Lime (#CEFD39) & Deep Pitch Obsidian (#0D0D0D)
// 2. "monochrome": Pure White & Black (#FFFFFF & #0D0D0D)
// 3. "indigo": Navy Blue (#1E3A8A / #172554)
// 4. "gold": Golden Yellow (#FACC15 / #EAB308)

export const THEME_PALETTES = {
  default: {
    MODE: "default",
    WHITE: "#FFFFFF",
    CARD: "#FFFFFF",
    BLACK: "#0D0D0D", // Deep Pitch Obsidian Black
    DARK: "#141416",
    DARK_CARD: "#0D0D0F", // Jet Black graph and widget cards

    // Signature Electric Lime / Neon Chartreuse Accent
    LIME: "#CEFD39", // Iconic vibrant highlight
    LIME_BRIGHT: "#D4FF32",
    LIME_LIGHT: "#F2FED1",
    LIME_TINT: "#E7FDBA",
    LIME_MUTED: "#A3D914",

    // Contrast colors on Accent / Navbar
    ON_ACCENT: "#0D0D0D",
    ON_NAVBAR: "#0D0D0D",
    ON_NAVBAR_SUB: "rgba(13, 13, 13, 0.72)",
    NAVBAR_BG: "#CEFD39",
    NAVBAR_BORDER: "#B8E62E",
    THEME_BTN_BG: "#FFFFFF",
    THEME_BTN_ICON: "#0D0D0D",

    // Modern Obsidian Primary & Graph Accents
    PRIMARY: "#0D0D0D", // Deep Pitch Black for high-contrast pills & buttons
    PRIMARY_DARK: "#141416",
    PRIMARY_LIGHT: "#F0F1F4",
    PRIMARY_TINT: "#E8E9ED",
    SECONDARY: "#4AC7EC", // Electric Cyan / Sky for graph line trends
    SECONDARY_LIGHT: "#E0F7FE",

    // Minimalist Neutrals & Typography
    GRAY: "#7C7C82",
    LIGHT_GRAY: "#A0A0A7",
    MUTED: "#8E8E93",
    BORDER: "#E5E6EA",
    BORDER_LIGHT: "#EFEFF2",
    BG_GRAY: "#F7F8FA", // Clean off-white surface
    BG_LIGHT: "#F8F9FA",
    CANVAS: "#F8F9FA", // Pure clean backdrop
    CHIP_BG: "#F0F1F4",

    // Functional States
    SUCCESS: "#16A34A",
    SUCCESS_LIGHT: "#F0FDF4",
    WARNING: "#F59E0B",
    WARNING_LIGHT: "#FFFBEB",
    DANGER: "#EF4444",
    DANGER_LIGHT: "#FEF2F2",
    PURPLE: "#8B5CF6",
    PURPLE_LIGHT: "#F5F3FF",
  },

  monochrome: {
    MODE: "monochrome",
    WHITE: "#FFFFFF",
    CARD: "#FFFFFF",
    BLACK: "#0D0D0D", // Pure Black text on white backgrounds & cards
    DARK: "#141416",
    DARK_CARD: "#18181B",

    // Separate White & Black Theme (#FFFFFF & #0D0D0D)
    LIME: "#0D0D0D",
    LIME_BRIGHT: "#0D0D0D",
    LIME_LIGHT: "#F4F4F5",
    LIME_TINT: "#E4E4E7",
    LIME_MUTED: "#3F3F46",

    // Contrast colors on Black Accent / Navbar
    ON_ACCENT: "#FFFFFF",
    ON_NAVBAR: "#FFFFFF",
    ON_NAVBAR_SUB: "rgba(255, 255, 255, 0.8)",
    NAVBAR_BG: "#0D0D0D",
    NAVBAR_BORDER: "#27272A",
    THEME_BTN_BG: "#FFFFFF",
    THEME_BTN_ICON: "#0D0D0D",

    PRIMARY: "#0D0D0D",
    PRIMARY_DARK: "#000000",
    PRIMARY_LIGHT: "#F4F4F5",
    PRIMARY_TINT: "#E4E4E7",
    SECONDARY: "#A1A1AA",
    SECONDARY_LIGHT: "#F4F4F5",

    GRAY: "#71717A",
    LIGHT_GRAY: "#A1A1AA",
    MUTED: "#71717A",
    BORDER: "#E4E4E7",
    BORDER_LIGHT: "#E4E4E7",
    BG_GRAY: "#FAFAFA",
    BG_LIGHT: "#F8F9FA",
    CANVAS: "#F8F9FA",
    CHIP_BG: "#F4F4F5",

    SUCCESS: "#16A34A",
    SUCCESS_LIGHT: "#F0FDF4",
    WARNING: "#F59E0B",
    WARNING_LIGHT: "#FFFBEB",
    DANGER: "#EF4444",
    DANGER_LIGHT: "#FEF2F2",
    PURPLE: "#8B5CF6",
    PURPLE_LIGHT: "#F5F3FF",
  },

  indigo: {
    MODE: "indigo",
    WHITE: "#FFFFFF",
    CARD: "#FFFFFF",
    BLACK: "#0D0D0D", // Pure Black text on white backgrounds & cards
    DARK: "#141416",
    DARK_CARD: "#0D0D0F",

    // Separate Navy Blue Theme (#1E3A8A)
    LIME: "#1E3A8A",
    LIME_BRIGHT: "#1E3A8A",
    LIME_LIGHT: "#DBEAFE",
    LIME_TINT: "#BFDBFE",
    LIME_MUTED: "#172554",

    // Contrast colors on Navy Blue Accent / Navbar
    ON_ACCENT: "#FFFFFF",
    ON_NAVBAR: "#FFFFFF",
    ON_NAVBAR_SUB: "rgba(255, 255, 255, 0.85)",
    NAVBAR_BG: "#1E3A8A",
    NAVBAR_BORDER: "#172554",
    THEME_BTN_BG: "#FFFFFF",
    THEME_BTN_ICON: "#0D0D0D",

    PRIMARY: "#0D0D0D",
    PRIMARY_DARK: "#172554",
    PRIMARY_LIGHT: "#F0F1F4",
    PRIMARY_TINT: "#E8E9ED",
    SECONDARY: "#4AC7EC",
    SECONDARY_LIGHT: "#E0F7FE",

    GRAY: "#7C7C82",
    LIGHT_GRAY: "#A0A0A7",
    MUTED: "#8E8E93",
    BORDER: "#E5E6EA",
    BORDER_LIGHT: "#EFEFF2",
    BG_GRAY: "#F7F8FA",
    BG_LIGHT: "#F7F7FC",
    CANVAS: "#F7F7FC",
    CHIP_BG: "#F0F1F4",

    SUCCESS: "#16A34A",
    SUCCESS_LIGHT: "#F0FDF4",
    WARNING: "#F59E0B",
    WARNING_LIGHT: "#FFFBEB",
    DANGER: "#EF4444",
    DANGER_LIGHT: "#FEF2F2",
    PURPLE: "#8B5CF6",
    PURPLE_LIGHT: "#F5F3FF",
  },

  gold: {
    MODE: "gold",
    WHITE: "#FFFFFF",
    CARD: "#FFFFFF",
    BLACK: "#0D0D0D", // Pure Black text on white backgrounds & cards
    DARK: "#141416",
    DARK_CARD: "#0D0D0F",

    // Separate Golden Yellow Theme (#FACC15 / #EAB308)
    LIME: "#FACC15",
    LIME_BRIGHT: "#FACC15",
    LIME_LIGHT: "#FEF9C3",
    LIME_TINT: "#FEF08A",
    LIME_MUTED: "#CA8A04",

    // Contrast colors on Golden Yellow Accent / Navbar
    ON_ACCENT: "#0D0D0D",
    ON_NAVBAR: "#0D0D0D",
    ON_NAVBAR_SUB: "rgba(13, 13, 13, 0.74)",
    NAVBAR_BG: "#FACC15",
    NAVBAR_BORDER: "#EAB308",
    THEME_BTN_BG: "#FFFFFF",
    THEME_BTN_ICON: "#0D0D0D",

    PRIMARY: "#0D0D0D",
    PRIMARY_DARK: "#CA8A04",
    PRIMARY_LIGHT: "#F0F1F4",
    PRIMARY_TINT: "#E8E9ED",
    SECONDARY: "#F59E0B",
    SECONDARY_LIGHT: "#FEF3C7",

    GRAY: "#7C7C82",
    LIGHT_GRAY: "#A0A0A7",
    MUTED: "#8E8E93",
    BORDER: "#E5E6EA",
    BORDER_LIGHT: "#EFEFF2",
    BG_GRAY: "#F7F8FA",
    BG_LIGHT: "#F8F9FA",
    CANVAS: "#F8F9FA",
    CHIP_BG: "#F0F1F4",

    SUCCESS: "#16A34A",
    SUCCESS_LIGHT: "#F0FDF4",
    WARNING: "#F59E0B",
    WARNING_LIGHT: "#FFFBEB",
    DANGER: "#EF4444",
    DANGER_LIGHT: "#FEF2F2",
    PURPLE: "#8B5CF6",
    PURPLE_LIGHT: "#F5F3FF",
  },
};

const Colors = {
  ...THEME_PALETTES.default,
};

export const applyThemePalette = (mode = "default") => {
  const palette = THEME_PALETTES[mode] || THEME_PALETTES.default;
  Object.assign(Colors, palette);
  return Colors;
};

export default Colors;