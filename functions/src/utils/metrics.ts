import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Histogram, Counter, register } from 'prom-client';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Clear existing metrics to avoid duplicate registration errors
register.clear();

// latency histogram in ms
const latency = new Histogram({
  name: 'function_latency_ms',
  help: 'Execution time per function',
  labelNames: ['endpoint'],
});

// total tokens counter
const tokensCounter = new Counter({
  name: 'openai_tokens_total',
  help: 'Sum of tokens used',
  labelNames: ['endpoint'],
});

// cost counter in USD
const costCounter = new Counter({
  name: 'openai_cost_usd',
  help: 'Estimated cost in USD',
  labelNames: ['endpoint'],
});

// helper to estimate OpenAI cost (adjust model price!)
const USD_PER_1K_TOKENS = 0.0020;  // example for gpt-3.5-turbo
export function tokensToUsd(tokens: number) {
  return (tokens / 1000) * USD_PER_1K_TOKENS;
}

/** Middleware wrapper: measures latency, gets token usage from res.locals.usage,
 *  writes a doc to Firestore logs/{autoId}, and updates Prom metrics. */
export const withMetrics = (endpoint: string) =>
  (handler: functions.https.HttpsFunction) =>
    functions.https.onRequest(async (req, res) => {
      const start = Date.now();
      await handler(req, res);
      const ms = Date.now() - start;

      // pull usage injected by core function
      const usage = (res as any).locals?.usage ?? { tokens: 0, costUsd: 0 };
      const { tokens, costUsd } = usage;

      // Prometheus
      latency.labels(endpoint).observe(ms);
      if (tokens) tokensCounter.labels(endpoint).inc(tokens);
      if (costUsd) costCounter.labels(endpoint).inc(costUsd);

      // Firestore log
      try {
        await admin
          .firestore()
          .collection('logs')
          .add({
            endpoint,
            ms,
            tokens,
            costUsd,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
        console.log(`📊 Metrics logged: ${endpoint} - ${ms}ms, ${tokens} tokens, $${costUsd.toFixed(4)}`);
      } catch (error) {
        console.error('Error logging to Firestore:', error);
      }
    }); 