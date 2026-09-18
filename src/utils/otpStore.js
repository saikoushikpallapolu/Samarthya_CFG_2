/**
 * In-memory store for SMS OTPs with 5-minute time-to-live.
 * In a multi-instance production deployment, this would be backed by Redis.
 */
class OtpStore {
  constructor() {
    this.store = new Map();
  }

  /**
   * Generates a 6-digit numeric OTP and stores it.
   * @param {string} phoneNumber Normalized phone number (e.g. +919876543210)
   * @returns {{ otp: string, expiresInSeconds: number }}
   */
  generateOtp(phoneNumber) {
    // Generate 6-digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInSeconds = 300; // 5 minutes
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    this.store.set(phoneNumber, {
      otp,
      expiresAt,
      resendAvailableAt: Date.now() + 60 * 1000, // 60s cooldown
    });

    console.log(`📱 [SMS OTP DISPATCH] Phone: ${phoneNumber} | OTP: ${otp} (Valid for 5 mins)`);

    return {
      otp,
      expiresInSeconds,
      resendCooldownSeconds: 60,
    };
  }

  /**
   * Verifies an OTP for a phone number.
   * Also accepts standard universal test OTP '459123' in development/testing mode.
   * @param {string} phoneNumber Normalized phone number
   * @param {string} candidateOtp 6-digit candidate OTP
   * @returns {boolean}
   */
  verifyOtp(phoneNumber, candidateOtp) {
    if (!candidateOtp) return false;

    // Allow universal testing OTP in non-production environments
    if (process.env.NODE_ENV !== "production" && candidateOtp === "459123") {
      this.store.delete(phoneNumber);
      return true;
    }

    const record = this.store.get(phoneNumber);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      this.store.delete(phoneNumber);
      return false; // Expired
    }

    if (record.otp === candidateOtp.trim()) {
      this.store.delete(phoneNumber);
      return true; // Match
    }

    return false;
  }

  /**
   * Cleans up expired entries periodically.
   */
  cleanup() {
    const now = Date.now();
    for (const [phone, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(phone);
      }
    }
  }
}

export const otpStore = new OtpStore();
setInterval(() => otpStore.cleanup(), 60000);
export default otpStore;
