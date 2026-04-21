import React, { useState } from "react";
import Navbar from "../component/Navbar";

const ForgotPassword = () => {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const sendOtp = async () => {
    if (!phone.trim()) return alert("Enter phone number");
    const res = await fetch(`${API_BASE}/api/auth/forgot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (res.ok) { alert("OTP sent"); setOtpSent(true); }
    else alert(data.message || "Failed to send OTP");
  };

  const verify = async () => {
    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("OTP verified");
      window.location.href = `/reset-password?phone=${encodeURIComponent(phone)}&otp=${encodeURIComponent(otp)}`;
    } else {
      alert(data.message || "Invalid OTP");
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-page-container">
        <div className="auth-form-box">
          <h2>Forgot Password</h2>
          <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {!otpSent ? (
            <button onClick={sendOtp}>Send OTP</button>
          ) : (
            <>
              <input placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
              <button onClick={verify}>Verify OTP</button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
