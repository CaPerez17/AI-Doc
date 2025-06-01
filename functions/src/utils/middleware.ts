import cors from 'cors';
import { ZodSchema } from 'zod';
import * as functions from 'firebase-functions';

// CORS wrapper
const corsHandler = cors({ origin: true });

export const withCors = (handler: functions.https.HttpsFunction) => 
  functions.https.onRequest((req, res) => 
    corsHandler(req, res, () => handler(req, res)));

// Validation wrapper
export const withValidation = (schema: ZodSchema) => 
  (handler: functions.https.HttpsFunction) =>
    functions.https.onRequest((req, res) => {
      const parse = schema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.flatten() });
        return;
      }
      req.body = parse.data; // typed body
      return handler(req, res);
    });

// Error handler
export const withErrorHandling = (handler: functions.https.HttpsFunction) =>
  functions.https.onRequest(async (req, res) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      console.error('Function error:', err);
      res
        .status(err?.statusCode || 500)
        .json({ success: false, error: { message: err.message || 'Internal server error' } });
    }
  });

// Helper to compose easily
export const compose = (...layers: Array<(h: functions.https.HttpsFunction) => functions.https.HttpsFunction>) =>
  (core: functions.https.HttpsFunction) =>
    layers.reduceRight((fn, layer) => layer(fn), core); 