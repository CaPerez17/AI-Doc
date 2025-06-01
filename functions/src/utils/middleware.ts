import cors from 'cors';
import { ZodSchema } from 'zod';
import * as functions from 'firebase-functions';
import { Histogram, Counter } from 'prom-client';

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

// Metrics (latency + tokens + cost)
const latency = new Histogram({
  name: 'function_latency_ms',
  help: 'Execution time per function',
  labelNames: ['name'],
});

const cost = new Counter({
  name: 'openai_cost_usd',
  help: 'Estimated OpenAI cost in USD',
});

export const withMetrics = (handler: functions.https.HttpsFunction, name: string) =>
  functions.https.onRequest(async (req, res) => {
    const end = latency.startTimer({ name });
    await handler(req, res);
    end();

    if ((res as any).locals?.usdCost) {
      cost.inc((res as any).locals.usdCost);
    }
  });

// Helper to compose easily
export const compose = (...layers: Array<(h: functions.https.HttpsFunction) => functions.https.HttpsFunction>) =>
  (core: functions.https.HttpsFunction) =>
    layers.reduceRight((fn, layer) => layer(fn), core); 