import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ===============================
// TRANSPORTER (FIXED)
// ===============================
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: process.env.BREVO_SMTP_PORT,
  secure: Number(process.env.BREVO_SMTP_PORT) === 465,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

// ===============================
// UI CONSTANTS & HELPERS
// ===============================
const BRAND_COLOR = "#1a1a1a";
const ACCENT_COLOR = "#f3a847"; // Amazon-style orange/gold

const buildItemsTable = (items = []) => {
  const rows = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;">
        <div style="font-weight: bold; color: #333;">${item.name || "Item"}</div>
        <div style="font-size: 12px; color: #777;">Size: ${item.size || "-"}</div>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; text-align: right; color: #333;">
        ${item.quantity || 1}
      </td>
    </tr>
  `).join("");

  return `
    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0; border-collapse: collapse;">
      <thead>
        <tr>
          <th align="left" style="font-size: 12px; text-transform: uppercase; color: #999; border-bottom: 2px solid #eeeeee; padding-bottom: 5px;">Item</th>
          <th align="right" style="font-size: 12px; text-transform: uppercase; color: #999; border-bottom: 2px solid #eeeeee; padding-bottom: 5px;">Qty</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

// ===============================
// MASTER WRAPPER (Amazon-Style Layout)
// ===============================
const getMailOptions = (to, subject, contentHtml) => ({
  from: `"Pankaj Cloth" <${process.env.SENDER_EMAIL || process.env.BREVO_SMTP_USER}>`,
  to,
  subject,
  replyTo: process.env.SENDER_EMAIL || process.env.BREVO_SMTP_USER,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f6f6f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f6f6f6; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              
              <tr>
                <td align="center" style="background-color: ${BRAND_COLOR}; padding: 30px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">PANKAJ CLOTH</h1>
                  <div style="color: ${ACCENT_COLOR}; font-size: 12px; margin-top: 5px;">Wedding Tent Industry</div>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px 30px;">
                  ${contentHtml}
                </td>
              </tr>

              <tr>
                <td style="background-color: #fafafa; padding: 30px; border-top: 1px solid #eeeeee; color: #555555; font-size: 13px; line-height: 1.6;">
                  <div style="font-weight: bold; font-size: 14px; margin-bottom: 10px; color: #333;">Visit Us</div>
                  <p style="margin: 5px 0;">Beside Chattarpur Farms, Tarodi, Nagpur, Maharashtra - 440035</p>
                  <p style="margin: 5px 0;"><strong>📞 Contact:</strong> +91 93739 78272 / +91 7499237780</p>
                  <p style="margin: 5px 0;"><strong>🕒 Hours:</strong> Mon – Sat: 10:15 AM - 9:00 PM</p>
                  <hr style="border: 0; border-top: 1px solid #dddddd; margin: 20px 0;" />
                  <p style="text-align: center; font-size: 11px; color: #999;">
                    This is an automated message regarding your order at Pankaj Cloth & Wedding Tent Industry.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
});

// ===============================
// 1. CUSTOMER — ORDER PLACED
// ===============================
export const sendOrderPlacedEmail = async (order, userEmail) => {
  try {
    const html = `
      <h2 style="color: #333; margin-top: 0;">Order Confirmed!</h2>
      <p style="color: #555;">Thank you for your order. We've received your request and are processing it now.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; border-left: 4px solid ${ACCENT_COLOR}; margin: 20px 0;">
        <strong>Order Summary:</strong>
      </div>
      ${buildItemsTable(order.items)}
      <table width="100%">
        <tr>
          <td style="font-size: 18px; font-weight: bold; color: #333;">Total Amount:</td>
          <td align="right" style="font-size: 18px; font-weight: bold; color: ${BRAND_COLOR};">₹${order.totalAmount}</td>
        </tr>
      </table>
      <p style="margin-top: 20px; font-size: 14px; color: #777;">Order Status: <span style="color: ${ACCENT_COLOR}; font-weight: bold;">${order.orderStatus}</span></p>
    `;
    await transporter.sendMail(getMailOptions(userEmail, "🧾 Order Placed Successfully", html));
    console.log("📧 Customer order email sent");
  } catch (err) {
    console.error("❌ Customer email error:", err.message);
  }
};

// ===============================
// 2. ADMIN — NEW ORDER
// ===============================
export const sendAdminNewOrderEmail = async (order) => {
  try {
    const html = `
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0;">New Order Alert 🚨</h2>
      <div style="background: #f0f0f0; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.userInfoSnapshot.name}</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.userInfoSnapshot.phone}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${order.userInfoSnapshot.email}</p>
      </div>
      ${buildItemsTable(order.items)}
      <p style="font-size: 18px; font-weight: bold;">Revenue: ₹${order.totalAmount}</p>
    `;
    await transporter.sendMail(getMailOptions(process.env.ADMIN_EMAIL, "🚨 New Order Received", html));
    console.log("📧 Admin new order email sent");
  } catch (err) {
    console.error("❌ Admin email error:", err.message);
  }
};

// ===============================
// 3. CUSTOMER — PAYMENT VERIFIED
// ===============================
export const sendPaymentVerifiedEmail = async (order, userEmail) => {
  try {
    const html = `
      <h2 style="color: #2e7d32;">Payment Verified ✅</h2>
      <p style="color: #555;">We have successfully verified your payment for the order. Your order is now being processed by our team.</p>
      <div style="margin: 25px 0; text-align: center; padding: 20px; border: 1px dashed #ccc;">
        <span style="font-size: 14px; color: #777;">Current Status</span><br/>
        <span style="font-size: 20px; font-weight: bold; color: ${BRAND_COLOR}; text-transform: uppercase;">${order.orderStatus}</span>
      </div>
    `;
    await transporter.sendMail(getMailOptions(userEmail, "✅ Payment Verified", html));
    console.log("📧 Payment verified email sent");
  } catch (err) {
    console.error("❌ Payment email error:", err.message);
  }
};

// ===============================
// 4. CUSTOMER — STATUS UPDATE
// ===============================
export const sendOrderStatusEmail = async (order, userEmail) => {
  try {
    const html = `
      <h2 style="color: #333;">Order Status Update</h2>
      <p style="color: #555;">The status of your order has been updated by our team:</p>
      <div style="background-color: ${BRAND_COLOR}; color: #fff; padding: 15px; text-align: center; border-radius: 4px; font-size: 18px; font-weight: bold; letter-spacing: 1px;">
        ${order.orderStatus.toUpperCase()}
      </div>
      <p style="margin-top: 20px; font-size: 14px; color: #777;">We will keep you posted as your order moves forward.</p>
    `;
    await transporter.sendMail(getMailOptions(userEmail, "📦 Order Status Updated", html));
    console.log("📧 Status update email sent");
  } catch (err) {
    console.error("❌ Status email error:", err.message);
  }
};

// ===============================
// 5. STAFF — ASSIGNED ORDER
// ===============================
export const sendStaffAssignmentEmail = async (order, staffEmail) => {
  try {
    const html = `
      <h2 style="color: #333;">Assignment Alert 🧑‍🔧</h2>
      <p>You have been assigned a new order to manage.</p>
      ${buildItemsTable(order.items)}
      <p><strong>Total Value:</strong> ₹${order.totalAmount}</p>
      <p style="font-size: 14px; color: #d32f2f;">Please check the dashboard for customer requirements.</p>
    `;
    await transporter.sendMail(getMailOptions(staffEmail, "🧑‍🔧 New Order Assigned", html));
    console.log("📧 Staff assignment email sent");
  } catch (err) {
    console.error("❌ Staff email error:", err.message);
  }
};