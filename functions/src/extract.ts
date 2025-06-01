import * as functions from 'firebase-functions';
import OpenAI from 'openai';
import { z } from 'zod';
import { compose, withCors, withErrorHandling, withMetrics, withValidation } from './utils/middleware';

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
const extractSchema = z.object({
  text: z.string().min(1, 'Text is required')
});

const handler = functions.https.onRequest(async (req, res) => {
  const { text } = req.body;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `Eres un asistente médico especializado en extraer información médica relevante de transcripciones de audio de pacientes. 
        
Extrae y estructura la siguiente información en formato JSON:
- symptoms: lista de síntomas mencionados
- duration: duración de los síntomas
- severity: severidad (mild, moderate, severe)
- medical_history: historial médico relevante mencionado
- medications: medicamentos actuales mencionados
- allergies: alergias mencionadas
- vital_signs: signos vitales si se mencionan

Responde únicamente con el JSON, sin explicaciones adicionales.`
      },
      {
        role: "user",
        content: text
      }
    ],
    temperature: 0.3,
    max_tokens: 500
  });

  const extracted_info = completion.choices[0].message.content;
  
  try {
    const parsedInfo = JSON.parse(extracted_info || '{}');
    res.json({ 
      success: true, 
      data: { 
        extracted_info: parsedInfo 
      } 
    });
  } catch (parseError) {
    // Si no se puede parsear como JSON, devolver como texto
    res.json({ 
      success: true, 
      data: { 
        extracted_info: { raw_text: extracted_info } 
      } 
    });
  }
});

export const extractMedicalData = compose(
  withCors,
  withErrorHandling,
  (fn) => withMetrics(fn, 'extractMedicalData'),
  withValidation(extractSchema)
)(handler); 