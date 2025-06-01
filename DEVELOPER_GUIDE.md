# Developer Guide

For full architecture details, advanced configuration, and comprehensive development documentation, see `/docs/DEVELOPER_GUIDE.md`

## Quick Reference

- **Local Setup**: Run `./LOCAL_SETUP.sh` or see `README.md`
- **API Testing**: Use curl examples in `README.md`
- **Configuration**: Firebase Functions config via `firebase functions:config:set`
- **Build**: `npm run build:functions`
- **Deploy**: `npm run deploy`

## Architecture Overview

The AI Doctor Assistant follows a serverless architecture using Firebase services with a React frontend.

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │ Firebase         │    │ OpenAI API      │
│   (Frontend)    │───▶│ Functions        │───▶│ (Whisper/GPT)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│ Firebase        │    │ Firebase         │
│ Storage         │    │ Firestore        │
└─────────────────┘    └──────────────────┘
```

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── InputForm.jsx      # Audio/text input handling
│   ├── Results.jsx        # Display processing results
│   ├── Loader.jsx         # Loading animations
│   └── ErrorBox.jsx       # Error message display
├── firebase.js            # Firebase SDK configuration
└── App.jsx               # Main application component
```

### Key Features

- **File Upload**: Handles MP3/WAV audio files up to 25MB
- **URL Input**: Processes publicly accessible audio URLs
- **Text Input**: Direct text processing without transcription
- **Real-time Updates**: Live status updates during processing
- **Error Handling**: Comprehensive error messaging

### State Management

```javascript
const [audioUrl, setAudioUrl] = useState("");
const [freeText, setFreeText] = useState("");
const [file, setFile] = useState(null);
const [transcript, setTranscript] = useState("");
const [extracted, setExtracted] = useState(null);
const [diagnosis, setDiagnosis] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
```

## Backend Architecture

### Firebase Functions

#### 1. transcribeAudio

**Purpose**: Convert audio to text using OpenAI Whisper
**Input**:

```typescript
{
  url: string; // Firebase Storage URL or external URL
}
```

**Output**:

```typescript
{
  transcript: string;
}
```

**Process**:

1. Download audio from URL using axios
2. Create File object from buffer
3. Send to OpenAI Whisper API
4. Return transcribed text

#### 2. extractMedicalData

**Purpose**: Extract structured medical information from text
**Input**:

```typescript
{
  text: string; // Patient consultation text
}
```

**Output**:

```typescript
{
  extracted_info: {
    symptoms: string[];
    duration: string;
    severity: "mild" | "moderate" | "severe";
    medical_history?: string;
    medications?: string[];
    allergies?: string[];
    vital_signs?: object;
  }
}
```

**Process**:

1. Send text to GPT-3.5-turbo with medical extraction prompt
2. Parse JSON response
3. Return structured medical data

#### 3. generateDiagnosis

**Purpose**: Generate differential diagnosis and treatment plan
**Input**:

```typescript
{
  medical_info: ExtractedMedicalInfo;
}
```

**Output**:

```typescript
{
  diagnosis: string;
  differential_diagnosis: string[];
  treatmentPlan: string;
  recommendations: string[];
  disclaimer: string;
}
```

### Security Configuration

#### Firebase Functions Config

```bash
# Set API key securely
firebase functions:config:set openai.key="sk-proj-..."

# View current config
firebase functions:config:get

# Generate local config for emulators
firebase functions:config:get > functions/.runtimeconfig.json
```

#### Environment Variables Access

```typescript
import * as functions from "firebase-functions";

const apiKey = functions.config().openai?.key;
if (!apiKey) {
  throw new Error("OpenAI API key not configured");
}
```

## Database Schema

### Firebase Storage Structure

```
storage/
├── audio/
│   ├── filename_timestamp.mp3
│   ├── filename_timestamp.wav
│   └── ...
```

### Firestore Collections

Currently unused but ready for future features:

- `consultations/` - Store consultation history
- `users/` - User profiles and preferences
- `analytics/` - Usage statistics

## Development Workflow

### Local Development Setup

