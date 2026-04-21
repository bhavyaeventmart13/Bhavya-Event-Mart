import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  order: { type: Number, default: 0 } // ✅ added for subcategory reorder
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  subcategories: [subcategorySchema],
  order: { type: Number, default: 0 },
});

export default mongoose.model("Category", categorySchema);