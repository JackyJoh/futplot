

export async function runGeminiPrompt(prompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Missing or invalid prompt field');
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API upstream error:', response.status, errorText);
      throw new Error(`Gemini API upstream error: ${response.status} - ${errorText}`);
    }

    // Return data in json format
    const data = await response.json();
    return data;

  } catch (err: any) {
    console.error('Gemini API fetch failed:', err);
    throw new Error('Failed to reach Gemini API');
  }
}
