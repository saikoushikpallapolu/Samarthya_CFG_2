import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiUpdateLanguage } from "@/services/api";

export type LanguageCode =
  | "hi"
  | "en"
  | "pa"
  | "bn"
  | "mr"
  | "te"
  | "ta"
  | "gu"
  | "kn"
  | "or"
  | "ar"
  | "es"
  | "de";

export type Language = {
  code: LanguageCode;
  name: string;
  dir: "ltr" | "rtl";
  flag?: string;
};

export const AVAILABLE_LANGUAGES: Language[] = [
  { code: "hi", name: "हिन्दी (Hindi)", dir: "ltr", flag: "🇮🇳" },
  { code: "en", name: "English", dir: "ltr", flag: "🇬🇧" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)", dir: "ltr", flag: "🇮🇳" },
  { code: "bn", name: "বাংলা (Bengali)", dir: "ltr", flag: "🇮🇳" },
  { code: "mr", name: "मराठी (Marathi)", dir: "ltr", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు (Telugu)", dir: "ltr", flag: "🇮🇳" },
  { code: "ta", name: "தமிழ் (Tamil)", dir: "ltr", flag: "🇮🇳" },
  { code: "gu", name: "ગુજરાતી (Gujarati)", dir: "ltr", flag: "🇮🇳" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)", dir: "ltr", flag: "🇮🇳" },
  { code: "or", name: "ଓଡ଼ିଆ (Odia)", dir: "ltr", flag: "🇮🇳" },
];

type LanguageContextType = {
  language: LanguageCode;
  currentLanguage: Language;
  dir: "ltr" | "rtl";
  setLanguage: (code: LanguageCode) => void;
  availableLanguages: Language[];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const currentLng = (i18n.resolvedLanguage || i18n.language || "hi") as LanguageCode;
    return AVAILABLE_LANGUAGES.some((lang) => lang.code === currentLng)
      ? currentLng
      : "hi";
  });

  const currentLanguage =
    AVAILABLE_LANGUAGES.find((lang) => lang.code === language) ||
    AVAILABLE_LANGUAGES[0];
  const dir = currentLanguage.dir;

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      const matched = AVAILABLE_LANGUAGES.find((l) => l.code === lng);
      if (matched && matched.code !== language) {
        setLanguageState(matched.code);
      }
    };

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [i18n, language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    localStorage.setItem("i18nextLng", language);
    localStorage.setItem("language", language);
  }, [language, dir]);

  const setLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    setLanguageState(code);
    if (["en", "hi", "pa"].includes(code)) {
      apiUpdateLanguage(code as any).catch(() => {});
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        currentLanguage,
        dir,
        setLanguage,
        availableLanguages: AVAILABLE_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
