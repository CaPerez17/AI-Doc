"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDiagnosis = void 0;
const functions = __importStar(require("firebase-functions"));
const openai_1 = __importDefault(require("openai"));
// Obtener la API key de la configuración de Firebase Functions
const apiKey = (_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key;
if (!apiKey) {
    console.error("OpenAI API key is not configured. Please set it using: firebase functions:config:set openai.key='your-api-key'");
    throw new Error("OpenAI API key not configured");
}
const openai = new openai_1.default({
    apiKey: apiKey
});
exports.generateDiagnosis = functions.https.onRequest(async (req, res) => {
    try {
        const { medical_info } = req.body;
        if (!medical_info) {
            res.status(400).json({ error: 'Medical info is required' });
            return;
        }
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
        const diagnosis_result = completion.choices[0].message.content;
        try {
            const parsedDiagnosis = JSON.parse(diagnosis_result || '{}');
            res.json(parsedDiagnosis);
        }
        catch (parseError) {
            // Si no se puede parsear como JSON, devolver como texto
            res.json({
                diagnosis: diagnosis_result,
                disclaimer: "Este es un diagnóstico generado por IA. Consulte siempre con un médico real."
            });
        }
    }
    catch (error) {
        console.error('Error generating diagnosis:', error);
        res.status(500).json({
            error: 'DiagnosisError',
            message: error.message
        });
    }
});
//# sourceMappingURL=diagnosis.js.map