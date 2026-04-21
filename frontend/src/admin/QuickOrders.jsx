import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Sidebar from "./Sidebar.jsx";
import Navbar from "../component/Navbar.jsx";
import Footer from "../component/Footer.jsx";
import { FiTrash2, FiEdit, FiPrinter } from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvoicePrint from "./InvoicePrint.jsx";

import "./quickOrder.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const QuickOrders = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]); // ✅ Added users state for dropdown
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);

  const invoiceRef = useRef();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, userRes] = await Promise.all([
        axios.get(`${API_BASE}/api/quick-orders`, getAuthHeaders()),
        axios.get(`${API_BASE}/api/user/all`, getAuthHeaders()) // ✅ Fetching users for dropdown
      ]);
      setOrders(orderRes.data.orders || []);
      setUsers(userRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= DELETE ================= */
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this order?")) return;
    try {
      await axios.delete(`${API_BASE}/api/quick-orders/${id}`, getAuthHeaders());
      setOrders((prev) => prev.filter((o) => o._id !== id));
      if (selectedOrder?._id === id) setSelectedOrder(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  /* ================= CALCULATE ================= */
  const calculateTotal = (items) => {
    return items.reduce((total, item) => {
      const base = (Number(item.quantity) || 0) * (Number(item.price) || 0);
      const discount = (base * (Number(item.discountPercent) || 0)) / 100;
      const afterDiscount = base - discount;
      const gst = (afterDiscount * (Number(item.gstPercent) || 0)) / 100;
      return total + afterDiscount + gst;
    }, 0);
  };

  /* ================= UPDATE ================= */
  const handleUpdate = async () => {
    try {
      const updatedTotal = calculateTotal(selectedOrder.items);
      const payload = {
        customerName: selectedOrder.customerName,
        phone: selectedOrder.phone,
        address: selectedOrder.address,
        gstNumber: selectedOrder.gstNumber,
        items: selectedOrder.items,
        totalAmount: updatedTotal,
        status: selectedOrder.status,
        assignedTo: typeof selectedOrder.assignedTo === 'object'
          ? selectedOrder.assignedTo?._id
          : selectedOrder.assignedTo,
      };

      const res = await axios.put(
        `${API_BASE}/api/quick-orders/${selectedOrder._id}`,
        payload,
        getAuthHeaders()
      );

      if (uploadFiles.length > 0) {
        const uploadedUrls = [];
        for (const file of uploadFiles) {
          const formData = new FormData();
          formData.append("image", file);
          const uploadRes = await axios.post(`${API_BASE}/api/upload`, formData, {
            headers: { ...getAuthHeaders().headers, "Content-Type": "multipart/form-data" },
          });
          if (uploadRes.data.url) uploadedUrls.push(uploadRes.data.url);
        }
        await axios.post(
          `${API_BASE}/api/quick-orders/${selectedOrder._id}/images`,
          { images: uploadedUrls },
          getAuthHeaders()
        );
      }

      alert("Order updated successfully!");
      setEditMode(false);
      setUploadFiles([]);
      fetchData(); 
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update order.");
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...selectedOrder.items];
    updatedItems[index][field] = field === "productName" ? value : Number(value);
    setSelectedOrder({ ...selectedOrder, items: updatedItems });
  };

  /* ================= PDF & PRINT ================= */
  const downloadPDF = async (order, e) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setTimeout(async () => {
      if (!invoiceRef.current) return;
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      pdf.save(`Invoice-${order._id.slice(-6)}.pdf`);
    }, 500);
  };

  const printInvoice = (order, e) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setTimeout(() => {
      if (!invoiceRef.current) return;
      const content = invoiceRef.current.innerHTML;
      const win = window.open("", "", "width=900,height=700");
      win.document.write(`<html><head><title>Print Invoice</title></head><body>${content}</body></html>`);
      win.document.close();
      win.focus();
      win.print();
      win.close();
    }, 500);
  };

  const filtered = orders.filter((o) =>
    ((o.customerName || "") + (o.phone || ""))
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ordersPage">
      <Sidebar />
      <main className="mainContent">
        <Navbar />
        <div className="header">
          <h1>Quick Orders</h1>
        </div>

        <input
          placeholder="Search by name or phone..."
          className="searchInput"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="tableContainer">
          <table className="ordersTable">
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created By</th> {/* ✅ ADDED COLUMN */}
                <th>Assigned</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9">Loading...</td></tr> // ✅ UPDATED COLSPAN
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9">No Orders Found</td></tr> // ✅ UPDATED COLSPAN
              ) : (
                filtered.map((o, i) => (
                  <tr
                    key={o._id}
                    className="clickableRow"
                    onClick={() => {
                      setSelectedOrder(o);
                      setEditMode(true);
                    }}
                  >
                    <td>{i + 1}</td>
                    <td>{o._id?.slice(-6)}</td>
                    <td>{o.customerName}</td>
                    <td>{o.phone}</td>
                    <td>
                      <span className={`statusBadge ${o.status || 'pending'}`}>
                        {o.status || "pending"}
                      </span>
                    </td>
                    <td>👤 {o.createdBy?.name || "N/A"}</td> {/* ✅ SHOW STAFF NAME */}
                    <td>🛠️ {o.assignedTo?.name || "Unassigned"}</td>
                    <td>₹{o.totalAmount?.toFixed(2)}</td>
                    <td>
                      <button className="actionBtn" onClick={(e) => downloadPDF(o, e)}>📄</button>
                      <button className="actionBtn" onClick={(e) => printInvoice(o, e)}><FiPrinter /></button>
                      <button className="actionBtn" onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); setEditMode(true); }}><FiEdit /></button>
                      <button className="actionBtn delete" onClick={(e) => handleDelete(o._id, e)}><FiTrash2 /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Footer />
      </main>

      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        {selectedOrder && (
          <div ref={invoiceRef}>
            <InvoicePrint order={selectedOrder} />
          </div>
        )}
      </div>

      {selectedOrder && editMode && (
        <div className="modalOverlay">
          <div className="modalBox">
            <h3>Edit Order</h3>
            <div className="modalContent">
              <label>Customer Name</label>
              <input value={selectedOrder.customerName} onChange={(e) => setSelectedOrder({ ...selectedOrder, customerName: e.target.value })} />

              <label>Phone</label>
              <input value={selectedOrder.phone} onChange={(e) => setSelectedOrder({ ...selectedOrder, phone: e.target.value })} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label>Address</label>
                  <input value={selectedOrder.address || ""} onChange={(e) => setSelectedOrder({ ...selectedOrder, address: e.target.value })} />
                </div>
                <div>
                  <label>GST Number</label>
                  <input value={selectedOrder.gstNumber || ""} onChange={(e) => setSelectedOrder({ ...selectedOrder, gstNumber: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "10px" }}>
                <div>
                  <label>Status</label>
                  <select
                    value={selectedOrder.status || "pending"}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, status: e.target.value })}
                  >
                    <option value="pending">pending</option>
                    <option value="assigned">assigned</option>
                    <option value="in_progress">in_progress</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
                <div>
                  <label>Assign Staff</label>
                  {/* ✅ REPLACE INPUT WITH DROPDOWN */}
                  <select
                    value={typeof selectedOrder.assignedTo === "object" 
                      ? selectedOrder.assignedTo?._id || "" 
                      : selectedOrder.assignedTo || ""}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, assignedTo: e.target.value })}
                  >
                    <option value="">Select Staff</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "15px" }}>
                <label>Work Images / Attachments</label>
                <input
                  type="file"
                  multiple
                  className="fileInput"
                  onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                />
              </div>

              <h4 style={{ margin: "20px 0 10px", color: "var(--primary-color)" }}>Items</h4>
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="itemBlock">
                  <input placeholder="Product Name" value={item.productName} onChange={(e) => handleItemChange(i, "productName", e.target.value)} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <small>Qty</small>
                      <input type="number" value={item.quantity} onChange={(e) => handleItemChange(i, "quantity", e.target.value)} />
                    </div>
                    <div>
                      <small>Price</small>
                      <input type="number" value={item.price} onChange={(e) => handleItemChange(i, "price", e.target.value)} />
                    </div>
                    <div>
                      <small>Disc%</small>
                      <input type="number" value={item.discountPercent} onChange={(e) => handleItemChange(i, "discountPercent", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: "15px", textAlign: "right" }}>
                <span className="amountText">New Total: ₹{calculateTotal(selectedOrder.items).toFixed(2)}</span>
              </div>
            </div>

            <div className="modalActions">
              <button className="goldBtn" onClick={handleUpdate}>Save Changes</button>
              <button className="goldBtn" onClick={() => { setEditMode(false); setUploadFiles([]); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickOrders;