import React, { useState, useMemo } from "react";
import Navbar from "../component/Navbar";

const ResetPassword = () => {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const params = new URLSearchParams(window.location.search);
  const phoneFromURL = useMemo(() => params.get("phone") || "", []);
  const otpFromURL = useMemo(() => params.get("otp") || "", []);

  const [phone, setPhone] = useState(phoneFromURL);
  const [otp, setOtp] = useState(otpFromURL);
  const [newPassword, setNewPassword] = useState("");

  const reset = async () => {
    if (!phone || !otp || !newPassword) return alert("Fill all fields");
    const res = await fetch(`${API_BASE}/api/auth/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Password updated. Please login.");
      window.location.href = "/login";
    } else {
      alert(data.message || "Failed to reset password");
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-page-container">
        <div className="auth-form-box">
          <h2>Reset Password</h2>
          <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button onClick={reset}>Reset</button>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
