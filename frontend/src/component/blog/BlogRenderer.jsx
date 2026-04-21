const BlogRenderer = ({ blocks = [] }) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  // clone before sorting to avoid mutating state
  const sortedBlocks = [...blocks].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  return (
    <>
      {sortedBlocks.map((block, index) => {
        if (!block || !block.type) return null;

        // ================= TEXT BLOCK =================
        if (block.type === "text") {
          if (!block.content) return null;

          return (
            <p key={block._id || index} className="blog-text">
              {block.content}
            </p>
          );
        }

        // ================= IMAGE BLOCK =================
        if (block.type === "image") {
          const imageUrl = block.images?.[0]?.url;
          if (!imageUrl) return null;

          return (
            <img
              key={block._id || index}
              src={imageUrl}
              alt="Blog"
              className="blog-image"
              loading="lazy"
            />
          );
        }

        return null;
      })}
    </>
  );
};

export default BlogRenderer;
