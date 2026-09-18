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
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { loginWithOtp } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await apiRequestOtp(phoneNumber);
      setOtpSent(true);
      setOtp(res.testOtp); // Pre-fill test OTP (459123 or dev code)
      setOtpMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send OTP. Please check mobile number.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    try {
      await loginWithOtp(phoneNumber, otp || "459123", selectedRole);
      redirectToDashboard(selectedRole);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
              🇮🇳 Samarthya Civic Platform
            </span>
            <h1 className="mt-2 text-title-sm font-bold text-gray-900 sm:text-title-md dark:text-white">
              Sign In to Your Account
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Authenticate securely with your registered Indian mobile number and OTP.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-xl border border-error-200 bg-error-50 p-3 text-xs font-medium text-error-700 dark:border-error-900 dark:bg-error-950/20 dark:text-error-400">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Mobile OTP Form */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label>Select Account Role (भूमिका चुनें)</Label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-medium dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="SMC_MEMBER">🏫 School Management Committee (SMC) Member</option>
                  <option value="CITIZEN">👥 Citizen / Parent / Local Community</option>
                  <option value="GOVERNMENT_OFFICER">🏛️ Government Officer / Executive Engineer</option>
                  <option value="SAMARTHYA_ADMIN">📊 Samarthya State Administrator</option>
                </select>
              </div>

              <div>
                <Label>Registered Mobile Number (पंजीकृत मोबाइल नंबर)</Label>
                <Input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              <Button disabled={isLoading} className="w-full" size="sm">
                {isLoading ? "Sending OTP..." : "Get OTP via SMS"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndLogin} className="space-y-4">
              {otpMessage && (
                <div className="rounded-xl border border-success-200 bg-success-50 p-3 text-xs text-success-800 dark:border-success-900 dark:bg-success-950/20 dark:text-success-300">
                  ✅ {otpMessage}
                </div>
              )}

              <div>
                <Label>Enter 6-Digit OTP (ओटीपी दर्ज करें)</Label>
                <Input
                  type="text"
                  placeholder="459123"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Universal Test OTP: <strong className="text-brand-600 dark:text-brand-400">459123</strong>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setErrorMessage("");
                  }}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
            Need to register a new school or parent account?{" "}
            <Link to="/signup" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Register Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
