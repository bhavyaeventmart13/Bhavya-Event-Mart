import { useState } from "react";

const AddBlog = () => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [blocks, setBlocks] = useState([]);

  const addBlock = (type) => {
    setBlocks([
      ...blocks,
      { type, title: "", description: "", images: [], order: blocks.length },
    ]);
  };

  const saveBlog = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/blogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        blocks,
        status: "published",
      }),
    });
  };

  return (
    <div>
      <h2>Add Blog</h2>

      <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Slug" onChange={(e) => setSlug(e.target.value)} />

      <button onClick={() => addBlock("image")}>Add Image Block</button>
      <button onClick={() => addBlock("imageGrid")}>Add Image Grid</button>
      <button onClick={() => addBlock("text")}>Add Text Block</button>

      {blocks.map((block, i) => (
        <div key={i}>
          <h4>{block.type}</h4>
        </div>
      ))}

      <button onClick={saveBlog}>Publish Blog</button>
    </div>
  );
};

export default AddBlog;
