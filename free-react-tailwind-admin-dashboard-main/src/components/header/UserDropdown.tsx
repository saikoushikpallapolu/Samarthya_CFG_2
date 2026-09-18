import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { getLanguage, languages, type Locale } from "@/i18n/languages";
import type { UserRole } from "@/types/samarthya";
import { cn } from "@/utils";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";

const ROLE_LABELS: Record<UserRole, { label: string; badgeColor: string }> = {
  SMC_MEMBER: { label: "SMC Member", badgeColor: "bg-blue-light-100 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400" },
  CITIZEN: { label: "Public Citizen", badgeColor: "bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-400" },
  GOVERNMENT_OFFICER: { label: "Govt Authority", badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" },
  SAMARTHYA_ADMIN: { label: "Samarthya Admin", badgeColor: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400" },
  SAMARTHYA_COORDINATOR: { label: "Coordinator", badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400" },
};

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);
  const subDropdownRef = useRef<HTMLLIElement>(null);
  const { language: locale, setLanguage } = useLanguage();
  const currentLang = getLanguage(locale as Locale);
  const CurrentFlagIcon = currentLang.FlagIcon;
  const navigate = useNavigate();

  const { currentUser, role, switchRole, logout } = useAuth();

  useClickOutside(subDropdownRef, () => {
    setIsSubDropdownOpen(false);
  });

  const handleSelectLanguage = (langId: Locale) => {
    setLanguage(langId);
    setIsSubDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    setIsSubDropdownOpen(false);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setIsSubDropdownOpen(false);
  };

  const handleRoleSelect = (targetRole: UserRole) => {
    switchRole(targetRole);
    closeDropdown();
    // Navigate to role's dashboard
    if (targetRole === "SMC_MEMBER") navigate("/dashboard/smc");
    else if (targetRole === "CITIZEN") navigate("/dashboard/citizen");
    else if (targetRole === "GOVERNMENT_OFFICER") navigate("/dashboard/authority");
    else if (targetRole === "SAMARTHYA_ADMIN") navigate("/dashboard/admin");
  };

  const handleLogout = async () => {
    await logout();
    closeDropdown();
    navigate("/signin");
  };

  useEffect(() => {
    return () => {
      setIsOpen(false);
      setIsSubDropdownOpen(false);
    };
  }, []);

  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.SMC_MEMBER;

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="dropdown-toggle flex items-center gap-2 text-gray-700 dark:text-gray-400"
      >
        <span className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-brand-500/30">
          <img src={currentUser.avatarUrl || "/images/user/owner.png"} alt={currentUser.fullName} className="h-full w-full object-cover" />
        </span>

        <div className="hidden text-start sm:block">
          <span className="block text-theme-sm font-semibold text-gray-900 dark:text-white leading-tight">
            {currentUser.fullName}
          </span>
          <span className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold ${roleInfo.badgeColor}`}>
            {roleInfo.label}
          </span>
        </div>

        <svg
          className={`stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute inset-e-0 mt-3 flex w-72 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="border-b border-gray-100 pb-2.5 dark:border-gray-800">
          <span className="block text-theme-sm font-semibold text-gray-900 dark:text-white">
            {currentUser.fullName}
          </span>
          <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
            {currentUser.email || currentUser.phoneNumber}
          </span>
          <span className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${roleInfo.badgeColor}`}>
            Current Role: {roleInfo.label}
          </span>
        </div>

        {/* 1-Click Role Switcher */}
        <div className="pt-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Quick Role Switcher (Demo)
          </p>
          <div className="grid grid-cols-2 gap-1.5 px-1">
            <button
              type="button"
              onClick={() => handleRoleSelect("SMC_MEMBER")}
              className={cn(
                "rounded-lg px-2 py-1.5 text-start text-xs font-medium transition",
                role === "SMC_MEMBER"
                  ? "bg-brand-500 text-white font-semibold shadow-xs"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              🏫 SMC Member
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("CITIZEN")}
              className={cn(
                "rounded-lg px-2 py-1.5 text-start text-xs font-medium transition",
                role === "CITIZEN"
                  ? "bg-brand-500 text-white font-semibold shadow-xs"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              👥 Citizen
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("GOVERNMENT_OFFICER")}
              className={cn(
                "rounded-lg px-2 py-1.5 text-start text-xs font-medium transition",
                role === "GOVERNMENT_OFFICER"
                  ? "bg-brand-500 text-white font-semibold shadow-xs"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              🏛️ Govt Officer
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("SAMARTHYA_ADMIN")}
              className={cn(
                "rounded-lg px-2 py-1.5 text-start text-xs font-medium transition",
                role === "SAMARTHYA_ADMIN"
                  ? "bg-brand-500 text-white font-semibold shadow-xs"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              ⚙️ Admin
            </button>
          </div>
        </div>

        <ul className="flex flex-col gap-1 border-b border-gray-100 pt-2 pb-2 dark:border-gray-800">
          <li className="relative" ref={subDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSubDropdownOpen((prev) => !prev)}
              className={cn(
                "group flex max-h-10 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-theme-sm font-medium transition-colors",
                isSubDropdownOpen
                  ? "bg-gray-100 text-gray-900 dark:bg-white/5 dark:text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              )}
            >
              <span className="flex items-center gap-3 text-theme-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12.001 2.75C17.1091 2.75 21.2501 6.89178 21.2501 11.9999C21.2501 17.108 17.1091 21.2498 12.001 21.2498M12.001 2.75C6.89289 2.75 2.75195 6.89178 2.75195 11.9999C2.75195 17.108 6.8929 21.2498 12.001 21.2498M12.001 2.75C14.2097 2.75 16.0005 6.8914 16.0005 11.9993C16.0005 17.1073 14.2098 21.2498 12.001 21.2498M12.001 2.75C9.79226 2.75 8.00195 6.89141 8.00195 11.9994C8.00195 17.1073 9.79226 21.2498 12.001 21.2498M3.24561 8.99976H20.7544M3.24561 14.9998H20.7544"
                    stroke="#667085"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Language (भाषा)</span>
              </span>

              <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-theme-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-white/3 dark:text-gray-300">
                <span>{currentLang.shortName}</span>
                <CurrentFlagIcon className="size-3.5 shrink-0 overflow-hidden rounded-full" />
              </span>
            </button>

            {isSubDropdownOpen && (
              <div className="absolute -inset-s-2 top-11 w-62.5 rounded-2xl border border-gray-200 bg-white p-2 shadow-theme-lg md:inset-s-auto md:inset-e-[calc(100%+14px)] md:top-0 dark:border-gray-800 dark:bg-gray-dark z-99">
                <ul className="flex flex-col gap-1">
                  {languages.map((language) => {
                    const isSelected = locale === language.id;
                    const FlagIcon = language.FlagIcon;

                    return (
                      <li key={language.id}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectLanguage(language.id);
                            closeDropdown();
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start text-theme-sm font-medium transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white",
                            isSelected
                              ? "bg-brand-50 dark:bg-brand-500/15"
                              : "hover:bg-gray-100 dark:hover:bg-white/5",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "size-1.5 shrink-0 rounded-full transition-opacity",
                                isSelected ? "bg-brand-500 opacity-100 dark:bg-brand-400" : "opacity-0"
                              )}
                            />
                            <FlagIcon className="size-5 shrink-0 overflow-hidden rounded-full" />
                            <span className="truncate">{language.name}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        </ul>

        <button
          onClick={handleLogout}
          type="button"
          className="group mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 transition-colors"
        >
          <svg className="fill-error-500" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
              fill="currentColor"
            />
          </svg>
          Sign Out
        </button>
      </Dropdown>
    </div>
  );
}
