// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI } from "@google/genai";

// MOCK MODE - Set to FALSE to use real Gemini API
// ⚠️ IMPORTANT: New Google accounts NEED billing enabled to use Gemini API
const USE_MOCK_MODE = false;

let aiInstance = null;
const responseCache = {};

function getAIInstance() {
  const apiKey = process.env["EXPO_PUBLIC_GEMINI_API_KEY"];

  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY in .env file");
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

// Dummy response for development
function getMockResponse() {
  return JSON.stringify({
    topics: [
      { id: 1, title: "Fundamentals", description: "Core concepts and basics" },
      {
        id: 2,
        title: "Advanced Topics",
        description: "Building on fundamentals",
      },
      {
        id: 3,
        title: "Practical Projects",
        description: "Real-world applications",
      },
      { id: 4, title: "Best Practices", description: "Industry standards" },
      {
        id: 5,
        title: "Tools & Resources",
        description: "Essential tools needed",
      },
    ],
  });
}

export async function generateContentWithAI(userInput) {
  // Use mock mode
  if (USE_MOCK_MODE) {
    console.log(
      "📌 MOCK MODE: Using dummy data (no API calls). To use real API, set USE_MOCK_MODE=false",
    );
    return getMockResponse();
  }

  // Check cache first
  if (responseCache[userInput]) {
    console.log("✅ Using cached response");
    return responseCache[userInput];
  }

  try {
    const ai = getAIInstance();

    // Minimal config to reduce token usage
    const config = {
      generationConfig: {
        responseMimeType: "application/json",
      },
    };
    const model = "gemini-2.0-flash";
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: userInput || `INSERT_INPUT_HERE`,
          },
        ],
      },
    ];

    // Use generateContent (not stream) for single response
    const response = await ai.models.generateContent({
      model,
      config,
      contents,
    });

    // Extract text from response
    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Cache successful response
    responseCache[userInput] = responseText;
    console.log("✅ API response received successfully");
    return responseText;
  } catch (error) {
    console.error("🔴 API Error:", error.message);
    throw error;
  }
}

export default generateContentWithAI;
