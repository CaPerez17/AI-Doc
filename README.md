# AI Doctor Assistant

An AI-powered medical assistant that generates diagnostic insights from audio transcriptions or direct text input using OpenAI's Whisper and GPT models.

## Quick Start

### Prerequisites

- **Node.js** >=20.0.0
- **Firebase CLI** (`npm install -g firebase-tools`)
- **npm** or **pnpm**
- **OpenAI API Key**

### Commands to Start Locally

```bash
# Clone and install dependencies
git clone https://github.com/CaPerez17/AI-Doc.git
cd AI-Doc
npm install

# Configure OpenAI API key
firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY"
cd functions && firebase functions:config:get > .runtimeconfig.json && cd ..

# Start emulators and frontend
firebase emulators:start --only functions,firestore,storage --project gressusapp &
npm --prefix frontend run dev -- --port 5175
```

**Alternative:** Use the automated setup script:

```bash
chmod +x LOCAL_SETUP.sh
./LOCAL_SETUP.sh
```

Access the application at: http://localhost:5175

## ⚠️ Security & Credentials Management

### Important Files to Keep Secure

The following files contain sensitive information and are automatically excluded from version control:

- `functions/.runtimeconfig.json` - Local Firebase Functions config
- `functions/credentials.json` - Firebase service account credentials  
- `functions/*firebase-adminsdk*.json` - Firebase Admin SDK keys
- `*service-account*.json` - Google Cloud service account files

### If You Need Firebase Admin Credentials

For advanced features requiring Firebase Admin SDK:

1. **Generate Service Account Key:**
   ```bash
   # Go to Firebase Console → Project Settings → Service Accounts
   # Click "Generate new private key" and download the JSON file
   ```

2. **Place Securely:**
   ```bash
   # Save the file as functions/credentials.json (already git-ignored)
   # This file will NOT be committed to version control
   ```

3. **Use in Your Code:**
   ```typescript
   import * as admin from 'firebase-admin';
   const serviceAccount = require('./credentials.json');
   
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });
   ```

### What Happens if Credentials are Missing?

The application will work fine without `credentials.json` for basic functionality:
- ✅ Audio transcription (OpenAI Whisper)
- ✅ Medical data extraction (OpenAI GPT)
- ✅ Diagnosis generation (OpenAI GPT)  
- ✅ Firebase Storage uploads
- ❌ Advanced admin operations (if implemented)

## API Configuration

### OpenAI Configuration

```bash
# Set your OpenAI API key
firebase functions:config:set openai.key="sk-proj-YOUR_KEY_HERE"

# Generate local runtime config for emulators
cd functions
firebase functions:config:get > .runtimeconfig.json
cd ..
```

### Google Speech-to-Text (Optional)

If using Google Speech-to-Text instead of OpenAI Whisper:

```bash
firebase functions:config:set google.speech.key="YOUR_GOOGLE_KEY"
```

## Design Decisions

- **React + Vite + Tailwind CSS**: Rapid UI development with modern tooling, hot reload, and utility-first styling
- **Firebase Functions**: Serverless backend eliminates infrastructure management, auto-scales, and integrates seamlessly with other Firebase services
- **Secure Configuration**: API keys stored via `functions.config()` and local `.runtimeconfig.json`, never committed to version control
- **Storage Emulator**: Local file uploads during development without cloud storage costs or external dependencies
- **Environment Separation**: Dev/prod isolation through Firebase project configs and local environment files
- **TypeScript Backend**: Type safety for Firebase Functions reduces runtime errors and improves developer experience
- **Reusable Middleware Layer**: Centralized middleware for CORS, validation, error handling, and metrics collection, improving code maintainability and consistency across functions

## Developer Guide

### Middleware Architecture

The application implements a reusable middleware layer that provides:

1. **CORS Handling**: Consistent cross-origin resource sharing configuration
2. **Input Validation**: Request payload validation before processing
3. **Error Handling**: Centralized error management and response formatting
4. **Metrics Collection**: Performance monitoring and usage statistics

