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

  // If the prompt is asking for test questions ("questions" / "correctIndex"), return questions JSON
  if (
    userInput &&
    (userInput.includes('"questions"') ||
      userInput.includes("multiple-choice") ||
      userInput.includes("correctIndex"))
  ) {
    return JSON.stringify({
      questions: [
        {
          id: `q-${Date.now()}-1`,
          question: `What is the fundamental principle of ${topicName}?`,
          options: [
            `Modular architecture and clean design in ${topicName}`,
            "Ignoring edge cases during execution",
            "Using unindexed global variables only",
            "Skipping validation checks",
          ],
          correctIndex: 0,
          explanation: `Modular architecture and clean design form the core foundation of ${topicName}.`,
        },
        {
          id: `q-${Date.now()}-2`,
          question: `Which technique best optimizes performance when working with ${topicName}?`,
          options: [
            "Running blocking operations on the main thread",
            `Using efficient data structures and minimizing redundant work in ${topicName}`,
            "Disabling all caching mechanisms",
            "Repeating identical computations in every loop",
          ],
          correctIndex: 1,
          explanation: `Choosing optimal data structures and avoiding redundant work ensures high performance in ${topicName}.`,
        },
        {
          id: `q-${Date.now()}-3`,
          question: `When debugging an implementation of ${topicName}, what should be checked first?`,
          options: [
            "Only visual colors",
            `Input constraints, boundary conditions, and state flow in ${topicName}`,
            "Randomly renaming variables",
            "Removing error handling blocks",
          ],
          correctIndex: 1,
          explanation: `Verifying boundary conditions and state transitions catches the most common bugs in ${topicName}.`,
        },
        {
          id: `q-${Date.now()}-4`,
          question: `How should unexpected inputs and edge cases be handled in ${topicName}?`,
          options: [
            `Graceful error handling, validation, and safe fallbacks`,
            "Allowing silent crashes in production",
            "Hardcoding a single static test value",
            "Deleting all logs",
          ],
          correctIndex: 0,
          explanation: `Validation and graceful error handling make ${topicName} implementations reliable.`,
        },
        {
          id: `q-${Date.now()}-5`,
          question: `Which metric best evaluates a production solution in ${topicName}?`,
          options: [
            "Number of comments in the file",
            `Time complexity, space efficiency, and accuracy in ${topicName}`,
            "Length of file names",
            "Creation date of the project",
          ],
          correctIndex: 1,
          explanation: `Time complexity, memory efficiency, and accuracy are the standard engineering benchmarks for ${topicName}.`,
        },
      ],
    });
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

/**
 * Generate Multiple-Choice Test Questions using Gemini AI
 * Returns an array of question objects:
 * [{ id, question, options: [str, str, str, str], correctIndex: 0..3, explanation: str }]
 */
export async function generateTestQuestionsWithAI({
  title = "Assessment",
  subject = "Computer Science",
  topic = "",
  count = 5,
  difficulty = "Intermediate",
}) {
  const numQuestions = Math.max(1, Math.min(15, Number(count) || 5));
  const focusTopic = (topic || title || subject).trim();

  const prompt = `You are an expert academic professor creating a multiple-choice assessment test.
Test Title: "${title}"
Subject: "${subject}"
Specific Topic / Focus: "${focusTopic}"
Difficulty Level: "${difficulty}"
Number of Questions: ${numQuestions}

Generate exactly ${numQuestions} high-quality multiple-choice questions (MCQs).
Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "question": "Clear, specific question text?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctIndex": 0,
      "explanation": "Concise explanation of why the correct option is right."
    }
  ]
}
Rules:
- Each question must have exactly 4 distinct, realistic options (strings without 'A.'/'B.' prefixes).
- "correctIndex" must be an integer 0, 1, 2, or 3 indicating the index of the correct option.
- Questions must be directly relevant to "${focusTopic}" and "${subject}".`;

  try {
    const rawText = await generateContentWithAI(prompt);
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.questions)
      ? parsed.questions
      : [];

    if (list.length > 0) {
      return list.slice(0, numQuestions).map((q, idx) => {
        const opts =
          Array.isArray(q.options) && q.options.length >= 4
            ? q.options.slice(0, 4).map((o) => String(o))
            : [
                "Primary architectural approach",
                "Optimized implementation pattern",
                "Deprecated legacy method",
                "Unverified manual workaround",
              ];
        const cIdx =
          typeof q.correctIndex === "number" &&
          q.correctIndex >= 0 &&
          q.correctIndex <= 3
            ? q.correctIndex
            : 0;
        return {
          id: `ai-q-${Date.now()}-${idx + 1}`,
          question: String(q.question || `Question ${idx + 1} on ${focusTopic}`),
          options: opts,
          correctIndex: cIdx,
          explanation: String(
            q.explanation ||
              `Option ${String.fromCharCode(65 + cIdx)} is the correct principle for ${focusTopic}.`
          ),
        };
      });
    }
  } catch (err) {
    console.warn("Gemini MCQ parse fallback:", err?.message);
  }

  // Intelligent topic-specific fallback bank if API is offline or rate-limited
  const templates = [
    {
      question: `In ${subject} (${focusTopic}), what is the primary advantage of following a modular and well-structured design pattern?`,
      options: [
        "Improved scalability, maintainability, and testability across components",
        "Increased runtime memory overhead without benefit",
        "Eliminates the need for any input validation",
        "Prevents asynchronous execution entirely",
      ],
      correctIndex: 0,
      explanation: `Modular architecture in ${focusTopic} directly improves maintainability, reuse, and isolated unit testing.`,
    },
    {
      question: `Which approach best optimizes performance when working with ${focusTopic} in ${subject}?`,
      options: [
        "Executing redundant blocking operations on the main thread",
        "Minimizing unnecessary recomputations and using efficient data structures",
        "Storing all state in unindexed global variables",
        "Disabling caching and memoization mechanisms",
      ],
      correctIndex: 1,
      explanation: `Minimizing redundant work and choosing optimal data structures ensures high performance in ${focusTopic}.`,
    },
    {
      question: `When debugging or validating an implementation of ${focusTopic}, what should be verified first?`,
      options: [
        "Only visual styling without checking data flow",
        "Boundary conditions, input constraints, and core state transitions",
        "Randomly changing configuration constants",
        "Skipping error handling blocks",
      ],
      correctIndex: 1,
      explanation: `Checking boundary conditions, edge cases, and state transitions catches the majority of logic defects in ${focusTopic}.`,
    },
    {
      question: `What is the most reliable way to handle edge cases and unexpected inputs in ${focusTopic}?`,
      options: [
        "Graceful error handling, schema validation, and deterministic fallbacks",
        "Ignoring exceptions and allowing silent failures",
        "Hardcoding a single static test value",
        "Terminating the process without logging",
      ],
      correctIndex: 0,
      explanation: `Validation and deterministic fallback handling ensure resilience in production ${subject} systems.`,
    },
    {
      question: `Which metric is most important when evaluating the efficiency of a ${focusTopic} solution in ${subject}?`,
      options: [
        "Number of lines of comments in the file",
        "Time complexity, space complexity, and reliability under load",
        "Length of variable identifiers",
        "File creation timestamp",
      ],
      correctIndex: 1,
      explanation: `Algorithmic time/space complexity and runtime reliability are the standard engineering benchmarks for ${focusTopic}.`,
    },
    {
      question: `In an advanced ${focusTopic} workflow, why is separation of concerns critical?`,
      options: [
        "It couples UI rendering directly to database queries",
        "It isolates business logic from presentation, making updates safe and predictable",
        "It doubles network latency",
        "It prevents code reuse across modules",
      ],
      correctIndex: 1,
      explanation: `Separation of concerns decouples core logic from the view layer, allowing independent testing and evolution.`,
    },
    {
      question: `Which testing strategy provides the strongest confidence when deploying changes to ${focusTopic}?`,
      options: [
        "Combining unit tests for core logic with integration tests for end-to-end flows",
        "Relying exclusively on manual inspection in production",
        "Testing only with empty inputs",
        "Skipping automated checks to save build time",
      ],
      correctIndex: 0,
      explanation: `Unit tests verify isolated functions while integration tests confirm that ${focusTopic} components work together properly.`,
    },
  ];

  return Array.from({ length: numQuestions }, (_, idx) => {
    const tpl = templates[idx % templates.length];
    return {
      id: `ai-q-${Date.now()}-${idx + 1}`,
      question: tpl.question,
      options: [...tpl.options],
      correctIndex: tpl.correctIndex,
      explanation: tpl.explanation,
    };
  });
}

export default generateContentWithAI;

