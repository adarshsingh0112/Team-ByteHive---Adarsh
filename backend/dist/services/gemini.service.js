"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callGeminiStructured = callGeminiStructured;
exports.callGeminiText = callGeminiText;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
async function callGeminiStructured(prompt) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 15) {
        return null;
    }
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok)
            return null;
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText)
            return null;
        const cleaned = rawText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    }
    catch (err) {
        return null;
    }
}
async function callGeminiText(prompt) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 15)
        return null;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok)
            return null;
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
    catch (err) {
        return null;
    }
}
