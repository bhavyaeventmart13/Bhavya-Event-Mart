// ===========================================
// src/admin/Settings.jsx — FINAL FIXED VERSION
// Consistent preview + list + delete for all
// ===========================================

import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Navbar from "../component/Navbar.jsx";
import Footer from "../component/Footer.jsx";
import "./Settings.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Settings() {
  // ==========================
  // STATE
  // ==========================
  const [banners, setBanners] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [homeCategories, setHomeCategories] = useState([]);
  const [homeVideos, setHomeVideos] = useState([]);
  const [videoThumbFile, setVideoThumbFile] = useState(null);
  const [videoThumbPreview, setVideoThumbPreview] = useState(null);

  // Blogs State
  const [blogs, setBlogs] = useState([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [simpleContent, setSimpleContent] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [blocks, setBlocks] = useState([]); // Kept for logic consistency

  // Upload files
  const [bannerFile, setBannerFile] = useState(null);
  const [bestFile, setBestFile] = useState(null);
  const [catFile, setCatFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  // Previews
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bestPreview, setBestPreview] = useState(null);
  const [catPreview, setCatPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Inputs
  const [bestName, setBestName] = useState("");
  const [bestPrice, setBestPrice] = useState("");
  const [catName, setCatName] = useState("");
  const [catLink, setCatLink] = useState("");

  const token = localStorage.getItem("token");

  // ==========================
  // LOAD DATA
  // ==========================
  useEffect(() => {
    loadHomeContent();
    loadBlogs();
  }, []);

  const loadHomeContent = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/home`);
      const data = await res.json();
      setBanners(data.banners || []);
      setBestSellers(data.bestSellers || []);
      setHomeCategories(data.homeCategories || []);
      setHomeVideos(data.homeVideos || []);
    } catch (err) {
      console.error("Failed to load homepage data", err);
    }
  };

  const loadBlogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs`);
      const data = await res.json();
      if (Array.isArray(data)) setBlogs(data);
      else if (data.blogs) setBlogs(data.blogs);
    } catch (err) {
      console.error("Failed to load blogs", err);
      setBlogs([]);
    }
  };

  // ==========================
  // FILE UPLOAD HELPER
  // ==========================
  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  // ==========================
  // ACTIONS (Banner, Seller, Cat, Video)
  // ==========================
  const addBanner = async () => {
    if (!bannerFile) return alert("Choose an image first");
    const imageUrl = await uploadFile(bannerFile);
    await fetch(`${API_BASE_URL}/api/home/banner`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ imageUrl }),
    });
    setBannerFile(null); setBannerPreview(null); loadHomeContent();
  };

  const deleteBanner = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    await fetch(`${API_BASE_URL}/api/home/banner/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadHomeContent();
  };

  const addBestSeller = async () => {
    if (!bestFile || !bestName) return alert("Name & image required");
    const imageUrl = await uploadFile(bestFile);
    await fetch(`${API_BASE_URL}/api/home/bestseller`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: bestName, price: bestPrice, imageUrl }),
    });
    setBestFile(null); setBestPreview(null); setBestName(""); setBestPrice(""); loadHomeContent();
  };

  const deleteBestSeller = async (id) => {
    if (!window.confirm("Delete this best seller?")) return;
    await fetch(`${API_BASE_URL}/api/home/bestseller/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadHomeContent();
  };

  const addCategory = async () => {
    if (!catFile || !catName) return alert("Name & image required");
    const imageUrl = await uploadFile(catFile);
    await fetch(`${API_BASE_URL}/api/home/category`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: catName, link: catLink, imageUrl }),
    });
    setCatFile(null); setCatPreview(null); setCatName(""); setCatLink(""); loadHomeContent();
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    await fetch(`${API_BASE_URL}/api/home/category/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadHomeContent();
  };

  const addVideo = async () => {
    if (!videoFile || !videoThumbFile) return alert("Video & thumbnail required");
    const videoUrl = await uploadFile(videoFile);
    const thumbnailUrl = await uploadFile(videoThumbFile);
    await fetch(`${API_BASE_URL}/api/home/video`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ videoUrl, thumbnailUrl }),
    });
    setVideoFile(null); setVideoThumbFile(null); setVideoPreview(null); setVideoThumbPreview(null);
    loadHomeContent();
  };

  const deleteVideo = async (id) => {
    if (!window.confirm("Delete this video?")) return;
    await fetch(`${API_BASE_URL}/api/home/video/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadHomeContent();
  };

  // ==========================
  // BLOG LOGIC (FIXED)
  // ==========================
  const publishSimpleBlog = async () => {
    if (!title || !simpleContent.trim()) {
      return alert("Blog title and content required");
    }

    try {
      let coverImageUrl = "";
      if (coverFile) {
        coverImageUrl = await uploadFile(coverFile);
      }

      const newBlocks = [
        {
          type: "text",
          content: simpleContent,
          order: 0,
        },
      ];

      await fetch(`${API_BASE_URL}/api/blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          slug,
          coverImage: coverImageUrl,
          blocks: newBlocks,
        }),
      });

      // reset
      setTitle("");
      setSlug("");
      setSimpleContent("");
      setCoverFile(null);
      setCoverPreview(null);
      loadBlogs();
      alert("Blog published successfully!");
    } catch (err) {
      console.error("Publishing error", err);
    }
  };

  const deleteBlog = async (id) => {
    if (!window.confirm("Delete this blog?")) return;
    await fetch(`${API_BASE_URL}/api/blogs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadBlogs();
  };

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="admin-dashboard-wrapper">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="admin-settings-page fade-in">
          <h2>Website Settings</h2>
          <p className="subtitle">Manage homepage content and blogs.</p>

          <div className="settings-grid">
            {/* VIDEO SECTION */}
            <div className="settings-card">
              <h3>Homepage Video</h3>
              <label className="upload-label">
                Choose Video File
                <input type="file" accept="video/*" hidden onChange={(e) => {
                  setVideoFile(e.target.files[0]);
                  setVideoPreview(URL.createObjectURL(e.target.files[0]));
                }} />
              </label>
              <label className="upload-label">
                Choose Thumbnail
                <input type="file" accept="image/*" hidden onChange={(e) => {
                  setVideoThumbFile(e.target.files[0]);
                  setVideoThumbPreview(URL.createObjectURL(e.target.files[0]));
                }} />
              </label>
              {(videoPreview || videoThumbPreview) && (
                <div className="preview-card">
                  <img src={videoThumbPreview || videoPreview} className="preview-img" alt="Preview" />
                  <button className="delete-btn" onClick={() => {
                    setVideoFile(null); setVideoThumbFile(null); setVideoPreview(null); setVideoThumbPreview(null);
                  }}>✕</button>
                </div>
              )}
              <button className="save-btn" onClick={addVideo}>Save Video</button>
              <div className="preview-grid">
                {homeVideos.map((v) => (
                  <div key={v._id} className="preview-card">
                    <img src={v.thumbnailUrl} className="preview-img" alt="Video Thumb" />
                    <button className="delete-btn" onClick={() => deleteVideo(v._id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* BANNER SECTION */}
            <div className="settings-card">
              <h3>Home Page Banner</h3>
              <label className="upload-label">
                Choose Banner Image
                <input type="file" accept="image/*" hidden onChange={(e) => {
                  setBannerFile(e.target.files[0]);
                  setBannerPreview(URL.createObjectURL(e.target.files[0]));
                }} />
              </label>
              {bannerPreview && (
                <div className="preview-card">
                  <img src={bannerPreview} className="preview-img" alt="Banner Preview" />
                  <button className="delete-btn" onClick={() => { setBannerFile(null); setBannerPreview(null); }}>✕</button>
                </div>
              )}
              <button className="save-btn" onClick={addBanner}>Save Banner</button>
              <div className="preview-grid">
                {banners.map((b) => (
                  <div key={b._id} className="preview-card">
                    <img src={b.imageUrl} className="preview-img" alt="Banner" />
                    <button className="delete-btn" onClick={() => deleteBanner(b._id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* BEST SELLERS */}
            <div className="settings-card">
              <h3>Best Sellers</h3>
              <input className="text-input" placeholder="Product Name" value={bestName} onChange={(e) => setBestName(e.target.value)} />
              <input className="text-input" placeholder="Price" value={bestPrice} onChange={(e) => setBestPrice(e.target.value)} />
              <label className="upload-label">
                Choose Image
                <input type="file" accept="image/*" hidden onChange={(e) => {
                  setBestFile(e.target.files[0]);
                  setBestPreview(URL.createObjectURL(e.target.files[0]));
                }} />
              </label>
              {bestPreview && (
                <div className="preview-card">
                  <img src={bestPreview} className="preview-img" alt="Best Seller Preview" />
                  <button className="delete-btn" onClick={() => { setBestFile(null); setBestPreview(null); }}>✕</button>
                </div>
              )}
              <button className="save-btn" onClick={addBestSeller}>Save Best Seller</button>
              <div className="preview-grid">
                {bestSellers.map((item) => (
                  <div key={item._id} className="preview-card">
                    <img src={item.imageUrl} className="preview-img" alt="Item" />
                    <p className="preview-title">{item.name}</p>
                    <button className="delete-btn" onClick={() => deleteBestSeller(item._id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* CATEGORIES */}
            <div className="settings-card">
              <h3>Home Categories</h3>
              <input className="text-input" placeholder="Category Name" value={catName} onChange={(e) => setCatName(e.target.value)} />
              <input className="text-input" placeholder="Link" value={catLink} onChange={(e) => setCatLink(e.target.value)} />
              <label className="upload-label">
                Choose Image
                <input type="file" accept="image/*" hidden onChange={(e) => {
                  setCatFile(e.target.files[0]);
                  setCatPreview(URL.createObjectURL(e.target.files[0]));
                }} />
              </label>
              {catPreview && (
                <div className="preview-card">
                  <img src={catPreview} className="preview-img" alt="Category Preview" />
                  <button className="delete-btn" onClick={() => { setCatFile(null); setCatPreview(null); }}>✕</button>
                </div>
              )}
              <button className="save-btn" onClick={addCategory}>Save Category</button>
              <div className="preview-grid">
                {homeCategories.map((cat) => (
                  <div key={cat._id} className="preview-card">
                    <img src={cat.imageUrl} className="preview-img" alt="Category" />
                    <p className="preview-title">{cat.name}</p>
                    <button className="delete-btn" onClick={() => deleteCategory(cat._id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* BLOG SECTION (FIXED) */}
            <div className="settings-card">
              <h3>Create Blog</h3>
              <input
                className="text-input"
                placeholder="Blog Title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }}
              />

              <label className="upload-label">
                Upload Cover Image (optional)
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setCoverFile(file);
                    setCoverPreview(URL.createObjectURL(file));
                  }}
                />
              </label>

              {coverPreview && (
                <div className="preview-card" style={{ marginBottom: "12px" }}>
                  <img src={coverPreview} className="preview-img" alt="Cover" />
                  <button className="delete-btn" onClick={() => { setCoverFile(null); setCoverPreview(null); }}>✕</button>
                </div>
              )}

              <textarea
                className="text-input"
                rows={8}
                placeholder="Write your blog content here..."
                value={simpleContent}
                onChange={(e) => setSimpleContent(e.target.value)}
              />

              <button className="save-btn" onClick={publishSimpleBlog}>
                Publish Blog
              </button>

              <div className="preview-grid" style={{ marginTop: "20px" }}>
                {blogs.map((b) => (
                  <div key={b._id} className="preview-card">
                    <p className="preview-title">{b.title}</p>
                    <button className="delete-btn" onClick={() => deleteBlog(b._id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}