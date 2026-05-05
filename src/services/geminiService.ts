import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface OCRResult {
  vendor: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  description: string;
}

export async function performOCR(fileData: string, mimeType: string): Promise<OCRResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: "Extract the following details from this receipt image: vendor name, total amount, currency (3-letter code), category (e.g., Travel, Food, Supplies), date of transaction, and a brief description. Return as JSON.",
          },
          {
            inlineData: {
              data: fileData.split(',')[1] || fileData,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vendor: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          currency: { type: Type.STRING },
          category: { type: Type.STRING },
          date: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["vendor", "amount", "currency", "category", "date", "description"],
      },
    },
  });

  const text = response.text || '{}';
  return JSON.parse(text) as OCRResult;
}