1. **Install Dependencies**

   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd functions && npm install && cd ..
   ```

2. **Configure Environment**

   ```bash
   firebase functions:config:set openai.key="your-key"
   cd functions && firebase functions:config:get > .runtimeconfig.json
   ```

3. **Start Development Servers**

   ```bash
   # Terminal 1: Firebase Emulators
   firebase emulators:start --only functions,firestore,storage --project gressusapp

   # Terminal 2: Frontend Development Server
   cd frontend && npm run dev -- --port 5174
   ```

### Testing Strategy

#### Unit Tests (Future Implementation)

```bash
# Frontend tests
cd frontend && npm test

# Functions tests
cd functions && npm test
```

#### Integration Testing

```bash
# Test API endpoints directly
curl -X POST http://127.0.0.1:5001/gressusapp/us-central1/extractMedicalData \
  -H "Content-Type: application/json" \
  -d '{"text":"Patient has fever and headache for 2 days"}'
```

### Code Style and Standards

#### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "commonjs",
    "lib": ["ES2018"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

#### ESLint Rules

- Prefer `const` over `let`
- Use TypeScript interfaces for type safety
- Handle all Promise rejections
- Validate function inputs

## API Integration

### OpenAI API Usage

#### Whisper API

```typescript
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: "whisper-1",
  language: "es", // Optional: specify language
  response_format: "text",
});
```

#### GPT API for Medical Extraction

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: medicalExtractionPrompt,
    },
    {
      role: "user",
      content: patientText,
    },
  ],
  temperature: 0.3,
  max_tokens: 500,
});
```

### Error Handling Patterns

#### Frontend Error Handling

```javascript
try {
  const response = await fetch(apiUrl, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error("API Error:", error);
  setError(error.message);
}
```

#### Backend Error Handling

```typescript
export const myFunction = functions.https.onRequest(async (req, res) => {
  try {
    // Function logic
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Function error:", error);
    res.status(500).json({
      error: "InternalError",
      message: error.message,
    });
  }
});
```

## Performance Optimization

### Frontend Optimizations

- **Code Splitting**: Lazy load components
- **Memoization**: Use `React.memo` for expensive components
- **Asset Optimization**: Compress images and bundle size
- **Caching**: Cache API responses when appropriate

### Backend Optimizations

- **Cold Start Reduction**: Keep functions warm with scheduled pings
- **Memory Management**: Optimize Node.js memory usage
- **API Rate Limiting**: Implement request throttling
- **Caching**: Cache OpenAI responses for identical requests

## Deployment Strategies

### Staging Environment

```bash
# Deploy to staging
firebase use staging
firebase deploy --only functions

# Test staging endpoints
curl https://us-central1-staging-project.cloudfunctions.net/transcribeAudio
```

### Production Deployment

```bash
# Deploy to production
firebase use production
firebase deploy

# Monitor functions
firebase functions:log --project production
```

### CI/CD Pipeline (Future)

```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm ci
      - name: Build functions
        run: npm run build:functions
      - name: Deploy to Firebase
        run: firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

## Monitoring and Analytics

### Function Logs

```bash
# View real-time logs
firebase functions:log --follow

# Filter by function
firebase functions:log --only transcribeAudio
```

### Performance Metrics

- Function execution time
- Memory usage
- Error rates
- API quota usage

### Cost Monitoring

- OpenAI API usage
- Firebase Functions invocations
- Storage bandwidth
- Firestore read/write operations

## Future Enhancements

### Planned Features

1. **User Authentication**: Firebase Auth integration
2. **Consultation History**: Store and retrieve past consultations
3. **Multi-language Support**: Support for multiple languages
4. **Voice Recognition**: Real-time voice input
5. **PDF Generation**: Export diagnosis reports
6. **Integration APIs**: Connect with EHR systems

### Technical Debt

1. Add comprehensive unit tests
2. Implement proper logging system
3. Add API rate limiting
4. Optimize bundle size
5. Add performance monitoring

### Security Improvements

1. Input sanitization
2. Rate limiting
3. Request signing
4. Data encryption at rest
5. Audit logging
