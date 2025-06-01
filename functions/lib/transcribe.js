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
// Obtener la API key de la configuración de Firebase Functions
const apiKey = (_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key;
if (!apiKey) {
    console.error("OpenAI API key is not configured. Please set it using: firebase functions:config:set openai.key='your-api-key'");
    throw new Error("OpenAI API key not configured");
}
const openai = new openai_1.default({
    apiKey: apiKey
});
exports.transcribeAudio = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c, _d;
    console.log('🔑 Using configured OpenAI key');
    console.log('📥 URL recibida:', req.body.url);
    try {
        const { url } = req.body;
        if (!url) {
            res.status(400).json({ error: 'URL is required' });
            return;
        }
        // Download audio file
        const response = await axios_1.default.get(url, { responseType: 'arraybuffer' });
        if (response.data && typeof response.data.byteLength === 'number') {
            console.log('✅ Audio descargado, tamaño:', response.data.byteLength);
        }
        else {
            console.error('❌ El audio descargado no es un ArrayBuffer válido.');
            res.status(500).json({ error: 'InvalidAudioBuffer' });
            return;
        }
        // Create a File object from the buffer
        const audioBuffer = Buffer.from(response.data);
        const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });
        // Transcribe with OpenAI Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
        });
        res.json({ transcript: transcription.text });
    }
    catch (error) {
        console.error('❌ Error en Axios al descargar audio:', error.toString());
        if (error.response) {
            console.error('Status:', error.response.status, 'Body:', (_a = error.response.data) === null || _a === void 0 ? void 0 : _a.toString());
        }
        res.status(500).json({
            error: 'DownloadError',
            message: error.toString(),
            status: (_b = error.response) === null || _b === void 0 ? void 0 : _b.status,
            body: (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.toString()
        });
        return;
    }
});
//# sourceMappingURL=transcribe.js.map