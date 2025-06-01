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
exports.transcribeAudio = void 0;
const functions = __importStar(require("firebase-functions"));
const openai_1 = __importDefault(require("openai"));
const axios_1 = __importDefault(require("axios"));
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
const transcribeSchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid URL format')
});
const handler = functions.https.onRequest(async (req, res) => {
    console.log('🔑 Using configured OpenAI key');
    console.log('📥 URL recibida:', req.body.url);
    const { url } = req.body;
    // Download audio file
    const response = await axios_1.default.get(url, { responseType: 'arraybuffer' });
    if (response.data && typeof response.data.byteLength === 'number') {
        console.log('✅ Audio descargado, tamaño:', response.data.byteLength);
    }
    else {
        console.error('❌ El audio descargado no es un ArrayBuffer válido.');
        throw new Error('Invalid audio buffer');
    }
    // Create a File object from the buffer
    const audioBuffer = Buffer.from(response.data);
    const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });
    // Transcribe with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
    });
    // Estimate usage for Whisper (approximation, Whisper pricing is per minute)
    // For demo purposes, we'll use a simple heuristic
    const estimatedTokens = Math.ceil(transcription.text.length / 4); // rough approximation
    const costUsd = (0, metrics_1.tokensToUsd)(estimatedTokens);
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
exports.transcribeAudio = (0, middleware_1.compose)(middleware_1.withCors, middleware_1.withErrorHandling, (0, metrics_1.withMetrics)('transcribeAudio'), (0, middleware_1.withValidation)(transcribeSchema))(handler);
//# sourceMappingURL=transcribe.js.map