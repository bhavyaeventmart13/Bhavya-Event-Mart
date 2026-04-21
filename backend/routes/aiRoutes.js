import express from "express";
import OpenAI from "openai";

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // make sure your .env has OPENAI_API_KEY
});

// ==========================
// GENERATE DESCRIPTION
// ==========================
router.post("/generate-description", async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate prompt
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ message: "Prompt is required" });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",        // cheaper & faster for product descriptions
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,              // limit output length
    });

    const generatedText = completion.choices[0]?.message?.content?.trim();

    if (!generatedText) {
      return res.status(500).json({ message: "AI returned empty response" });
    }

    // Send result
    res.json({ generatedText });
  } catch (err) {
    console.error("❌ AI Generation Error:", err);

    // Detect specific errors
    if (err?.response?.status === 401) {
      return res.status(401).json({ message: "Invalid API key" });
    } else if (err?.response?.status === 429) {
      return res.status(429).json({ message: "Rate limit exceeded or insufficient credits" });
    }

    res.status(500).json({ message: "AI generation failed", error: err.message });
  }
});

export default router;
