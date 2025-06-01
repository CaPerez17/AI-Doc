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
exports.withMetrics = void 0;
exports.tokensToUsd = tokensToUsd;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const prom_client_1 = require("prom-client");
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
// Clear existing metrics to avoid duplicate registration errors
prom_client_1.register.clear();
// latency histogram in ms
const latency = new prom_client_1.Histogram({
    name: 'function_latency_ms',
    help: 'Execution time per function',
    labelNames: ['endpoint'],
});
// total tokens counter
const tokensCounter = new prom_client_1.Counter({
    name: 'openai_tokens_total',
    help: 'Sum of tokens used',
    labelNames: ['endpoint'],
});
// cost counter in USD
const costCounter = new prom_client_1.Counter({
    name: 'openai_cost_usd',
    help: 'Estimated cost in USD',
    labelNames: ['endpoint'],
});
// helper to estimate OpenAI cost (adjust model price!)
const USD_PER_1K_TOKENS = 0.0020; // example for gpt-3.5-turbo
function tokensToUsd(tokens) {
    return (tokens / 1000) * USD_PER_1K_TOKENS;
}
/** Middleware wrapper: measures latency, gets token usage from res.locals.usage,
 *  writes a doc to Firestore logs/{autoId}, and updates Prom metrics. */
const withMetrics = (endpoint) => (handler) => functions.https.onRequest(async (req, res) => {
    var _a, _b;
    const start = Date.now();
    await handler(req, res);
    const ms = Date.now() - start;
    // pull usage injected by core function
    const usage = (_b = (_a = res.locals) === null || _a === void 0 ? void 0 : _a.usage) !== null && _b !== void 0 ? _b : { tokens: 0, costUsd: 0 };
    const { tokens, costUsd } = usage;
    // Prometheus
    latency.labels(endpoint).observe(ms);
    if (tokens)
        tokensCounter.labels(endpoint).inc(tokens);
    if (costUsd)
        costCounter.labels(endpoint).inc(costUsd);
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
    }
    catch (error) {
        console.error('Error logging to Firestore:', error);
    }
});
exports.withMetrics = withMetrics;
//# sourceMappingURL=metrics.js.map