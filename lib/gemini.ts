const MODEL_HIERARCHY = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3-pro-preview',
  'gemini-2.5-pro'
];

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function runGeminiPrompt(prompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Missing or invalid prompt field');
  }

  const errors: string[] = [];

  for (const model of MODEL_HIERARCHY) {
    try {
      const response = await fetch(`${BASE_URL}/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Gemini response from: ${model}`);
        return data;
      }

      const errorText = await response.text();
      const msg = `${model}: ${response.status} - ${errorText}`;
      console.warn(`Gemini model failed, trying next. ${msg}`);
      errors.push(msg);
    } catch (err: any) {
      const msg = `${model}: ${err.message}`;
      console.warn(`Gemini model failed, trying next. ${msg}`);
      errors.push(msg);
    }
  }

  console.error('All Gemini models exhausted:', errors);
  throw new Error('All Gemini models exhausted');
}
