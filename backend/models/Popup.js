import mongoose from "mongoose";

const popupSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String }, // GCS URL of the uploaded image
  link: { type: String }, // optional offer/product link
  isActive: { type: Boolean, default: true },
});

export default mongoose.model("Popup", popupSchema);
