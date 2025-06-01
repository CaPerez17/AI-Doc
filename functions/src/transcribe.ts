import * as functions from 'firebase-functions';
import OpenAI from 'openai';
import axios from 'axios';
import { z } from 'zod';
import { compose, withCors, withErrorHandling, withValidation } from './utils/middleware';
import { withMetrics, tokensToUsd } from './utils/metrics';

// Obtener la API key de la configuración de Firebase Functions
const apiKey = functions.config().openai?.key;

if (!apiKey) {
  console.error("OpenAI API key is not configured. Please set it using: firebase functions:config:set openai.key='your-api-key'");
  throw new Error("OpenAI API key not configured");
}

const openai = new OpenAI({
  apiKey: apiKey
});

// Validation schema
const transcribeSchema = z.object({
  url: z.string().url('Invalid URL format')
});

const handler = functions.https.onRequest(async (req, res) => {
  console.log('🔑 Using configured OpenAI key');
  console.log('📥 URL recibida:', req.body.url);

  const { url } = req.body;

  // Download audio file
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  if (response.data && typeof (response.data as ArrayBuffer).byteLength === 'number') {
    console.log('✅ Audio descargado, tamaño:', (response.data as ArrayBuffer).byteLength);
  } else {
    console.error('❌ El audio descargado no es un ArrayBuffer válido.');
    throw new Error('Invalid audio buffer');
  }

  // Create a File object from the buffer
  const audioBuffer = Buffer.from(response.data as ArrayBuffer);
  const audioFile = new File(
    [audioBuffer],
    'audio.mp3',
    { type: 'audio/mpeg' }
  );

  // Transcribe with OpenAI Whisper
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
  });

  // Estimate usage for Whisper (approximation, Whisper pricing is per minute)
  // For demo purposes, we'll use a simple heuristic
  const estimatedTokens = Math.ceil(transcription.text.length / 4); // rough approximation
  const costUsd = tokensToUsd(estimatedTokens);
  res.locals.usage = { tokens: estimatedTokens, costUsd };

  console.log('[transcribe] transcript =', transcription.text);

  // Return structured response
  res.json({ 
    success: true, 
    data: { 
      transcript: transcription.text 
    } 
  });
});

export const transcribeAudio = compose(
  withCors,
  withErrorHandling,
  withMetrics('transcribeAudio'),
  withValidation(transcribeSchema)
)(handler); 