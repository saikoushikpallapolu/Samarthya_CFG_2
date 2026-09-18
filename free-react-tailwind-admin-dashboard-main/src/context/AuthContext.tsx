import { createContext, useContext, useEffect, useState } from "react";
import type { User, UserRole } from "../types/samarthya";
import { apiGetCurrentUser, apiLogout, apiVerifyOtp, STORAGE_KEYS } from "../services/api";

const DEFAULT_USER: User = {
  id: "d8348d7d-fca8-45f4-b99c-524bd94dd8c5",
  phoneNumber: "+919876543210",
  fullName: "Ramesh Kumar (SMC Member)",
  role: "SMC_MEMBER",
  preferredLanguage: "hi",
  isPhoneVerified: true,
  avatarUrl: "/images/user/owner.png",
  associatedSchools: [
    {
      schoolId: "2f8efbd3-cf27-4b40-96c5-f922834d9fb4",
      schoolName: "Govt Boys Senior Secondary School, Sonipat",
      udiseCode: "06080100101",
      designation: "PARENT_MEMBER",
    },
  ],
};

interface AuthContextType {
  currentUser: User;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithOtp: (
    phoneNumber: string,
    otp: string,
    role?: UserRole,
    fullName?: string
  ) => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [role, setRole] = useState<UserRole>("SMC_MEMBER");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          try {
            const liveUser = await apiGetCurrentUser();
            setCurrentUser(liveUser);
            setRole(liveUser.role);
            setIsAuthenticated(true);
            return;
          } catch (fetchErr) {
            console.warn("Could not fetch user with existing token:", fetchErr);
          }
        }

        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          setCurrentUser(parsed);
          setRole(parsed.role);
          setIsAuthenticated(Boolean(token));
        } else {
          setCurrentUser(DEFAULT_USER);
          setRole("SMC_MEMBER");
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const loginWithOtp = async (
    phoneNumber: string,
    otp: string,
    selectedRole?: UserRole,
    fullName?: string
  ) => {
    setIsLoading(true);
    try {
      const { user } = await apiVerifyOtp(phoneNumber, otp, selectedRole, fullName);
      setCurrentUser(user);
      setRole(user.role);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    const updatedUser: User = {
      ...currentUser,
      role: newRole,
      fullName:
        newRole === "CITIZEN"
          ? "Priya Sharma (Parent)"
          : newRole === "GOVERNMENT_OFFICER"
          ? "Er. Anil Verma (PHED EE)"
          : newRole === "SAMARTHYA_ADMIN"
          ? "Dr. Meenakshi Sundaram (Admin)"
          : currentUser.fullName || "Ramesh Kumar (SMC Member)",
    };
    setCurrentUser(updatedUser);
    setRole(newRole);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
  };

  const logout = async () => {
    await apiLogout();
    const guestUser: User = {
      id: "guest-citizen",
      phoneNumber: "+919800000000",
      fullName: "Guest Citizen",
      role: "CITIZEN",
      preferredLanguage: "hi",
      isPhoneVerified: false,
    };
    setCurrentUser(guestUser);
    setRole("CITIZEN");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        isLoading,
        loginWithOtp,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
