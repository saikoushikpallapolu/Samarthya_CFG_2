import { GlobeIcon, UsFlagIcon } from "@/icons";
import type React from "react";

export const locales = [
  "hi",
  "en",
  "pa",
  "bn",
  "mr",
  "te",
  "ta",
  "gu",
  "kn",
  "or",
] as const;

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "hi";

export interface Language {
  id: Locale;
  name: string;
  shortName: string;
  dir: "ltr" | "rtl";
  FlagIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  flagSymbol: string;
  badge?: string;
}

export const languages: Language[] = [
  {
    id: "hi",
    name: "हिन्दी (Hindi)",
    shortName: "हिन्दी",
    dir: "ltr",
    FlagIcon: GlobeIcon,
    flagSymbol: "🇮🇳",
  },
  {
    id: "en",
    name: "English",
    shortName: "English",
    dir: "ltr",
    FlagIcon: UsFlagIcon,
    flagSymbol: "🇬🇧",
  },
  {
    id: "pa",
    name: "ਪੰਜਾਬੀ (Punjabi)",
    shortName: "ਪੰਜਾਬੀ",
    dir: "ltr",
    FlagIcon: GlobeIcon,
    flagSymbol: "🇮🇳",
  },
  {
    id: "bn",
    name: "বাংলা (Bengali)",
    shortName: "বাংলা",
    dir: "ltr",
    FlagIcon: GlobeIcon,
    flagSymbol: "🇮🇳",
  },
  {
    id: "mr",
    name: "मराठी (Marathi)",
    shortName: "मराठी",
    dir: "ltr",
    FlagIcon: GlobeIcon,
    flagSymbol: "🇮🇳",
  },
  {
    id: "te",
    name: "తెలుగు (Telugu)",
    shortName: "తెలుగు",
    dir: "ltr",
    FlagIcon: GlobeIcon,
    flagSymbol: "🇮🇳",
  },
  {
    id: "ta",
    name: "தமிழ் (Tamil)",
    shortName: "தமிழ்",
    dir: "ltr",
    FlagIcon: GlobeIcon,
    flagSymbol: "🇮🇳",
  },
  {
    id: "gu",
    name: "ગુજરાતી (Gujarati)",
    shortName: "ગુજરાતી",
    dir: "ltr",
    FlagIcon: GlobeIcon,
    flagSymbol: "🇮🇳",
  },
  {
    id: "kn",
    name: "ಕನ್ನಡ (Kannada)",
    shortName: "ಕನ್ನಡ",
    dir: "ltr",
    FlagIcon: GlobeIcon,
    flagSymbol: "🇮🇳",
  },
  {
    id: "or",
    name: "ଓଡ଼ିଆ (Odia)",
    shortName: "ଓଡ଼ିଆ",
    dir: "ltr",
    FlagIcon: GlobeIcon,
    flagSymbol: "🇮🇳",
  },
];

export function getLanguage(locale: string): Language {
  return languages.find((l) => l.id === locale) || languages[0];
}

export function isRtl(locale: string): boolean {
  return getLanguage(locale).dir === "rtl";
}
