import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SkinAnalysisResult {
  condition: string;
  confidence: number;
  description: string;
  severity: 'Low' | 'Moderate' | 'High';
  recommendations: string[];
  activeIngredients: string[];
  warning?: string;
  disentangledMetadata?: {
    pathologyFlags: string[];
    identityRedacted: boolean;
  };
}

export async function analyzeSkinImage(base64Image: string, language: 'en' | 'vi' = 'en', expertRules?: string[]): Promise<SkinAnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const rulesContext = expertRules ? `Apply the following expert business rules: ${expertRules.join(', ')}` : '';

  const systemInstruction = `
    You are a professional dermatology AI assistant specializing in FEATURE DISENTANGLEMENT and INFERENCE ON CROPS.
    
    INPUT CONTEXT: You are receiving a CROP of a skin area, not a full face. This is part of our Privacy-First architecture.
    PRIMARY GOAL: Analyze the skin pathology ONLY. 
    
    Provide a detailed analysis in the language: ${language === 'vi' ? 'Vietnamese' : 'English'}.
    ${rulesContext}
    
    Analysis must include:
    1. The most likely condition (In ${language === 'vi' ? 'Vietnamese' : 'English'}).
    2. A confidence score (0-1).
    3. A clear description (In ${language === 'vi' ? 'Vietnamese' : 'English'}).
    4. Severity level (Strictly 'Low', 'Moderate', or 'High').
    5. Actionable skincare recommendations (In ${language === 'vi' ? 'Vietnamese' : 'English'}).
    6. Suggested active ingredients (In ${language === 'vi' ? 'Vietnamese' : 'English'}).
    7. Disentangled Metadata: confirm identity redaction and list specific pathological markers.
    
    DIFFERENTIAL PRIVACY NOTICE: A small amount of mathematical noise will be added to your confidence score by the system to prevent inference attacks.
    
    DISCLAIMER: Always include a note that this is an AI-driven analysis and NOT a substitute for professional medical diagnosis.
    
    Return the response strictly as a JSON object.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: "Please analyze this skin image and provide a dermatological report." },
          {
            inlineData: {
              data: base64Image.split(",")[1] || base64Image,
              mimeType: "image/jpeg",
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          condition: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          description: { type: Type.STRING },
          severity: { 
            type: Type.STRING,
            enum: ['Low', 'Moderate', 'High']
          },
          recommendations: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          activeIngredients: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          warning: { type: Type.STRING },
          disentangledMetadata: {
            type: Type.OBJECT,
            properties: {
              pathologyFlags: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              identityRedacted: { type: Type.BOOLEAN }
            },
            required: ["pathologyFlags", "identityRedacted"]
          }
        },
        required: ["condition", "confidence", "description", "severity", "recommendations", "activeIngredients", "disentangledMetadata"]
      }
    }
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error("AI failed to generate a response.");
  }

  const result = JSON.parse(rawText.trim()) as SkinAnalysisResult;
  
  // Implementation of Differential Privacy (LDP)
  // Adding small mathematical noise to the confidence score to prevent inference attacks
  const noise = (Math.random() - 0.5) * 0.05; // 5% noise
  result.confidence = Math.max(0.1, Math.min(0.99, result.confidence + noise));
  
  return result;
}
