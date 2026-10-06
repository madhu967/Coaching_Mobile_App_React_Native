import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors, { THEME_PALETTES, applyThemePalette } from "../constant/Colors";

const THEME_STORAGE_KEY = "@coaching_app_theme_mode_v1";
// Exact cycle order: 1. Lime ("default") -> 2. White & Black ("monochrome") -> 3. Navy Blue ("indigo") -> 4. Yellow ("gold")
const THEME_ORDER = ["default", "monochrome", "indigo", "gold"];

export const ThemeContext = createContext({
  themeMode: "default",
  isIndigo: false,
  colors: Colors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(Colors.MODE || "default");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && THEME_ORDER.includes(saved)) {
          applyThemePalette(saved);
          if (isMounted) {
            setThemeMode(saved);
          }
        } else if (saved) {
          // Reset removed theme (e.g. crimson) to default
          applyThemePalette("default");
          if (isMounted) {
            setThemeMode("default");
          }
        }
      } catch (e) {
        // Fallback to default
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const setTheme = useCallback(async (nextMode) => {
    const validMode = THEME_ORDER.includes(nextMode) ? nextMode : "default";
    // Mutate Colors synchronously before state update so all StyleSheet factories read the new palette immediately
    applyThemePalette(validMode);
    setThemeMode(validMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, validMode);
    } catch (e) {}
  }, []);

  const toggleTheme = useCallback(() => {
    const currentIndex = THEME_ORDER.indexOf(themeMode);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % THEME_ORDER.length;
    setTheme(THEME_ORDER[nextIndex]);
  }, [themeMode, setTheme]);

  const activeColors = THEME_PALETTES[themeMode] || THEME_PALETTES.default;
  const isDarkNavbar = themeMode === "indigo" || themeMode === "monochrome";

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isIndigo: isDarkNavbar,
        colors: activeColors,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
