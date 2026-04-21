import React from "react";

// 🔥 Convert number to words
const numberToWords = (num) => {
  if (!num) return "";
  return `${num} Rupees Only`;
};

const InvoicePrint = ({ order }) => {
  if (!order) return null;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN");

  return (
    <div
      id="invoice"
      style={{
        padding: 40,                 // 🔥 increased spacing
        fontFamily: "Arial, sans-serif",
        fontSize: 16,                // 🔥 increased text size
        backgroundColor: "#fff",
        color: "#000",
        minHeight: "100vh",
        lineHeight: 1.8
      }}
    >

      {/* ===== HEADER ===== */}
      <div style={{
        textAlign: "center",
        borderBottom: "2px solid #000",
        paddingBottom: 15,
        marginBottom: 25
      }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>
          bhavya event mart & WEDDING TENT INDUSTRY
        </h2>

        <p style={{ margin: "6px 0" }}>
          Beside Chattarpur Farms, Tarodi, Nagpur - 440035
        </p>

        <p style={{ margin: "6px 0" }}>
          GSTIN: 27AAUFP1093Q1Z9 | Mob: +91 7750992598
        </p>

        <h3 style={{ marginTop: 10, fontSize: 18 }}>TAX INVOICE</h3>
      </div>

      {/* ===== CUSTOMER + INVOICE INFO ===== */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 30
      }}>
        <div>
          <p><strong>Customer:</strong> {order.customerName}</p>
          <p><strong>Phone:</strong> {order.phone}</p>
          <p><strong>Address:</strong> {order.address || "-"}</p>
          <p><strong>GST:</strong> {order.gstNumber || "-"}</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p><strong>Invoice No:</strong> {order._id?.slice(-6)}</p>
          <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
          <p><strong>Place:</strong> Maharashtra</p>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: 30,
          textAlign: "center"
        }}
      >
        <thead>
          <tr>
            <th style={th}>SR</th>
            <th style={th}>PRODUCT</th>
            <th style={th}>QTY</th>
            <th style={th}>RATE</th>
            <th style={th}>DISC</th>
            <th style={th}>GST</th>
            <th style={th}>AMOUNT</th>
          </tr>
        </thead>

        <tbody>
          {order.items.map((item, i) => {
            const base = item.quantity * item.price;
            const discount = (base * item.discountPercent) / 100;
            const afterDiscount = base - discount;
            const gst = (afterDiscount * item.gstPercent) / 100;
            const final = afterDiscount + gst;

            return (
              <tr key={i}>
                <td style={td}>{i + 1}</td>
                <td style={tdBold}>{item.productName}</td>
                <td style={td}>{item.quantity}</td>
                <td style={td}>₹{item.price}</td>
                <td style={td}>{discount.toFixed(2)}</td>
                <td style={td}>{gst.toFixed(2)}</td>
                <td style={tdBold}>₹{final.toFixed(2)}</td>
              </tr>
            );
          })}

          {/* 🔥 TOTAL ROW FIXED */}
          <tr>
            <td colSpan="6" style={totalLabel}>
              TOTAL
            </td>
            <td style={totalValue}>
              ₹{order.totalAmount.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== AMOUNT IN WORDS ===== */}
      <div style={{ marginBottom: 30 }}>
        <p>
          <strong>Amount in Words:</strong>{" "}
          {numberToWords(Math.round(order.totalAmount))}
        </p>
      </div>

      {/* ===== BANK DETAILS ===== */}
      <div style={{ marginBottom: 50 }}>
        <p><strong>Bank Details:</strong></p>
        <p>Bank: Bank of India</p>
        <p>A/C No: 874625130000001</p>
        <p>IFSC: BKID0008746</p>
        <p>Branch: Kadbi Chowk, Nagpur</p>
      </div>

      {/* ===== FOOTER ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 60,
          fontWeight: "bold"
        }}
      >
        <div>Received By</div>
        <div>Prepared By</div>
        <div>Authorized Signatory</div>
      </div>
    </div>
  );
};

/* ===== TABLE STYLES ===== */

const th = {
  border: "2px solid #000",
  padding: 12,
  background: "#f2f2f2",
  fontWeight: "bold",
  fontSize: 14
};

const td = {
  border: "1px solid #000",
  padding: 12,
  fontSize: 15,
  color: "#000"
};

const tdBold = {
  ...td,
  fontWeight: "bold"
};

/* 🔥 FIXED TOTAL STYLE (BLACK + BOLD) */
const totalLabel = {
  border: "2px solid #000",
  padding: 14,
  textAlign: "right",
  fontWeight: "bold",
  fontSize: 16,
  color: "#000"
};

const totalValue = {
  border: "2px solid #000",
  padding: 14,
  fontWeight: "bold",
  fontSize: 18,
  color: "#000"   // 🔥 THIS FIXES FADED ISSUE
};

export default InvoicePrint;