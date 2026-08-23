const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

app.post('/api/interpret', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const base64File = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const prompt = `You are a medical lab report interpreter. Look at this lab report and:

1. Extract every test value you can find (name, result, unit, reference/normal range).
2. For each value, determine if it's "normal" or "abnormal" based on the reference range.
3. Write a plain-language explanation of what each abnormal value means.
4. Give general health tips relevant to the results.
5. Flag any critical/dangerous values that need urgent attention.

Respond ONLY with valid JSON, no markdown formatting, no backticks, in this exact structure:
{
  "summary": "2-3 sentence plain-language overview of overall results",
  "values": [
    {
      "name": "Hemoglobin",
      "result": "12.5",
      "unit": "g/dL",
      "range": "13.5-17.5",
      "status": "abnormal",
      "explanation": "short explanation of what this means"
    }
  ],
  "healthTips": ["tip 1", "tip 2"],
  "criticalWarnings": ["any urgent flags, or empty array if none"]
}`;

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64File,
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const rawText = result.response.text().trim();

    // Strip accidental markdown fences just in case
    const cleaned = rawText.replace(/^```json\s*|```\s*$/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse Gemini response as JSON:', rawText);
      return res.status(502).json({
        error: 'Could not parse interpretation. Try a clearer image/PDF.',
      });
    }

    res.json(parsed);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
