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
Object.defineProperty(exports, "__esModule", { value: true });
exports.compose = exports.withMetrics = exports.withErrorHandling = exports.withValidation = exports.withCors = void 0;
const cors_1 = __importDefault(require("cors"));
const functions = __importStar(require("firebase-functions"));
const prom_client_1 = require("prom-client");
// CORS wrapper
const corsHandler = (0, cors_1.default)({ origin: true });
const withCors = (handler) => functions.https.onRequest((req, res) => corsHandler(req, res, () => handler(req, res)));
exports.withCors = withCors;
// Validation wrapper
const withValidation = (schema) => (handler) => functions.https.onRequest((req, res) => {
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.flatten() });
        return;
    }
    req.body = parse.data; // typed body
    return handler(req, res);
});
exports.withValidation = withValidation;
// Error handler
const withErrorHandling = (handler) => functions.https.onRequest(async (req, res) => {
    try {
        await handler(req, res);
    }
    catch (err) {
        console.error('Function error:', err);
        res
            .status((err === null || err === void 0 ? void 0 : err.statusCode) || 500)
            .json({ success: false, error: { message: err.message || 'Internal server error' } });
    }
});
exports.withErrorHandling = withErrorHandling;
// Metrics (latency + tokens + cost)
const latency = new prom_client_1.Histogram({
    name: 'function_latency_ms',
    help: 'Execution time per function',
    labelNames: ['name'],
});
const cost = new prom_client_1.Counter({
    name: 'openai_cost_usd',
    help: 'Estimated OpenAI cost in USD',
});
const withMetrics = (handler, name) => functions.https.onRequest(async (req, res) => {
    var _a;
    const end = latency.startTimer({ name });
    await handler(req, res);
    end();
    if ((_a = res.locals) === null || _a === void 0 ? void 0 : _a.usdCost) {
        cost.inc(res.locals.usdCost);
    }
});
exports.withMetrics = withMetrics;
// Helper to compose easily
const compose = (...layers) => (core) => layers.reduceRight((fn, layer) => layer(fn), core);
exports.compose = compose;
//# sourceMappingURL=middleware.js.map