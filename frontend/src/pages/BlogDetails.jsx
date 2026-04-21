import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import BlogRenderer from "../component/blog/BlogRenderer";
import "../styles/Blog.css"; // optional

const BlogDetails = () => {
  const { slug } = useParams();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBlog = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/blogs/slug/${slug}`
        );

        if (!res.ok) {
          throw new Error("Blog not found");
        }

        const data = await res.json();
        setBlog(data);
      } catch (err) {
        console.error(err);
        setError("Blog not found or removed.");
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [slug]);

  if (loading) return <p className="blog-loading">Loading blog...</p>;

  if (error) return <p className="blog-error">{error}</p>;

  return (
    <div className="blog-details">
      <h1 className="blog-title">{blog.title}</h1>

      <BlogRenderer blocks={blog.blocks} />
    </div>
  );
};

export default BlogDetails;
