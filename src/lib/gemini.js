// Gemini AI Integration using Google AI API directly
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Models in order of preference (will fallback if rate limited)
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

async function callGeminiAPI(model, prompt) {
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    }),
  });

  return response;
}

export async function generateContent(prompt) {
  let lastError = null;

  // Try each model in order, fallback on rate limit (429) or server error (5xx)
  for (const model of MODELS) {
    try {
      console.log(`Trying Gemini model: ${model}`);
      const response = await callGeminiAPI(model, prompt);

      // If rate limited (429) or server error, try next model
      if (response.status === 429 || response.status >= 500) {
        const errorData = await response.json();
        console.warn(`${model} unavailable (${response.status}), trying fallback...`, errorData.error?.message);
        lastError = new Error(errorData.error?.message || `Model ${model} rate limited`);
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API error:", errorData);
        throw new Error(errorData.error?.message || "Failed to generate content");
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No response text generated");
      }

      console.log(`Successfully used model: ${model}`);
      return {
        response: {
          text: () => text,
        },
      };
    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      lastError = error;
      // Continue to next model only if it's a network/fetch error
      if (error.name === 'TypeError') {
        continue;
      }
      throw error;
    }
  }

  // All models failed
  throw lastError || new Error("All Gemini models unavailable");
}

// Export a compatible aiModel object
export const aiModel = {
  generateContent,
};
