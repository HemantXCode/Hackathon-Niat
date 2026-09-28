import { GoogleGenAI, Type, type Schema } from "@google/genai";
import type {
  CropAdvisoryInput,
  CropAdvisoryData,
  PestAdvisoryInput,
  PestAdvisoryData,
} from "@workspace/api-zod";

const SYSTEM_INSTRUCTION =
  "You are AgroAdvisor AI, an expert, highly knowledgeable, and empathetic agricultural extension assistant. Your goal is to help farmers make sustainable, profitable decisions. Always prioritize organic and Integrated Pest Management (IPM) solutions before chemical interventions. If recommending chemicals, mandate the use of PPE. Format all responses strictly in the requested JSON schema without markdown blocks.";

const cropResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    recommendedCrops: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          cropName: { type: Type.STRING },
          viabilityScore: { type: Type.INTEGER },
          expectedYieldPerAcre: { type: Type.STRING },
          waterRequirements: { type: Type.STRING },
          whyItFits: { type: Type.STRING },
        },
        required: [
          "cropName",
          "viabilityScore",
          "expectedYieldPerAcre",
          "waterRequirements",
          "whyItFits",
        ],
      },
    },
    soilPreparationTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["recommendedCrops", "soilPreparationTips"],
};

const pestResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    likelyDiagnoses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          diseaseOrPestName: { type: Type.STRING },
          confidenceLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          symptomsMatch: { type: Type.STRING },
        },
        required: ["diseaseOrPestName", "confidenceLevel", "symptomsMatch"],
      },
    },
    immediateActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    longTermPrevention: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["likelyDiagnoses", "immediateActions", "longTermPrevention"],
};

const cropFallback = (input: CropAdvisoryInput): CropAdvisoryData => ({
  recommendedCrops:
    input.climateZone === "Arid" || input.waterAvailability === "Rainfed only"
      ? [
          {
            cropName: "Pearl millet",
            viabilityScore: 86,
            expectedYieldPerAcre: "8–12 quintals",
            waterRequirements: "Low; thrives on seasonal rainfall",
            whyItFits:
              "Pearl millet handles heat and intermittent moisture well. It is a resilient choice for water-limited fields and supports reliable grain production.",
          },
          {
            cropName: "Chickpea",
            viabilityScore: 79,
            expectedYieldPerAcre: "5–8 quintals",
            waterRequirements: "Low to moderate; one protective irrigation helps",
            whyItFits:
              "Chickpea performs well in lighter soils and cooler dry seasons. Its nitrogen-fixing habit can also support soil health in rotation.",
          },
        ]
      : [
          {
            cropName: "Tomato",
            viabilityScore: 84,
            expectedYieldPerAcre: "180–240 quintals",
            waterRequirements: "Moderate; consistent drip irrigation preferred",
            whyItFits:
              "Tomato can reward well-managed irrigated fields with strong market demand. The crop suits a planned fertility and trellising program.",
          },
          {
            cropName: "Maize",
            viabilityScore: 81,
            expectedYieldPerAcre: "25–35 quintals",
            waterRequirements: "Moderate; regular moisture during flowering",
            whyItFits:
              "Maize is adaptable across many soil types and provides a dependable cereal option. Timely irrigation and balanced nutrition are important for yield.",
          },
        ],
  soilPreparationTips: [
    "Test soil pH and organic carbon before applying fertilizer.",
    "Incorporate well-matured compost and keep crop residues as surface mulch where possible.",
    "Prepare drainage channels before the first heavy rain and avoid working saturated soil.",
    "Plan a rotation with a pulse crop to support long-term soil fertility.",
  ],
});

const pestFallback = (input: PestAdvisoryInput): PestAdvisoryData => ({
  likelyDiagnoses: [
    {
      diseaseOrPestName:
        input.plantPartAffected === "Leaves"
          ? "Early fungal leaf spot or sap-sucking pest damage"
          : "Root or stem stress with possible secondary infection",
      confidenceLevel: "Medium",
      symptomsMatch:
        "The described symptoms are compatible with more than one cause. Inspect the underside of leaves, nearby plants, and soil moisture before treating.",
    },
  ],
  immediateActions: [
    "Isolate the most affected plants and remove severely damaged tissue using clean tools.",
    "Check leaf undersides, stems, and the root zone for insects, webbing, lesions, or foul odor.",
    "Improve airflow and avoid overhead irrigation until the cause is confirmed.",
    "Use a low-risk, locally approved IPM treatment only after confirming the pest or disease.",
  ],
  longTermPrevention: [
    "Scout the crop twice each week and record where symptoms first appear.",
    "Use clean seed or planting material and remove crop debris after harvest.",
    "Rotate crop families and avoid excessive nitrogen that creates soft, pest-prone growth.",
    "If a chemical is ultimately required, follow the label and use gloves, eye protection, and a mask.",
  ],
});

const parseModelJson = (text: string | undefined): unknown => {
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
};

async function generate<T>(
  prompt: string,
  responseSchema: Schema,
  fallback: T,
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    });
    return parseModelJson(response.text) as T;
  } catch {
    return fallback;
  }
}

export function generateCropAdvisory(
  input: CropAdvisoryInput,
): Promise<CropAdvisoryData> {
  return generate(
    `Create a crop recommendation for this farm. Region: ${input.location}. Soil: ${input.soilType}. Climate: ${input.climateZone}. Water availability: ${input.waterAvailability}. Farm size: ${input.farmSizeAcres} acres. Recommend practical, locally adaptable options and explain the fit.`,
    cropResponseSchema,
    cropFallback(input),
  );
}

export function generatePestAdvisory(
  input: PestAdvisoryInput,
): Promise<PestAdvisoryData> {
  return generate(
    `Diagnose these crop symptoms and provide an integrated pest management plan. Crop: ${input.cropName}. Affected plant part: ${input.plantPartAffected}. Symptoms: ${input.symptomDescription}. Visible for: ${input.durationDays} days. Give a cautious, actionable differential diagnosis rather than overstating certainty.`,
    pestResponseSchema,
    pestFallback(input),
  );
}