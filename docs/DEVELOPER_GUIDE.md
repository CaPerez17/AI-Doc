# Developer Guide - AI Doctor Assistant

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
│   ├── Results.jsx        # Display transcription/diagnosis results
│   ├── Loader.jsx         # Loading component
│   └── ErrorBox.jsx       # Error display component
├── firebase.js            # Firebase configuration and initialization
└── App.jsx               # Main application component
```

### State Management

- **File State**: Handles audio file uploads and URLs
- **Processing State**: Manages loading states for each processing step
- **Result State**: Stores transcription, medical data, and diagnosis
- **Error State**: Manages error messages and display

### API Integration

Frontend communicates with Firebase Functions through HTTP requests:

```javascript
const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5001/gressusapp/us-central1";

// Example API call
const response = await fetch(`${API_BASE}/extractMedicalData`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: inputText }),
});
```

## Backend Architecture

### Firebase Functions Structure

```
functions/src/
├── index.ts           # Function exports and HTTP trigger setup
├── transcribe.ts      # Audio transcription using OpenAI Whisper
├── extract.ts         # Medical data extraction using GPT
└── diagnosis.ts       # Diagnosis generation using GPT
```

### Function Flow

1. **transcribeAudio**: Downloads audio → calls Whisper API → returns text
2. **extractMedicalData**: Receives text → processes with GPT → returns structured data
3. **generateDiagnosis**: Receives medical data → generates diagnosis with GPT

### Environment Configuration

- **Development**: Uses `.runtimeconfig.json` generated from Firebase config
- **Production**: Uses Firebase Functions config directly
- **Security**: API keys never exposed in client-side code

## Database Schema

### Firestore Collections

Currently minimal database usage. Future expansion may include:

- `sessions/`: User sessions and processing history
- `audio_files/`: Metadata for uploaded audio files
- `diagnoses/`: Stored diagnosis results

### Firebase Storage

- Path: `audio/{filename}_{timestamp}`
- File types: MP3, WAV, M4A
- Size limit: 25MB per file
- Retention: Files cleaned up after processing

## API Documentation

### POST /transcribeAudio

**Purpose**: Convert audio file to text using OpenAI Whisper

**Request Body**:

```json
{
  "url": "https://storage.googleapis.com/bucket/audio/file.mp3"
}
```

**Response**:

```json
{
  "transcript": "Patient complains of headache and fever..."
}
```

**Error Responses**:

- `400`: Missing or invalid URL
- `500`: Transcription service error

### POST /extractMedicalData

**Purpose**: Extract structured medical information from text

**Request Body**:

```json
{
  "text": "Patient complains of headache and fever for 2 days..."
}
```

**Response**:

```json
{
  "extracted_info": {
    "symptoms": ["headache", "fever"],
    "duration": "2 days",
    "severity": "moderate",
    "medical_history": [],
    "current_medications": [],
    "allergies": []
  }
}
```

### POST /generateDiagnosis

**Purpose**: Generate diagnosis and treatment recommendations

**Request Body**:

```json
{
  "medical_info": {
    "symptoms": ["headache", "fever"],
    "duration": "2 days",
    "severity": "moderate"
  }
}
```

**Response**:

```json
{
  "diagnosis": "Viral upper respiratory infection",
  "differential_diagnosis": ["Common cold", "Influenza", "Sinusitis"],
  "confidence": "moderate",
  "treatmentPlan": "Rest, fluids, over-the-counter pain relievers",
  "recommendations": [
    "Monitor symptoms for 48 hours",
    "Seek medical attention if fever exceeds 101°F",
    "Return if symptoms worsen"
  ],
  "urgency": "low"
}
```

## Development Workflow

### Local Development Setup

1. **Install Dependencies**:

   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd functions && npm install && cd ..
   ```

2. **Configure Environment**:

   ```bash
   firebase functions:config:set openai.key="your-api-key"
   cd functions && firebase functions:config:get > .runtimeconfig.json
   ```

3. **Build Functions**:

   ```bash
   cd functions && npm run build
   ```

4. **Start Development**:
   ```bash
   npm run serve:local
   ```

### Testing Strategy

- **Unit Tests**: Individual function testing with mock data
- **Integration Tests**: End-to-end API flow testing
- **Manual Testing**: UI testing with real audio files

### Code Quality

- **TypeScript**: Strict typing for backend functions
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting standards
- **Git Hooks**: Pre-commit linting and testing

## Deployment

### Development Deployment

```bash
# Build functions
npm run build:functions

# Deploy to development project
firebase deploy --only functions --project dev-project-id
```

### Production Deployment

```bash
# Set production configuration
firebase functions:config:set openai.key="prod-api-key" --project prod-project-id

# Deploy to production
firebase deploy --project prod-project-id
```

### Environment Management

- **Development**: `dev-gressusapp` project
- **Production**: `gressusapp` project
- **Configuration**: Separate API keys and project settings

## Security Considerations

### API Key Management

- ✅ Stored in Firebase Functions config
- ✅ Never exposed in client code
- ✅ Different keys for dev/prod environments
- ✅ Local config files git-ignored

### Data Privacy

- ❗ Audio files temporarily stored in Firebase Storage
- ❗ No permanent storage of patient data
- ❗ HIPAA compliance not implemented (demo only)
- ✅ Processing happens server-side only

### Input Validation

- ✅ File type and size validation
- ✅ URL validation for audio links
- ✅ Text input sanitization
- ✅ Error handling for malformed requests

## Monitoring and Debugging

### Firebase Console

- **Functions**: Monitor execution time, errors, logs
- **Storage**: Track file uploads and storage usage
- **Emulator**: Local development debugging

### Logging Strategy

```typescript
// Structured logging in functions
console.log("🔑 Using configured OpenAI key");
console.log("📥 Processing audio file:", filename);
console.log("✅ Transcription completed, length:", transcript.length);
```

### Error Handling

- Graceful degradation for API failures
- User-friendly error messages
- Detailed server-side logging
- Automatic retry for transient failures

## Performance Optimization

### Frontend

- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Optimized assets and icons
- **Caching**: Browser caching for static assets

### Backend

- **Cold Start Reduction**: Keep functions warm with scheduled pings
- **Concurrent Processing**: Parallel API calls where possible
- **Response Streaming**: Stream large responses when applicable

### Cost Optimization

- **Function Memory**: Right-sized memory allocation
- **OpenAI Usage**: Optimized prompts for token efficiency
- **Storage Cleanup**: Automatic cleanup of temporary files

## Future Enhancements

### Technical Improvements

- [ ] WebSocket for real-time processing updates
- [ ] Audio processing in browser (Web Audio API)
- [ ] Offline functionality with service workers
- [ ] Progressive Web App (PWA) features

### Feature Additions

- [ ] Multi-language support
- [ ] Medical terminology validation
- [ ] Integration with EHR systems
- [ ] Advanced analytics and reporting

### Security Enhancements

- [ ] HIPAA compliance implementation
- [ ] End-to-end encryption
- [ ] User authentication and authorization
- [ ] Audit logging for medical data access
