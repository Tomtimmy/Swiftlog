import { GoogleGenAI, Type } from "@google/genai";
import { Shipment, InventoryItem, Task } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export async function getLogisticsInsights(
  shipments: Shipment[],
  inventory: InventoryItem[],
  tasks: Task[]
) {
  const context = {
    activeShipments: shipments.map(s => ({
      id: s.id,
      tracking: s.trackingNumber,
      origin: s.origin,
      destination: s.destination,
      status: s.status,
      eta: s.estimatedDelivery
    })),
    inventoryLevels: inventory.map(i => ({
      sku: i.sku,
      name: i.name,
      qty: i.quantity,
      location: i.locationId
    })),
    pendingTasks: tasks.filter(t => t.status !== 'COMPLETED').map(t => ({
      title: t.title,
      priority: t.priority
    }))
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a deep logistical audit based on the following terminal data: ${JSON.stringify(context)}. Provide high-level technical insights.`,
      config: {
        systemInstruction: `You are the SwiftConnect AI Logistics Orchestrator. 
        Your goal is to analyze real-time data and provide actionable, high-priority insights for a fleet manager.
        Focus on:
        1. Delay risks (if any).
        2. Inventory shortages.
        3. Operational bottlenecks.
        Return your response in standard JSON format with a 'summary' string and an 'insights' array of objects { type: 'RISK'|'OPTIMIZATION'|'INFO', label: string, description: string, priority: 'LOW'|'MEDIUM'|'HIGH' }.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['RISK', 'OPTIMIZATION', 'INFO'] },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] }
                },
                required: ['type', 'label', 'description', 'priority']
              }
            }
          },
          required: ['summary', 'insights']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Insights Error:", error);
    return {
      summary: "AI Telemetry Interrupted. Check connection to core network.",
      insights: [
        { type: 'RISK', label: 'Telemetry Dropout', description: 'Real-time AI analysis is currently unavailable.', priority: 'HIGH' }
      ]
    };
  }
}
