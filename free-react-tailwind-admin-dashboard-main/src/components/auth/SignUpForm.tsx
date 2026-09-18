import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { apiRequestOtp } from "@/services/api";
import type { UserRole } from "@/types/samarthya";

export default function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+91 98123 45678");
  const [selectedRole, setSelectedRole] = useState<UserRole>("SMC_MEMBER");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
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
      setOtp(res.testOtp);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send OTP. Please check your phone number.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    try {
      await loginWithOtp(phoneNumber, otp || "459123", selectedRole, fullName);
      if (selectedRole === "SMC_MEMBER") navigate("/dashboard/smc");
      else if (selectedRole === "CITIZEN") navigate("/dashboard/citizen");
      else if (selectedRole === "GOVERNMENT_OFFICER") navigate("/dashboard/authority");
      else navigate("/dashboard/admin");
    } catch (err: any) {
      setErrorMessage(err.message || "OTP verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-md pt-6">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5 rtl:rotate-180" />
          Back to sign in
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
        <div>
          <div className="mb-5 sm:mb-6">
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              🇮🇳 Samarthya Citizen Registration
            </span>
            <h1 className="mt-2 text-title-sm font-bold text-gray-900 sm:text-title-md dark:text-white">
              Create an Account
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Join your local School Management Committee (SMC) or register as a concerned citizen
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-xl border border-error-200 bg-error-50 p-3 text-xs font-medium text-error-700 dark:border-error-900 dark:bg-error-950/20 dark:text-error-400">
              ⚠️ {errorMessage}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label>Full Name (पूरा नाम) *</Label>
                <Input
                  required
                  type="text"
                  placeholder="उदा. रमेश कुमार"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <Label>User Role (आपकी भूमिका) *</Label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-medium dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="SMC_MEMBER">🏫 School Management Committee (SMC) Member</option>
                  <option value="CITIZEN">👥 Citizen / Parent / Local Community</option>
                  <option value="GOVERNMENT_OFFICER">🏛️ Government Officer / Field Engineer</option>
                  <option value="SAMARTHYA_ADMIN">📊 Samarthya State Administrator</option>
                </select>
              </div>

              <div>
                <Label>Mobile Number (मोबाइल नंबर) *</Label>
                <Input
                  required
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <Button disabled={isLoading} className="w-full" size="sm">
                {isLoading ? "Sending OTP..." : "Register & Get OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-900 dark:border-brand-900 dark:bg-brand-950/20 dark:text-brand-300">
                OTP sent to {phoneNumber}. Enter code below to confirm registration.
              </div>

              <div>
                <Label>6-Digit Verification Code</Label>
                <Input
                  required
                  type="text"
                  placeholder="459123"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Universal Test OTP: <strong className="text-brand-600">459123</strong>
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
                  Back
                </button>
                <Button disabled={isLoading} className="flex-1" size="sm">
                  {isLoading ? "Registering..." : "Confirm & Enter Dashboard"}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-5 text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link to="/signin" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
