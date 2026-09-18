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
  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [selectedRole, setSelectedRole] = useState<UserRole>("SMC_MEMBER");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { loginWithOtp } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiRequestOtp(phoneNumber);
      setOtpSent(true);
      setOtp(res.testOtp);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginWithOtp(phoneNumber, otp || "459123", selectedRole, fullName);
      if (selectedRole === "SMC_MEMBER") navigate("/dashboard/smc");
      else if (selectedRole === "CITIZEN") navigate("/dashboard/citizen");
      else if (selectedRole === "GOVERNMENT_OFFICER") navigate("/dashboard/authority");
      else navigate("/dashboard/admin");
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
              <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-900 dark:bg-brand-950/20 dark:text-brand-300">
                OTP sent to {phoneNumber}. Enter code below to confirm registration.
              </div>

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

              <Button disabled={isLoading} className="w-full" size="sm">
                {isLoading ? "Completing Registration..." : "Confirm & Open Dashboard"}
              </Button>
            </form>
          )}

          <div className="mt-5 text-center text-xs text-gray-500">
            Already registered?{" "}
            <Link to="/signin" className="font-semibold text-brand-600 hover:underline">
              Sign In with OTP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
