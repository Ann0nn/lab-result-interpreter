# VitalScope — Lab Results Interpreter

A health app that interprets lab test results using AI. Upload your lab report (PDF or image), and the app extracts every test value, flags what's normal or abnormal against its reference range, and explains abnormal results in plain language.

**Live demo:** https://vitalscope.netlify.app

> ⚠️ VitalScope explains results — it is not medical advice and does not replace a doctor.

## Project Structure

```
lab-result-interpreter/
├── backend/         # Node.js + Express server
│   ├── server.js    # Main server file (POST /api/interpret)
│   ├── package.json
│   └── .env.example
└── frontend/        # React app
    ├── src/
    │   ├── components/
    │   │   ├── UploadForm.js
    │   │   └── ResultDisplay.js
    │   ├── App.js
    │   └── index.js
    ├── public/
    │   └── index.html
    └── package.json
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (Google AI Studio)
npm run dev
```

Server runs on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

App opens on `http://localhost:3000`

To point the frontend at a different backend, set `REACT_APP_API_URL` before building/starting (defaults to `http://localhost:5000`).

## Environment Variables

Create a `.env` file in the `backend` folder:

```
PORT=5000
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
```

## API Endpoints

### GET /health
Returns `{ "status": "Backend is running" }`.

### POST /api/interpret
Upload a lab report file for interpretation.

**Request:**
- Form data with `file` field (PDF, JPEG or PNG, max 10MB)

**Response:**
```json
{
  "summary": "1-2 sentence plain-language overview",
  "values": [
    {
      "name": "Hemoglobin",
      "result": "12.5",
      "unit": "g/dL",
      "range": "13.5-17.5",
      "status": "abnormal",
      "explanation": "short plain-language note (abnormal values only)"
    }
  ],
  "healthTips": ["up to 3 short, general tips"],
  "criticalWarnings": ["genuinely urgent flags only, usually empty"]
}
```

If the upload isn't a lab report, or no test values can be read, the API returns a `422` with a human-readable `error` message instead.

## How it works

- The uploaded file is sent (in memory only — nothing is stored) to Google's Gemini vision model with a strict extraction prompt.
- The model returns structured JSON: every value, its reference range, a normal/abnormal call, and a one-line explanation for abnormal values only.
- Transient Gemini errors (503/429) are retried automatically with a short backoff; other failures map to friendly error messages.

## Tech Stack

- **Frontend:** React 18 (deployed on Netlify)
- **Backend:** Node.js + Express (deployed on Render)
- **AI:** Google Gemini API (`@google/generative-ai`)
- **File Upload:** Multer (memory storage)
- **Styling:** CSS

## Next Steps

1. Rate limiting on /api/interpret before wider public use
2. Saved history of past reports (per user)
3. More sample reports in testing (different labs, formats, languages)
