import * as admin from 'firebase-admin';
// import * as dotenv from 'dotenv';
// dotenv.config(); // Temporalmente deshabilitado - usando Firebase Functions Config

admin.initializeApp();

export { transcribeAudio } from './transcribe';
export { extractMedicalData } from './extract';
export { generateDiagnosis } from './diagnosis'; 