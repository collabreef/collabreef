import { createContext, useContext, useEffect, useState } from "react";
import { hexToHsl, isValidHex } from "@/utils/colorUtils";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const DEFAULT_PRIMARY_COLOR = "#1c6c6d";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [primaryColor, setPrimaryColorState] = useState<string>(DEFAULT_PRIMARY_COLOR);

  // Initialize theme from system preferences
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");

    // Load saved color from localStorage
    const savedColor = localStorage.getItem("primaryColor");
    if (savedColor && isValidHex(savedColor)) {
      setPrimaryColorState(savedColor);
    }
  }, []);

  // Apply theme class
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Apply primary color CSS variables
  useEffect(() => {
    if (!isValidHex(primaryColor)) return;

    const { h, s, l } = hexToHsl(primaryColor);
    const root = document.documentElement;

    root.style.setProperty('--primary-h', h.toString());
    root.style.setProperty('--primary-s', `${s}%`);
    root.style.setProperty('--primary-l', `${l}%`);

    localStorage.setItem("primaryColor", primaryColor);
  }, [primaryColor]);

  const setPrimaryColor = (color: string) => {
    if (isValidHex(color)) {
      setPrimaryColorState(color);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
