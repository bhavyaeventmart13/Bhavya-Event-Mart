import mongoose from "mongoose";

const blockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["text", "image"],
    required: true,
  },
  content: String,            // for text
  images: [{ url: String }],  // for image
  order: Number,
});

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    coverImage: String,
    blocks: [blockSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema);
