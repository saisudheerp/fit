const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// Define Gemini API key as a secret (stored securely in Firebase)
const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Generate AI response using Gemini API
 * This function securely calls the Gemini API from the server side
 */
exports.generateGeminiResponse = onCall(
  {
    secrets: [geminiApiKey],
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to use AI features."
      );
    }

    const { prompt, systemInstruction, model } = request.data;

    if (!prompt) {
      throw new HttpsError("invalid-argument", "Prompt is required.");
    }

    const selectedModel = model || "gemini-2.0-flash";
    const apiKey = geminiApiKey.value();

    if (!apiKey) {
      throw new HttpsError(
        "failed-precondition",
        "Gemini API key is not configured."
      );
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            systemInstruction: systemInstruction
              ? {
                  parts: [{ text: systemInstruction }],
                }
              : undefined,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error:", errorData);
        throw new HttpsError(
          "internal",
          `Gemini API error: ${errorData.error?.message || "Unknown error"}`
        );
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new HttpsError("internal", "No response generated from Gemini.");
      }

      return { text, model: selectedModel };
    } catch (error) {
      console.error("Error calling Gemini API:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        error.message || "Failed to generate AI response."
      );
    }
  }
);
