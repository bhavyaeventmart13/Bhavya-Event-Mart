import React, { useState, useContext } from "react";
import Navbar from "../component/Navbar";
import "../styles/Register.css";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const { register, loading } = useContext(UserContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const { name, phone, address, password } = formData;

    const result = await register({ name, phone, address, password });

    if (result.success) {
      alert("Account created successfully!");

      // ✅ FIX: go to login (not account)
      navigate("/login");
    } else {
      alert(result.message || "Registration failed");
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-page-container">
        <div className="auth-form-box">
          <h2>Create Account</h2>
          <p className="auth-subtext">
            Join Pankaj Cloth & Wedding Tent Industry
          </p>

          <form onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <input
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            <input
              name="address"
              placeholder="Address (optional)"
              value={formData.address}
              onChange={handleChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Register"}
            </button>
          </form>

          <div className="auth-footer-links">
            <a href="/login">Already have an account? Login</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;