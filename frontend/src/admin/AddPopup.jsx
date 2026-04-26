import React, { useState, useEffect, useRef } from "react";
import "./AddPopup.css";

const AddPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [offerLink, setOfferLink] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [popups, setPopups] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    try {
      const res = await fetch("https://https://bhavya-event-mart.onrender.com/api/popups");
      const data = await res.json();
      if (res.ok) setPopups(Array.isArray(data) ? data : [data]);
    } catch (err) {
      console.error("❌ Error fetching offers:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) setImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("link", offerLink);

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (imageUrl.trim() !== "") {
        formData.append("imageUrl", imageUrl);
      }

      const res = await fetch("https://https://bhavya-event-mart.onrender.com/api/popups", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("✅ Offer Added Successfully!");
        setTitle(""); setDescription(""); setOfferLink(""); setImageFile(null); setImageUrl("");
        fetchPopups();
        onClose();
      }
    } catch (err) {
      alert("Error adding popup.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("🗑️ Delete this offer?")) return;
    try {
      const res = await fetch(`https://https://bhavya-event-mart.onrender.com/api/popups/${id}`, { method: "DELETE" });
      if (res.ok) setPopups((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="ap-overlay">
      <div className="ap-modal-card">
        <button className="ap-close-btn" onClick={onClose}>&times;</button>

        <h2 className="ap-title">Manage Offer Popups</h2>
        <p className="ap-subtitle">Upload or edit promotional offers for your homepage.</p>

        <form className="ap-form" onSubmit={handleSubmit}>
          <label className="ap-label">Offer Title</label>
          <input className="ap-input" type="text" placeholder="e.g. Summer Sale" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label className="ap-label">Message</label>
          <textarea className="ap-textarea" placeholder="Describe your offer..." value={description} onChange={(e) => setDescription(e.target.value)} required />

          <label className="ap-label">Image</label>
          <div className="ap-upload-box" onClick={() => fileInputRef.current.click()} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
            {imageFile || imageUrl ? (
              <img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} alt="Preview" className="ap-preview-img" />
            ) : <p><strong>Click to upload</strong> or drag and drop image</p>}
          </div>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />

          <label className="ap-label">Or Image URL</label>
          <input className="ap-input" type="text" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

          <label className="ap-label">Action Link</label>
          <input className="ap-input" type="text" placeholder="https://..." value={offerLink} onChange={(e) => setOfferLink(e.target.value)} />

          <div className="ap-actions">
            <button type="button" className="ap-btn ap-btn-sec" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="ap-btn ap-btn-pri" disabled={loading}>{loading ? "Saving..." : "Save Popup"}</button>
          </div>
        </form>

        <div className="ap-list">
          <h3 className="ap-list-title">Existing Offers</h3>
          <div className="ap-table-container">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {popups.map((p) => (
                  <tr key={p._id}>
                    <td><img src={p.imageUrl} alt="" className="ap-thumb" /></td>
                    <td className="ap-text-truncate">{p.title}</td>
                    <td><button className="ap-btn-danger" onClick={() => handleDelete(p._id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPopup;