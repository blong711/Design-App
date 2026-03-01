"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ColorScheme = "dark" | "light";
export type LayoutMode = "vertical" | "horizontal";
export type AuthLayout = "default" | "reversed" | "centered";

interface SettingsContextType {
  colorScheme: ColorScheme;
  setColorScheme: (v: ColorScheme) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (v: LayoutMode) => void;
  authLayout: AuthLayout;
  setAuthLayout: (v: AuthLayout) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  colorScheme: "dark",
  setColorScheme: () => {},
  layoutMode: "vertical",
  setLayoutMode: () => {},
  authLayout: "default",
  setAuthLayout: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("dark");
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>("vertical");
  const [authLayout, setAuthLayoutState] = useState<AuthLayout>("default");

  // Load from localStorage on mount
  useEffect(() => {
    const savedScheme = localStorage.getItem("colorScheme") as ColorScheme | null;
    const savedLayout = localStorage.getItem("layoutMode") as LayoutMode | null;
    const savedAuth = localStorage.getItem("authLayout") as AuthLayout | null;
    if (savedScheme) setColorSchemeState(savedScheme);
    if (savedLayout) setLayoutModeState(savedLayout);
    if (savedAuth) setAuthLayoutState(savedAuth);
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

  // Save auth layout
  useEffect(() => {
    localStorage.setItem("authLayout", authLayout);
  }, [authLayout]);

  const setColorScheme = (v: ColorScheme) => setColorSchemeState(v);
  const setLayoutMode = (v: LayoutMode) => setLayoutModeState(v);
  const setAuthLayout = (v: AuthLayout) => setAuthLayoutState(v);

  return (
    <SettingsContext.Provider value={{ colorScheme, setColorScheme, layoutMode, setLayoutMode, authLayout, setAuthLayout }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
