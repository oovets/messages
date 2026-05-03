export type ThemeMode = "light" | "dark";

export type ThemeTokenKey =
  | "background"
  | "foreground"
  | "primary"
  | "primaryForeground"
  | "muted"
  | "mutedForeground"
  | "border";

export type ThemeTokenValues = Record<ThemeTokenKey, string>;

export interface AppearanceSettings {
  fontScale: number;
  fontFamily: string;
  themeOverrides: Partial<Record<ThemeMode, Partial<ThemeTokenValues>>>;
}

export const MIN_FONT_SCALE = 0.8;
export const MAX_FONT_SCALE = 1.35;
export const FONT_SCALE_STEP = 0.05;
export const DEFAULT_FONT_SCALE = 1;
export const DEFAULT_FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const THEME_TOKEN_LABELS: Array<{ key: ThemeTokenKey; label: string }> = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Text" },
  { key: "primary", label: "Accent" },
  { key: "primaryForeground", label: "Accent text" },
  { key: "muted", label: "Panel" },
  { key: "mutedForeground", label: "Muted text" },
  { key: "border", label: "Border" },
];

export const DEFAULT_THEME_TOKENS: Record<ThemeMode, ThemeTokenValues> = {
  light: {
    background: "#ffffff",
    foreground: "#020817",
    primary: "#007bff",
    primaryForeground: "#ffffff",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    border: "#e2e8f0",
  },
  dark: {
    background: "#181817",
    foreground: "#e7e3da",
    primary: "#aaa394",
    primaryForeground: "#181817",
    muted: "#262521",
    mutedForeground: "#89857b",
    border: "#2a2927",
  },
};

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  fontScale: DEFAULT_FONT_SCALE,
  fontFamily: DEFAULT_FONT_FAMILY,
  themeOverrides: {},
};

export function clampFontScale(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FONT_SCALE;
  const rounded = Math.round(value * 100) / 100;
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, rounded));
}

export function getThemeTokenValue(
  settings: AppearanceSettings,
  mode: ThemeMode,
  key: ThemeTokenKey
): string {
  return settings.themeOverrides[mode]?.[key] ?? DEFAULT_THEME_TOKENS[mode][key];
}

export function getThemeTokens(settings: AppearanceSettings, mode: ThemeMode): ThemeTokenValues {
  return {
    ...DEFAULT_THEME_TOKENS[mode],
    ...settings.themeOverrides[mode],
  };
}

function hexToHsl(hex: string): string {
  const normalized = normalizeHex(hex);
  const r = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const g = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const b = Number.parseInt(normalized.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return "#000000";
}

export function applyAppearance(settings: AppearanceSettings, mode: ThemeMode): void {
  const root = document.documentElement;
  const tokens = getThemeTokens(settings, mode);
  const setColor = (name: string, value: string) => root.style.setProperty(name, hexToHsl(value));

  root.style.setProperty("font-size", `${clampFontScale(settings.fontScale) * 100}%`);
  root.style.setProperty("--app-font-family", settings.fontFamily || DEFAULT_FONT_FAMILY);

  setColor("--background", tokens.background);
  setColor("--card", tokens.background);
  setColor("--popover", tokens.background);
  setColor("--foreground", tokens.foreground);
  setColor("--card-foreground", tokens.foreground);
  setColor("--popover-foreground", tokens.foreground);
  setColor("--primary", tokens.primary);
  setColor("--ring", tokens.primary);
  setColor("--primary-foreground", tokens.primaryForeground);
  setColor("--muted", tokens.muted);
  setColor("--secondary", tokens.muted);
  setColor("--accent", tokens.muted);
  setColor("--muted-foreground", tokens.mutedForeground);
  setColor("--secondary-foreground", tokens.foreground);
  setColor("--accent-foreground", tokens.foreground);
  setColor("--border", tokens.border);
  setColor("--input", tokens.border);
}
