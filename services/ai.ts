import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserProfile, Scheme } from "../types";
import { findMatchingSchemes, MatchResult } from "./matchingEngine";

// ── AWS Bedrock Client ───────────────────────────────────────────
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// ── Gemini Client (Backup) ───────────────────────────────────────
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ── Shared Prompts ───────────────────────────────────────────────
const ID_CARD_PROMPT = `You are an expert at reading Indian government ID cards (Aadhaar, Voter ID, PAN, etc.).

I am giving you TWO images:
- Image 1: FRONT side of the ID card (usually has Name, Date of Birth, Gender, Photo)
- Image 2: BACK side of the ID card (usually has Address, District, State, Pincode)

Please extract the following information by reading BOTH images carefully:
1. name - Full name (in English only, even if Hindi is also present)
2. gender - Must be one of: "Male", "Female", or "Other"
3. dateOfBirth - The Date of Birth in YYYY-MM-DD format (e.g. "1995-03-15")
4. state - The Indian state name in English
5. district - The district name in English

Return ONLY a valid JSON object with these exact keys: name, gender, dateOfBirth, state, district
Do NOT include any explanation, markdown, or extra text. ONLY the JSON object.
If you cannot read a field clearly, use an empty string "" for that field.`;

const buildSummarizationPrompt = (scheme: Scheme, language: string): string => {
  return `You are a helpful government assistant for Indian citizens who may have low literacy.

Your task is to explain this government scheme in ${language} using very simple, everyday language.

IMPORTANT RULES:
- Write ENTIRELY in ${language} language. Every single word must be in ${language}.
- Use very short, simple sentences that anyone can understand.
- Avoid all jargon, technical terms, and complex words.
- Write as if explaining to a person who has never heard of this scheme.
- Cover ALL important details: who can apply, what benefits they get, and how much money (if any).
- Be accurate and complete — do not skip any important information.
- Keep it under 150 words.
- Do not include any markdown formatting, bullet points, or special characters.

Scheme Name: ${scheme.title}
Description: ${scheme.description}
Benefits: ${scheme.benefits?.map(b => b.title + ' - ' + b.description).join(', ') || 'Not specified'}
Amount: ${scheme.amount || 'Not specified'}

Write the full explanation now in ${language}:`;
};

// ── Helper: Parse JSON from AI response text ─────────────────────
const parseJsonFromText = (text: string): Record<string, string> | null => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
  return null;
};

// ══════════════════════════════════════════════════════════════════
//  AADHAAR / ID CARD EXTRACTION
// ══════════════════════════════════════════════════════════════════

/**
 * AWS Bedrock extraction (primary).
 */
