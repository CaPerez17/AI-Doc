import * as functions from 'firebase-functions';
import OpenAI from 'openai';
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
const diagnosisSchema = z.object({
  medical_info: z.object({}).passthrough() // Allow any medical info object
});

const handler = functions.https.onRequest(async (req, res) => {
  console.log('[diagnosis] incoming body =', req.body);
  
  const { medical_info } = req.body;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `Eres un médico general con experiencia en diagnóstico clínico. 
        
Basándote en la información médica proporcionada, genera:
1. Un diagnóstico diferencial (posibles diagnósticos ordenados por probabilidad)
2. Un plan de tratamiento inicial
3. Recomendaciones adicionales

IMPORTANTE: Esto es solo para fines educativos/demostrativos. Siempre recomienda consultar con un médico real.

Responde en formato JSON con esta estructura:
{
  "diagnosis": "diagnóstico más probable",
  "differential_diagnosis": ["diagnóstico1", "diagnóstico2", "diagnóstico3"],
  "treatmentPlan": "plan de tratamiento sugerido",
  "recommendations": ["recomendación1", "recomendación2", "recomendación3"],
  "disclaimer": "mensaje recordando consultar médico real"
}`
      },
      {
        role: "user",
        content: `Información médica del paciente: ${JSON.stringify(medical_info)}`
      }
    ],
    temperature: 0.7,
    max_tokens: 800
  });

  // Capture tokens and cost for metrics
  const tokens = completion.usage?.total_tokens ?? 0;
  const costUsd = tokensToUsd(tokens);
  res.locals.usage = { tokens, costUsd };

  const diagnosis_result = completion.choices[0].message.content;
  console.log('[diagnosis] result =', diagnosis_result);
  
  try {
    const parsedDiagnosis = JSON.parse(diagnosis_result || '{}');
    res.json({ 
      success: true, 
      data: parsedDiagnosis 
    });
  } catch (parseError) {
    // Si no se puede parsear como JSON, devolver como texto
    res.json({ 
      success: true, 
      data: {
        diagnosis: diagnosis_result,
        disclaimer: "Este es un diagnóstico generado por IA. Consulte siempre con un médico real."
      }
    });
  }
});

export const generateDiagnosis = compose(
  withCors,
  withErrorHandling,
  withMetrics('generateDiagnosis'),
  withValidation(diagnosisSchema)
)(handler); 