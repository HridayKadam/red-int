"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { COOKIE_BRAND, COOKIE_MODE, parseMode, type AppMode } from "@/lib/cookies";
import type { BrandSummary } from "@/lib/types";

type AppContextValue = {
  brands: BrandSummary[];
  brand: BrandSummary | null;
  brandId: string | null;
  mode: AppMode;
  demoLabeled: boolean;
  setBrandId: (id: string) => void;
  setMode: (mode: AppMode) => void;
  refreshBrands: (brands: BrandSummary[]) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function AppProvider({
  children,
  initialBrands,
  initialBrandId,
  initialMode,
}: {
  children: ReactNode;
  initialBrands: BrandSummary[];
  initialBrandId: string | null;
  initialMode: AppMode;
}) {
  const [brands, setBrands] = useState(initialBrands);
  const [brandId, setBrandIdState] = useState<string | null>(
    initialBrandId ?? initialBrands[0]?.id ?? null,
  );
  const [mode, setModeState] = useState<AppMode>(initialMode);

  const setBrandId = useCallback((id: string) => {
    setBrandIdState(id);
    writeCookie(COOKIE_BRAND, id);
  }, []);

  const setMode = useCallback((next: AppMode) => {
    setModeState(next);
    writeCookie(COOKIE_MODE, next);
  }, []);

  const refreshBrands = useCallback((next: BrandSummary[]) => {
    setBrands(next);
  }, []);

  const brand = useMemo(
    () => brands.find((item) => item.id === brandId) ?? brands[0] ?? null,
    [brands, brandId],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      brands,
      brand,
      brandId: brand?.id ?? null,
      mode,
      demoLabeled: mode === "demo",
      setBrandId,
      setMode,
      refreshBrands,
    }),
    [brands, brand, mode, setBrandId, setMode, refreshBrands],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppProvider");
  }
  return ctx;
}

export function useOptionalAppState() {
  return useContext(AppContext);
}

export { parseMode };
