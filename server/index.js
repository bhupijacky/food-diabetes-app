const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is not set in environment variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/api/analyze', async (req, res) => {
    try {
        const { prompt, imageBase64, modelName } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: "Missing image data" });
        }

        const model = genAI.getGenerativeModel({ model: modelName || "gemini-1.5-flash" });
        
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        const responseText = result.response.text();
        res.json({ text: responseText });

    } catch (error) {
        console.error("API Proxy Error:", error.message);
        res.status(500).json({ error: "Failed to analyze food", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 NutriScan Proxy running on http://localhost:${PORT}`);
});
