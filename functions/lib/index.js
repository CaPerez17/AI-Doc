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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDiagnosis = exports.extractMedicalData = exports.transcribeAudio = void 0;
const admin = __importStar(require("firebase-admin"));
// import * as dotenv from 'dotenv';
// dotenv.config(); // Temporalmente deshabilitado - usando Firebase Functions Config
admin.initializeApp();
var transcribe_1 = require("./transcribe");
Object.defineProperty(exports, "transcribeAudio", { enumerable: true, get: function () { return transcribe_1.transcribeAudio; } });
var extract_1 = require("./extract");
Object.defineProperty(exports, "extractMedicalData", { enumerable: true, get: function () { return extract_1.extractMedicalData; } });
var diagnosis_1 = require("./diagnosis");
Object.defineProperty(exports, "generateDiagnosis", { enumerable: true, get: function () { return diagnosis_1.generateDiagnosis; } });
//# sourceMappingURL=index.js.map