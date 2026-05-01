// ========================================================
// Email-based OTP service (Dev + Production ready)
// ========================================================

import { sendOtpEmail } from "../utils/emailService.js"; // 🔥 adjust path if needed

const otpStore = new Map(); // Map<email, { otp, expires, lastSent }>

// ==============================
// Generate & Send OTP (EMAIL)
// ==============================
export const sendOTP = async (email) => {
  const now = Date.now();

  // ✅ Rate limit (1 OTP per 60 sec)
  const existing = otpStore.get(email);
  if (existing && now - existing.lastSent < 60 * 1000) {
    const wait = Math.ceil((60 * 1000 - (now - existing.lastSent)) / 1000);
    throw new Error(`Please wait ${wait}s before requesting another OTP.`);
  }

  // ✅ Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // ✅ Store OTP (5 min expiry)
  otpStore.set(email, {
    otp,
    expires: now + 5 * 60 * 1000,
    lastSent: now,
  });

  // ✅ Send OTP via EMAIL
  await sendOtpEmail(email, otp);

  console.log(`✅ OTP for ${email}: ${otp}`);

  return otp;
};

// ==============================
// Verify OTP
// ==============================
export const verifyOTPCode = async (email, otp) => {
  const data = otpStore.get(email);

  if (!data) return false;

  // ❌ Expired
  if (Date.now() > data.expires) {
    otpStore.delete(email);
    console.warn(`❌ OTP expired for ${email}`);
    return false;
  }

  // ❌ Wrong OTP
  if (data.otp !== otp) {
    console.warn(`❌ Invalid OTP for ${email}`);
    return false;
  }

  // ✅ Success
  otpStore.delete(email);
  console.log(`✅ OTP verified for ${email}`);
  return true;
};