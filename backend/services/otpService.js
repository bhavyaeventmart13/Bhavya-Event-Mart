// ========================================================
// Simple in-memory OTP service (for testing & dev use)
// Replace later with Twilio / Fast2SMS / MSG91 integration.
// ========================================================

const otpStore = new Map(); // Map<phone, { otp, expires, lastSent }>

// ==============================
// Generate & Send OTP
// ==============================
export const sendOTP = async (phone) => {
  const now = Date.now();

  // ✅ Basic rate limit (avoid spam: 1 OTP per 60 sec)
  const existing = otpStore.get(phone);
  if (existing && now - existing.lastSent < 60 * 1000) {
    const wait = Math.ceil((60 * 1000 - (now - existing.lastSent)) / 1000);
    throw new Error(`Please wait ${wait}s before requesting another OTP.`);
  }

  // ✅ Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // ✅ Save OTP with expiry (5 minutes)
  otpStore.set(phone, {
    otp,
    expires: now + 5 * 60 * 1000, // 5 min
    lastSent: now,
  });

  // ✅ Show OTP in console for testing
  console.log(`✅ OTP for ${phone}: ${otp} (valid for 5 min)`);

  // In real implementation → integrate SMS API here
  return otp;
};

// ==============================
// Verify OTP
// ==============================
export const verifyOTPCode = async (phone, otp) => {
  const data = otpStore.get(phone);

  if (!data) {
    return false; // no OTP stored
  }

  // ✅ Check expiry
  if (Date.now() > data.expires) {
    otpStore.delete(phone);
    console.warn(`❌ OTP for ${phone} expired`);
    return false;
  }

  // ✅ Validate code
  if (data.otp === otp) {
    otpStore.delete(phone); // remove after successful use
    console.log(`✅ OTP verified for ${phone}`);
    return true;
  }

  console.warn(`❌ Invalid OTP attempt for ${phone}`);
  return false;
};
