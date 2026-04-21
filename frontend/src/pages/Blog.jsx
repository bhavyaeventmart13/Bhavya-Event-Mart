import { useEffect, useState } from "react";
import Navbar from "../component/Navbar";
import Footer from "../component/Footer";
import CategoriesSidebar from "../component/CategoriesSidebar";
import BlogRenderer from "../component/blog/BlogRenderer";
import "../styles/Blog.css";

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/blogs`);
        const data = await res.json();
        setBlogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load blogs:", error);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };
    loadBlogs();
  }, []);

  return (
    <>
      <Navbar />

      <div className="page-with-sidebar">
        <CategoriesSidebar />

        <main className="blog-page">
          <div className="blog-content-wrapper">
            <h1 className="blog-heading">Blogs</h1>

            {loading && <p className="blog-loading">Loading blogs...</p>}

            {!loading && !blogs.length && (
              <p className="blog-empty">No blogs published yet.</p>
            )}

            {!loading &&
              blogs.map((blog) => (
                <article key={blog._id} className="blog-full-card">
                  {/* COVER IMAGE */}
                  {blog.coverImage && (
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="blog-cover"
                    />
                  )}

                  {/* TITLE */}
                  <h2 className="blog-title">{blog.title}</h2>

                  {/* CONTENT BOX */}
                  <div className="blog-content-box">
                    {/* Ensure BlogRenderer internal elements use the .blog-text class */}
                    <BlogRenderer blocks={blog.blocks} />
                  </div>
                </article>
              ))}
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
};

export default Blog;