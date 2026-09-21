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

    const prompt = `You are a medical lab report interpreter. Look at this file and:

1. First check: does this actually look like a lab/medical test report with numeric results? If NOT (e.g. it's a random document, unreadable, or has no test values), respond ONLY with:
{ "notALabReport": true, "reason": "short reason why" }

2. If it IS a lab report, extract every test value you can find (name, result, unit, reference/normal range).
3. For each value, determine if it's "normal" or "abnormal" based on the reference range.
4. For ABNORMAL values only, add a one-sentence (max 20 words) plain-language explanation. Leave "explanation" as an empty string for normal values — don't explain what's already fine.
5. Give at most 3 short, general health tips (max 15 words each).
6. Flag only genuinely critical/dangerous values needing urgent attention — empty array if none.

Be concise everywhere. No filler, no repeated caveats, no long intros.

Respond ONLY with valid JSON, no markdown formatting, no backticks, in this exact structure:
{
  "summary": "1-2 sentence plain-language overview of overall results",
  "values": [
    {
      "name": "Hemoglobin",
      "result": "12.5",
      "unit": "g/dL",
      "range": "13.5-17.5",
      "status": "abnormal",
      "explanation": "short explanation, or empty string if normal"
    }
  ],
  "healthTips": ["tip 1", "tip 2"],
  "criticalWarnings": ["any urgent flags, or empty array if none"]
}`;

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      generationConfig: {
        thinkingConfig: {
          thinkingLevel: 'LOW', // this task is extraction, not deep reasoning — cuts latency significantly
        },
      },
    });

    // Gemini occasionally returns 503 "high demand" errors that are transient —
    // retry a couple times with a short backoff before giving up.
    const contentParts = [
      {
        inlineData: {
          data: base64File,
          mimeType: mimeType,
        },
      },
      prompt,
    ];

    let result;
    let lastError;
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        result = await model.generateContent(contentParts);
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        const status = err.status || err.response?.status;
        const isRetryable = status === 503 || status === 429;
        if (!isRetryable || attempt === MAX_ATTEMPTS) {
          throw err;
        }
        // brief backoff before retrying: 1s, then 2s
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }

    const rawText = result.response.text().trim();

    // Strip accidental markdown fences just in case
    const cleaned = rawText.replace(/^```json\s*|```\s*$/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse Gemini response as JSON:', rawText);
      return res.status(502).json({
        error: "Couldn't read that file properly. Try a clearer photo or a different file.",
      });
    }

    if (parsed.notALabReport) {
      return res.status(422).json({
        error: parsed.reason
          ? `This doesn't look like a lab report: ${parsed.reason}`
          : "This doesn't look like a lab report. Try uploading a clearer image or PDF of your test results.",
      });
    }

    if (!parsed.values || parsed.values.length === 0) {
      return res.status(422).json({
        error: "We couldn't detect any test values in this file. Try a clearer or more complete image.",
      });
    }

    res.json(parsed);
  } catch (error) {
    console.error('Error:', error);

    // Friendlier messages for common Gemini API failure modes
    const status = error.status || error.response?.status;
    if (status === 401 || status === 403) {
      return res.status(500).json({
        error: 'Server configuration issue (invalid API key). Contact the app owner.',
      });
    }
    if (status === 429) {
      return res.status(503).json({
        error: 'Too many requests right now. Wait a moment and try again.',
      });
    }
    if (status === 503) {
      return res.status(503).json({
        error: "The AI service is under heavy load right now. We retried a few times — please try again in a minute.",
      });
    }
    if (error.message?.toLowerCase().includes('fetch failed') || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        error: 'Could not reach the AI service. Check your internet connection and try again.',
      });
    }

    res.status(500).json({ error: 'Something went wrong while interpreting your file. Please try again.' });
  }
});

// Error handling middleware (catches multer errors like bad file type/size too)
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.message === 'Only JPEG, PNG, and PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File is too large. Max size is 10MB.' });
  }

  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});