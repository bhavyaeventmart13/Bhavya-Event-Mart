import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // ================= STATE =================
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [triggerCheckout, setTriggerCheckout] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ================= AUTH HEADER =================
  const authHeader = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // ================= LOGOUT =================
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // ================= REGISTER =================
  const register = useCallback(
    async (payload) => {
      try {
        setLoading(true);

        const { data } = await axios.post(
          `${API_BASE}/api/auth/register-public`,
          payload
        );

        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          message:
            err?.response?.data?.message ||
            err?.message ||
            "Registration failed",
        };
      } finally {
        setLoading(false);
      }
    },
    [API_BASE]
  );

  // ================= LOGIN =================
  const login = useCallback(
    async (payload) => {
      try {
        setLoading(true);

        const loginPayload = {
          identifier: payload.identifier || payload.phone,
          password: payload.password,
        };

        const { data } = await axios.post(
          `${API_BASE}/api/auth/login`,
          loginPayload
        );

        const normalizedUser = {
          id: data.id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          role: data.role || "customer",
          token: data.token,
        };

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        setUser(normalizedUser);

        if (pendingCheckout) {
          setPendingCheckout(false);
          setTriggerCheckout(true);
        }

        return { success: true, data: normalizedUser };
      } catch (err) {
        return {
          success: false,
          message:
            err?.response?.data?.message ||
            err?.message ||
            "Login failed",
        };
      } finally {
        setLoading(false);
      }
    },
    [API_BASE, pendingCheckout]
  );

  // ================= FETCH PROFILE (FIXED) =================
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const { data } = await axios.get(
        `${API_BASE}/api/auth/profile`,
        {
          headers: authHeader(),
        }
      );

      // 🔥 FIX: correct response structure
      if (!data?.user) return;

      const userData = data.user;

      const updatedUser = {
        ...(user || {}),
        id: userData._id,
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        address: userData.address,
        role: userData.role || "customer",
        token,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch {
      logout();
    }
  }, [API_BASE, authHeader, logout, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ================= PROVIDER =================
  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        authHeader,

        showAuthPopup,
        setShowAuthPopup,

        pendingCheckout,
        setPendingCheckout,

        triggerCheckout,
        setTriggerCheckout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};