Example usage in a function:

```typescript
import { withMiddleware } from './utils/middleware';

export const myFunction = withMiddleware(async (req, res) => {
  // Function logic here
  // Middleware handles CORS, validation, errors, and metrics
});
```

## Folder Structure

| Directory         | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `frontend/`       | React application (Vite + Tailwind CSS)     |
| `functions/`      | Firebase Functions (Node.js + TypeScript)   |
| `functions/src/`  | TypeScript source files for cloud functions |
| `functions/lib/`  | Compiled JavaScript (auto-generated)        |
| `docs/`           | Extended documentation and guides           |
| `firebase.json`   | Firebase project configuration              |
| `storage.rules`   | Firebase Storage security rules             |
| `firestore.rules` | Firestore database security rules           |

## Local Test Flow

### 1. Test Medical Data Extraction

```bash
curl -X POST http://127.0.0.1:5001/gressusapp/us-central1/extractMedicalData \
  -H "Content-Type: application/json" \
  -d '{"text":"Patient presents with headache and fever for 2 days, nausea occasionally"}'
```

Expected response:

```json
{
  "extracted_info": {
    "symptoms": ["headache", "fever", "nausea"],
    "duration": "2 days",
    "severity": "mild"
  }
}
```

### 2. Test Diagnosis Generation

```bash
curl -X POST http://127.0.0.1:5001/gressusapp/us-central1/generateDiagnosis \
  -H "Content-Type: application/json" \
  -d '{"medical_info":{"symptoms":["headache","fever"],"duration":"2 days","severity":"mild"}}'
```

Expected response:

```json
{
  "diagnosis": "Viral infection",
  "differential_diagnosis": ["Common cold", "Flu", "Tension headache"],
  "treatmentPlan": "Rest, hydration, symptom management",
  "recommendations": ["Monitor symptoms", "Seek medical attention if worsening"]
}
```

### 3. Test Audio Transcription

First upload a file via the frontend at http://localhost:5175, then:

```bash
curl -X POST http://127.0.0.1:5001/gressusapp/us-central1/transcribeAudio \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:9199/v0/b/gressusapp.appspot.com/o/audio%2Fyour-file.mp3?alt=media&token=TOKEN"}'
```

## Available Scripts

```bash
# Development
npm start                    # Setup environment and start all services
npm run serve:local         # Start emulators and frontend simultaneously
npm run setup:env           # Generate .runtimeconfig.json from Firebase config

# Building
npm run build:functions     # Compile TypeScript functions to JavaScript

# Deployment
npm run deploy              # Deploy functions to Firebase production
```

## Troubleshooting

### "OpenAI API key not configured"

```bash
firebase functions:config:get  # Check current config
firebase functions:config:set openai.key="your-key"
cd functions && firebase functions:config:get > .runtimeconfig.json
```

### "Functions failed to load"

```bash
cd functions && npm run build  # Rebuild TypeScript
firebase emulators:restart
```

### Port conflicts

```bash
lsof -ti:5001,8080,4000,4400,9199 | xargs kill -9  # Kill Firebase ports
npm run serve:local  # Restart services
```

### "Git push rejected due to secrets"

If you accidentally committed credential files:

```bash
# Add credentials to .gitignore (already included)
git rm --cached functions/credentials.json
git rm --cached functions/*firebase-adminsdk*.json
git commit -m "Remove credential files from version control"
git push origin main
```

## Security Notes

- ✅ API keys stored in Firebase Functions config, not in source code
- ✅ Local configuration files (`.runtimeconfig.json`) are git-ignored
- ✅ Credential files (`credentials.json`, service accounts) are git-ignored
- ✅ Separate development and production environments
- ⚠️ This is a demo application - always consult real medical professionals

## License

ISC License

## Disclaimer

This application is for educational and demonstration purposes only. AI-generated diagnoses should never replace professional medical advice.
