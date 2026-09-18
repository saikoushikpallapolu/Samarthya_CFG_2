import { createContext, useContext, useEffect, useState } from "react";
import type { User, UserRole } from "../types/samarthya";
import { apiLogout, apiVerifyOtp } from "../services/api";
import { MOCK_USERS } from "../services/mockData";

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
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS.SMC_MEMBER);
  const [role, setRole] = useState<UserRole>("SMC_MEMBER");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const stored = localStorage.getItem("samarthya_current_user");
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          setCurrentUser(parsed);
          setRole(parsed.role);
          setIsAuthenticated(true);
        } else {
          // Default to SMC Member for immediate interactive demo
          setCurrentUser(MOCK_USERS.SMC_MEMBER);
          setRole("SMC_MEMBER");
          setIsAuthenticated(true);
          localStorage.setItem("samarthya_current_user", JSON.stringify(MOCK_USERS.SMC_MEMBER));
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
      const { user } = await apiVerifyOtp(phoneNumber, otp, fullName, selectedRole);
      setCurrentUser(user);
      setRole(user.role);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    const newUser = MOCK_USERS[newRole] || MOCK_USERS.SMC_MEMBER;
    setCurrentUser(newUser);
    setRole(newRole);
    setIsAuthenticated(true);
    localStorage.setItem("samarthya_current_user", JSON.stringify(newUser));
  };

  const logout = async () => {
    await apiLogout();
    localStorage.removeItem("samarthya_current_user");
    // Revert to citizen public view
    setCurrentUser(MOCK_USERS.CITIZEN);
    setRole("CITIZEN");
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
