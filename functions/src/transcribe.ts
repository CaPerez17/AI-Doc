import * as functions from 'firebase-functions';
import OpenAI from 'openai';
import axios from 'axios';

// Obtener la API key de la configuración de Firebase Functions
const apiKey = functions.config().openai?.key;

if (!apiKey) {
  console.error("OpenAI API key is not configured. Please set it using: firebase functions:config:set openai.key='your-api-key'");
  throw new Error("OpenAI API key not configured");
}

const openai = new OpenAI({
  apiKey: apiKey
});

export const transcribeAudio = functions.https.onRequest(async (req, res) => {
  console.log('🔑 Using configured OpenAI key');
  console.log('📥 URL recibida:', req.body.url);

  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Download audio file
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    if (response.data && typeof (response.data as ArrayBuffer).byteLength === 'number') {
      console.log('✅ Audio descargado, tamaño:', (response.data as ArrayBuffer).byteLength);
    } else {
      console.error('❌ El audio descargado no es un ArrayBuffer válido.');
      res.status(500).json({ error: 'InvalidAudioBuffer' });
      return;
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

    res.json({ transcript: transcription.text });
  } catch (error: any) {
    console.error('❌ Error en Axios al descargar audio:', error.toString());
    if (error.response) {
      console.error('Status:', error.response.status, 'Body:', error.response.data?.toString());
    }
    res.status(500).json({
      error: 'DownloadError',
      message: error.toString(),
      status: error.response?.status,
      body: error.response?.data?.toString()
    });
    return;
  }
}); 