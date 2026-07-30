import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function callGeminiStructured<T>(prompt: string): Promise<T | null> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 15) {
    console.warn("GEMINI_API_KEY missing on backend server.");
    return null;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!res.ok) {
      console.error(`Gemini API HTTP Error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const cleaned = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (err: any) {
    console.error("Gemini API service exception:", err.message);
    return null;
  }
}

export async function callGeminiText(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 15) return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err: any) {
    console.error("Gemini Text API exception:", err.message);
    return null;
  }
}
