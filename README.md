# Lab Results Interpreter

A health app that interprets lab test results using AI. Upload your lab report (PDF or image), and the app will extract values and provide interpretation.

## Project Structure

```
health-app/
├── backend/         # Node.js + Express server
│   ├── server.js   # Main server file
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
# Edit .env and add your ANTHROPIC_API_KEY
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

## Environment Variables

Create a `.env` file in the `backend` folder:

```
PORT=5000
ANTHROPIC_API_KEY=your_api_key_here
```

## API Endpoints

### POST /api/interpret
Upload a lab report file for interpretation.

**Request:**
- Form data with `file` field (PDF or image)

**Response:**
```json
{
  "interpretation": "...",
  "values": [
    {
      "name": "Hemoglobin",
      "result": "12.5",
      "unit": "g/dL",
      "status": "abnormal"
    }
  ]
}
```

## Tech Stack

- **Frontend:** React 18
- **Backend:** Node.js + Express
- **AI:** Anthropic Claude API
- **File Upload:** Multer
- **Styling:** CSS

## Next Steps

1. Implement the Claude API integration in the backend
2. Test with sample lab reports
3. Add error handling and validation
4. Deploy frontend and backend
