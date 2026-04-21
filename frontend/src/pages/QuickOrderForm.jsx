import { useState } from "react";
import axios from "axios";
import "../styles/quickOrder.css";

const QuickOrderForm = () => {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    items: [{ productName: "", quantity: 1, price: 0 }],
    totalAmount: 0,
  });

  // Handle change
  const handleChange = (e, index, field) => {
    if (field) {
      const updatedItems = [...form.items];
      updatedItems[index][field] = e.target.value;

      // Auto total
      const total = updatedItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      setForm({ ...form, items: updatedItems, totalAmount: total });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  // Add new product
  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { productName: "", quantity: 1, price: 0 }],
    });
  };

  // Submit
  const handleSubmit = async () => {
    try {
      await axios.post("/api/quick-orders/add", form);
      alert("✅ Order Saved");
      window.location.reload();
    } catch (err) {
      alert("❌ Error saving order");
    }
  };

  return (
  <div className="quick-container">
    <h2>Quick Order</h2>

    <input name="customerName" placeholder="Customer Name" onChange={handleChange} />
    <input name="phone" placeholder="Phone" onChange={handleChange} />
    <input name="address" placeholder="Address" onChange={handleChange} />

    <h3>Items</h3>

    {form.items.map((item, index) => (
      <div className="item-row" key={index}>
        <input
          placeholder="Product"
          onChange={(e) => handleChange(e, index, "productName")}
        />
        <input
          type="number"
          placeholder="Qty"
          onChange={(e) => handleChange(e, index, "quantity")}
        />
        <input
          type="number"
          placeholder="Price"
          onChange={(e) => handleChange(e, index, "price")}
        />
      </div>
    ))}

    <button className="btn btn-add" onClick={addItem}>
      + Add Item
    </button>

    <div className="total">Total: ₹{form.totalAmount}</div>

    <button className="btn btn-save" onClick={handleSubmit}>
      Save Order
    </button>
  </div>
);
 
};

export default QuickOrderForm;