import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "../component/Navbar";
import "./CustomerRequests.css";
import Footer from "../component/Footer";

const CustomerRequests = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const API = import.meta.env.VITE_API_URL;

  // ================= FETCH =================
  const fetchUploads = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/user-uploads/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setUploads(data.uploads || []);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch uploads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  // ================= STATUS UPDATE =================
  const updateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure to ${status}?`)) return;

    const token = localStorage.getItem("token");
    if (!token) return alert("Login required");

    setActionLoading(id);

    try {
      const res = await fetch(`${API}/api/user-uploads/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ ${status}`);

        setUploads((prev) =>
          prev.map((u) =>
            u._id === id ? { ...u, status } : u
          )
        );
      } else {
        alert(data.message);
      }
    } catch {
      alert("Error updating status");
    } finally {
      setActionLoading(null);
    }
  };

  // ================= DELETE =================
  const deleteUpload = async (id) => {
    if (!window.confirm("Delete this request?")) return;

    const token = localStorage.getItem("token");
    if (!token) return alert("Login required");

    setActionLoading(id);

    try {
      const res = await fetch(`${API}/api/user-uploads/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert("Deleted successfully");
        setUploads((prev) => prev.filter((u) => u._id !== id));
      } else {
        alert(data.message);
      }
    } catch {
      alert("Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ================= STATUS COLOR =================
  const getStatusClass = (status) => {
    switch (status) {
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  return (
    <div className="communication-page"> {/* ✅ FIXED */}
      <Sidebar />

      <main className="main-content"> {/* ✅ FIXED */}
        <Navbar />

        <div className="customer-header">
          <h2>Customer Review</h2>
          <p>Total Requests: {uploads.length}</p>
        </div>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : uploads.length === 0 ? (
          <p className="empty">No requests found</p>
        ) : (
          <div className="customer-table-wrapper">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Note</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {uploads.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <img
                        src={u.imageUrl}
                        alt="upload"
                        className="upload-image"
                        onClick={() => setPreviewImage(u.imageUrl)}
                        style={{ cursor: "pointer" }}
                        onError={(e) =>
                          (e.target.src = "https://via.placeholder.com/80")
                        }
                      />
                    </td>

                    <td>{u.uploadedBy || "Anonymous"}</td>
                    <td>{u.phone || "-"}</td>
                    <td>{u.note || "-"}</td>

                    <td>
                      <span className={getStatusClass(u.status)}>
                        {u.status}
                      </span>
                    </td>

                    <td className="action-buttons">
                      <button
                        className="approve-btn"
                        disabled={actionLoading === u._id}
                        onClick={() => updateStatus(u._id, "approved")}
                      >
                        Approve
                      </button>

                      <button
                        className="reject-btn"
                        disabled={actionLoading === u._id}
                        onClick={() => updateStatus(u._id, "rejected")}
                      >
                        Reject
                      </button>

                      <button
                        className="delete-btn"
                        disabled={actionLoading === u._id}
                        onClick={() => deleteUpload(u._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* IMAGE PREVIEW */}
        {previewImage && (
          <div
            className="image-preview-overlay"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="image-preview-box"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={previewImage} alt="Preview" />
              <button
                className="close-preview"
                onClick={() => setPreviewImage(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerRequests;