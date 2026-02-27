"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ColorScheme = "dark" | "light";
export type LayoutMode = "vertical" | "horizontal";

interface SettingsContextType {
  colorScheme: ColorScheme;
  setColorScheme: (v: ColorScheme) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (v: LayoutMode) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  colorScheme: "dark",
  setColorScheme: () => {},
  layoutMode: "vertical",
  setLayoutMode: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("dark");
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>("vertical");

  // Load from localStorage on mount
  useEffect(() => {
    const savedScheme = localStorage.getItem("colorScheme") as ColorScheme | null;
    const savedLayout = localStorage.getItem("layoutMode") as LayoutMode | null;
    if (savedScheme) setColorSchemeState(savedScheme);
    if (savedLayout) setLayoutModeState(savedLayout);
  }, []);

  // Apply color scheme to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (colorScheme === "light") {
      html.classList.remove("dark");
      html.classList.add("light");
    } else {
      html.classList.remove("light");
      html.classList.add("dark");
    }
    localStorage.setItem("colorScheme", colorScheme);
  }, [colorScheme]);

  // Save layout
  useEffect(() => {
    localStorage.setItem("layoutMode", layoutMode);
  }, [layoutMode]);

  const setColorScheme = (v: ColorScheme) => setColorSchemeState(v);
  const setLayoutMode = (v: LayoutMode) => setLayoutModeState(v);

  return (
    <SettingsContext.Provider value={{ colorScheme, setColorScheme, layoutMode, setLayoutMode }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
