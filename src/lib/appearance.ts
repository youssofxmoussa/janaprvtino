export type ThemeMode = "light" | "dark" | "system";
export type TextSize = "small" | "default" | "large";

export interface AppearanceSettings {
  theme: ThemeMode;
  textSize: TextSize;
  reduceMotion: boolean;
  boldText: boolean;
}

export const APPEARANCE_KEY = "janaprvt_appearance";

export const defaultAppearance: AppearanceSettings = {
  theme: "system",
  textSize: "default",
  reduceMotion: false,
  boldText: false,
};

const textSizeMap: Record<TextSize, string> = {
  small: "15px",
  default: "16px",
  large: "18px",
};

export function readAppearance(): AppearanceSettings {
  if (typeof window === "undefined") return defaultAppearance;
  try {
    const raw = localStorage.getItem(APPEARANCE_KEY);
    if (!raw) return defaultAppearance;
    return { ...defaultAppearance, ...(JSON.parse(raw) as Partial<AppearanceSettings>) };
  } catch {
    return defaultAppearance;
  }
}

export function saveAppearance(settings: AppearanceSettings) {
  try {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
  applyAppearance(settings);
}

export function applyAppearance(settings: AppearanceSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
  const dark = settings.theme === "dark" || (settings.theme === "system" && prefersDark);

  root.classList.toggle("dark", dark);
  root.classList.toggle("reduce-motion", settings.reduceMotion);
  root.classList.toggle("bold-text", settings.boldText);
  root.style.fontSize = textSizeMap[settings.textSize];
}
