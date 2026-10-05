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
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY in .env file");
  }

  console.log("🔑 Using Gemini API Key (ends with):", apiKey.slice(-6));
  return new GoogleGenAI({ apiKey });
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

const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.8-pro",
];

function getFallbackResponse(userInput) {
  let topicName = "Course Subject";
  if (userInput) {
    const match = userInput.match(/User Input:\s*(.+)/i);
    if (match && match[1]) {
      topicName = match[1].trim();
    }
  }

  return JSON.stringify({
    topics: [
      { id: 1, title: `${topicName} Fundamentals`, description: `Core concepts, architecture, and fundamentals of ${topicName}` },
      { id: 2, title: `Intermediate ${topicName} Techniques`, description: `Building key skills, workflows, and practical patterns` },
      { id: 3, title: `Hands-on Projects & Implementation`, description: `Real-world hands-on project creation` },
      { id: 4, title: `Best Practices & Architecture`, description: `Industry best practices, optimization, and standards` },
      { id: 5, title: `Advanced Mastery & Real-World Use`, description: `Deep dive into advanced topics and production deployment` },
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

  const ai = getAIInstance();
  const config = {
    generationConfig: {
      responseMimeType: "application/json",
    },
  };
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

  // Try candidate models in order to handle 503 high demand or unavailable models
  for (const model of CANDIDATE_MODELS) {
    try {
      console.log(`🤖 Attempting generation with model: ${model}...`);
      const response = await ai.models.generateContent({
        model,
        config,
        contents,
      });

      const responseText =
        response.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (responseText) {
        responseCache[userInput] = responseText;
        console.log(`✅ API response received successfully from ${model}`);
        return responseText;
      }
    } catch (err) {
      console.warn(`⚠️ Model ${model} failed (${err.message}). Trying next fallback...`);
      // If 503 high demand, pause briefly before next attempt
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  // Graceful fallback if Google API servers are temporarily overloaded with 503
  console.warn("⚠️ All AI models temporarily overloaded (503). Using generated curriculum fallback.");
  return getFallbackResponse(userInput);
}

export default generateContentWithAI;
