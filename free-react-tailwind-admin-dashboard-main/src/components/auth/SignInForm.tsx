import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { apiRequestOtp } from "@/services/api";
import type { UserRole } from "@/types/samarthya";

export default function SignInForm() {
  const [phoneNumber, setPhoneNumber] = useState("+91 98765 43210");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("SMC_MEMBER");
  const [otpMessage, setOtpMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { loginWithOtp, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiRequestOtp(phoneNumber);
      setOtpSent(true);
      setOtp(res.testOtp); // Pre-fill test OTP 459123 for convenience
      setOtpMessage(res.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginWithOtp(phoneNumber, otp || "459123", selectedRole);
      redirectToDashboard(selectedRole);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    switchRole(role);
    redirectToDashboard(role);
  };

  const redirectToDashboard = (role: UserRole) => {
    if (role === "SMC_MEMBER") navigate("/dashboard/smc");
    else if (role === "CITIZEN") navigate("/dashboard/citizen");
    else if (role === "GOVERNMENT_OFFICER") navigate("/dashboard/authority");
    else if (role === "SAMARTHYA_ADMIN") navigate("/dashboard/admin");
    else navigate("/");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-md pt-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5 rtl:rotate-180" />
          Back to portal home
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
        <div>
          <div className="mb-5 sm:mb-6">
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              🇮🇳 Samarthya Civic Auth
            </span>
            <h1 className="mt-2 text-title-sm font-bold text-gray-900 sm:text-title-md dark:text-white">
              Role-Based Sign In
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Log in using OTP sent to your registered mobile number or choose a 1-click test role below.
            </p>
          </div>

          {/* 1-Click Quick Demo Login Box */}
          <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-950/20">
            <p className="text-xs font-bold text-brand-900 dark:text-brand-300 mb-2">
              ⚡ 1-Click Instant Demo Login:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("SMC_MEMBER")}
                className="flex items-center gap-2 rounded-xl bg-white p-2 text-start text-xs font-semibold text-gray-800 shadow-xs hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200"
              >
                <span>🏫</span>
                <span className="truncate">SMC Member</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("CITIZEN")}
                className="flex items-center gap-2 rounded-xl bg-white p-2 text-start text-xs font-semibold text-gray-800 shadow-xs hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200"
              >
                <span>👥</span>
                <span className="truncate">Public Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("GOVERNMENT_OFFICER")}
                className="flex items-center gap-2 rounded-xl bg-white p-2 text-start text-xs font-semibold text-gray-800 shadow-xs hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200"
              >
                <span>🏛️</span>
                <span className="truncate">Govt Authority</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("SAMARTHYA_ADMIN")}
                className="flex items-center gap-2 rounded-xl bg-white p-2 text-start text-xs font-semibold text-gray-800 shadow-xs hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200"
              >
                <span>📊</span>
                <span className="truncate">State Admin</span>
              </button>
            </div>
          </div>

          <div className="relative py-2 sm:py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 dark:bg-gray-900">
                Or Sign In with Mobile OTP
              </span>
            </div>
          </div>

          {/* Mobile OTP Form */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label>Select Your Role</Label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-medium dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="SMC_MEMBER">🏫 School Management Committee (SMC) Member</option>
                  <option value="CITIZEN">👥 Citizen / Parent / Community Member</option>
                  <option value="GOVERNMENT_OFFICER">🏛️ Government Officer / Executive Engineer</option>
                  <option value="SAMARTHYA_ADMIN">📊 Samarthya State Administrator</option>
                </select>
              </div>

              <div>
                <Label>Registered Mobile Number (मोबाइल नंबर)</Label>
                <Input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <Button disabled={isLoading} className="w-full" size="sm">
                {isLoading ? "Sending OTP..." : "Get OTP via SMS"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndLogin} className="space-y-4">
              {otpMessage && (
                <div className="rounded-xl bg-success-50 p-3 text-xs text-success-800 dark:bg-success-950/20 dark:text-success-300">
                  {otpMessage}
                </div>
              )}

              <div>
                <Label>Enter 6-Digit OTP</Label>
                <Input
                  type="text"
                  placeholder="459123"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Universal Demo OTP: <strong className="text-brand-600">459123</strong>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
                >
                  Change Number
                </button>
                <Button disabled={isLoading} className="flex-1" size="sm">
                  {isLoading ? "Verifying..." : "Verify OTP & Proceed"}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-5 text-center text-xs text-gray-500">
            Need a new account?{" "}
            <Link to="/signup" className="font-semibold text-brand-600 hover:underline">
              Register with School
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
