import { useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { languages, getLanguage } from "@/i18n/languages";
import { GlobeIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";

export default function LanguageDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage } = useLanguage();

  const currentLang = getLanguage(language);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const handleSelect = (code: string) => {
    setLanguage(code as any);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/70 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800/70 dark:text-gray-200 dark:hover:bg-gray-800"
        title="Change Platform Translation Language"
      >
        <GlobeIcon className="size-4 text-brand-600 dark:text-brand-400" />
        <span className="hidden md:inline">{currentLang.shortName}</span>
        <span className="text-[11px]">{currentLang.flagSymbol}</span>
        <svg
          className={`size-3 stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute inset-e-0 mt-2 flex max-h-80 w-52 flex-col overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
          🇮🇳 Regional Languages
        </div>
        <div className="mt-1 flex flex-col gap-0.5">
          {languages.map((l) => {
            const isSelected = l.id === language;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => handleSelect(l.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-start text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-brand-50 text-brand-700 font-bold dark:bg-brand-950/40 dark:text-brand-300"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{l.flagSymbol}</span>
                  <span>{l.name}</span>
                </div>
                {isSelected && (
                  <span className="text-brand-600 dark:text-brand-400 text-xs">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </Dropdown>
    </div>
  );
}
