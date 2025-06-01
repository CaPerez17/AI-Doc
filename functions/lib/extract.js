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
exports.extractMedicalData = void 0;
const functions = __importStar(require("firebase-functions"));
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("zod");
const middleware_1 = require("./utils/middleware");
const metrics_1 = require("./utils/metrics");
// Obtener la API key de la configuración de Firebase Functions
const apiKey = (_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key;
if (!apiKey) {
    console.error("OpenAI API key is not configured. Please set it using: firebase functions:config:set openai.key='your-api-key'");
    throw new Error("OpenAI API key not configured");
}
const openai = new openai_1.default({
    apiKey: apiKey
});
// Validation schema
const extractSchema = zod_1.z.object({
    text: zod_1.z.string().min(1, 'Text is required')
});
const handler = functions.https.onRequest(async (req, res) => {
    var _a, _b;
    console.log('[extract] incoming body =', req.body);
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
    // Capture tokens and cost for metrics
    const tokens = (_b = (_a = completion.usage) === null || _a === void 0 ? void 0 : _a.total_tokens) !== null && _b !== void 0 ? _b : 0;
    const costUsd = (0, metrics_1.tokensToUsd)(tokens);
    res.locals.usage = { tokens, costUsd };
    const extracted_info = completion.choices[0].message.content;
    try {
        const parsedInfo = JSON.parse(extracted_info || '{}');
        res.json({
            success: true,
            data: {
                extracted_info: parsedInfo
            }
        });
    }
    catch (parseError) {
        // Si no se puede parsear como JSON, devolver como texto
        res.json({
            success: true,
            data: {
                extracted_info: { raw_text: extracted_info }
            }
        });
    }
});
exports.extractMedicalData = (0, middleware_1.compose)(middleware_1.withCors, middleware_1.withErrorHandling, (0, metrics_1.withMetrics)('extractMedicalData'), (0, middleware_1.withValidation)(extractSchema))(handler);
//# sourceMappingURL=extract.js.map