const extractWithBedrock = async (
  frontBase64: string,
  backBase64: string
): Promise<Partial<UserProfile>> => {
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: frontBase64 },
          },
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: backBase64 },
          },
          { type: "text", text: ID_CARD_PROMPT },
        ],
      },
    ],
  };

  const command = new InvokeModelCommand({
    modelId: "apac.anthropic.claude-3-haiku-20240307-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const text = responseBody.content?.[0]?.text || "";
  return parseJsonFromText(text) || {};
};

/**
 * Gemini extraction (fallback).
 */
const extractWithGemini = async (
  frontBase64: string,
  backBase64: string
): Promise<Partial<UserProfile>> => {
  const result = await geminiModel.generateContent([
    {
      inlineData: { mimeType: "image/jpeg", data: frontBase64 },
    },
    {
      inlineData: { mimeType: "image/jpeg", data: backBase64 },
    },
    { text: ID_CARD_PROMPT },
  ]);

  const text = result.response.text();
  return parseJsonFromText(text) || {};
};

/**
 * Extracts profile data from front and back of an ID card.
 * Primary: AWS Bedrock (Claude Haiku) → Fallback: Google Gemini 2.5
 */
export const extractProfileFromIdCard = async (
  frontBase64: string,
  backBase64: string
): Promise<Partial<UserProfile>> => {
  // ── Try AWS Bedrock first ──────────────────────────────────────
  try {
    console.log("[AI] Trying AWS Bedrock for ID card extraction...");
    const result = await extractWithBedrock(frontBase64, backBase64);
    if (result && Object.keys(result).filter(k => (result as any)[k]).length >= 2) {
      console.log("[AI] AWS Bedrock extraction succeeded.");
      return result;
    }
    throw new Error("Bedrock returned insufficient data");
  } catch (bedrockError) {
    console.warn("[AI] AWS Bedrock extraction failed:", bedrockError);
  }

  // ── Fallback to Gemini ─────────────────────────────────────────
  try {
    console.log("[AI] Falling back to Gemini for ID card extraction...");
    const result = await extractWithGemini(frontBase64, backBase64);
    if (result && Object.keys(result).filter(k => (result as any)[k]).length >= 2) {
      console.log("[AI] Gemini extraction succeeded.");
      return result;
    }
    throw new Error("Gemini returned insufficient data");
  } catch (geminiError) {
    console.error("[AI] Gemini extraction also failed:", geminiError);
  }

  // ── Both failed ────────────────────────────────────────────────
  console.error("[AI] Both AWS and Gemini failed for ID card extraction.");
  return {};
};

// ══════════════════════════════════════════════════════════════════
//  SCHEME MATCHING (Cloud Backend)
// ══════════════════════════════════════════════════════════════════

/**
 * Finds matching schemes using the AWS Cloud Backend (DynamoDB + Lambda).
 */
export const generateSchemes = async (profile: UserProfile): Promise<MatchResult[]> => {
  try {
    const response = await fetch("https://mvcoel7xtk.execute-api.ap-south-1.amazonaws.com/prod/matches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      throw new Error(`Cloud API returned ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      console.log(`Cloud matched ${data.length} schemes successfully.`);
      return data;
    }
    // If cloud returns empty array, fall through to local
    throw new Error("Cloud returned 0 results");
  } catch (error) {
    console.error("Cloud match error:", error);
    throw error; // No fallback, force cloud testing
  }
};

// ══════════════════════════════════════════════════════════════════
//  SUMMARY CACHE (Language-Keyed localStorage)
// ══════════════════════════════════════════════════════════════════

const SUMMARY_CACHE_PREFIX = "summary_";

const getCacheKey = (schemeId: string, language: string): string =>
  `${SUMMARY_CACHE_PREFIX}${schemeId}_${language}`;

/** Read a cached summary for a specific scheme + language. */
export const getCachedSummary = (schemeId: string, language: string): string | null => {
  try {
    return localStorage.getItem(getCacheKey(schemeId, language));
  } catch {
    return null;
  }
};

/** Save a summary to the cache. */
const saveSummaryToCache = (schemeId: string, language: string, summary: string): void => {
  try {
    localStorage.setItem(getCacheKey(schemeId, language), summary);
  } catch {
    // Storage full or unavailable — silently ignore
  }
};

// ══════════════════════════════════════════════════════════════════
//  SCHEME SUMMARIZATION
// ══════════════════════════════════════════════════════════════════

/**
 * AWS Bedrock summarization (primary).
 */
const simplifyWithBedrock = async (scheme: Scheme, language: string): Promise<string> => {
  const prompt = buildSummarizationPrompt(scheme, language);

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  const command = new InvokeModelCommand({
    modelId: "apac.anthropic.claude-3-haiku-20240307-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return responseBody.content?.[0]?.text || "";
};

/**
 * Gemini summarization (fallback).
 */
const simplifyWithGemini = async (scheme: Scheme, language: string): Promise<string> => {
  const prompt = buildSummarizationPrompt(scheme, language);
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
};

/**
 * Simplifies a scheme description for low-literacy users.
 * Checks localStorage cache first → AWS Bedrock → Gemini → error.
 * Successful results are saved to cache per scheme+language.
 */
export const simplifySchemeDescription = async (scheme: Scheme, language: string): Promise<string> => {
  // ── Check cache first ──────────────────────────────────────────
  const cached = getCachedSummary(scheme.id, language);
  if (cached) {
    console.log(`[AI] Cache hit for "${scheme.id}" in ${language}`);
    return cached;
  }

  // ── Try AWS Bedrock first ──────────────────────────────────────
  try {
    console.log("[AI] Trying AWS Bedrock for summarization...");
    const text = await simplifyWithBedrock(scheme, language);
    if (text && text.trim().length > 20) {
      console.log("[AI] AWS Bedrock summarization succeeded.");
      saveSummaryToCache(scheme.id, language, text);
      return text;
    }
    throw new Error("Bedrock returned empty or too short summary");
  } catch (bedrockError) {
    console.warn("[AI] AWS Bedrock summarization failed:", bedrockError);
  }

  // ── Fallback to Gemini ─────────────────────────────────────────
  try {
    console.log("[AI] Falling back to Gemini for summarization...");
    const text = await simplifyWithGemini(scheme, language);
    if (text && text.trim().length > 20) {
      console.log("[AI] Gemini summarization succeeded.");
      saveSummaryToCache(scheme.id, language, text);
      return text;
    }
    throw new Error("Gemini returned empty or too short summary");
  } catch (geminiError) {
    console.error("[AI] Gemini summarization also failed:", geminiError);
  }

  // ── Both failed ────────────────────────────────────────────────
  console.error("[AI] Both AWS and Gemini failed for summarization.");
  return "⚠️ Could not simplify at this time. Please try again later.";
};