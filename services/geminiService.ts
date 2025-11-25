import { GoogleGenAI, Type } from "@google/genai";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../constants";
import { TransactionType } from "../types";

// Helper function to safely get the API Key in different environments
const getApiKey = (): string => {
  let key = '';
  try {
    // Check for Vite environment variable
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      key = import.meta.env.VITE_API_KEY;
    }
    // Check for standard process.env
    else if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      key = process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Error reading environment variables", e);
  }
  return key ? key.trim() : '';
};

const apiKey = getApiKey();
// Only initialize if key exists to prevent immediate crash
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to clean JSON string (remove markdown code blocks if present)
const cleanJsonString = (str: string): string => {
  if (!str) return '{}';
  // Remove ```json and ``` if they exist
  let clean = str.replace(/```json/g, '').replace(/```/g, '');
  return clean.trim();
};

export const categorizeTransaction = async (
  description: string,
  amount: number,
  type: TransactionType
): Promise<string> => {
  const isIncome = type === TransactionType.INCOME;
  const defaultCategory = isIncome ? 'Other Income' : 'Miscellaneous';

  // Fail fast if no API key
  if (!ai) {
    console.warn("Missing API Key. Using default category.");
    return defaultCategory;
  }

  try {
    const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    
    const guidance = isIncome 
      ? `Categories: ${INCOME_CATEGORIES.join(', ')}. 
         - Salary: Payroll, ADP, Workday. 
         - Investment: Dividends, interest, crypto. 
         - Gift: Venmo/Zelle transfers from friends.` 
      : `Categories: ${EXPENSE_CATEGORIES.join(', ')}. 
         - Food & Drink: Restaurants, coffee (Starbucks), bars, UberEats.
         - Groceries: Supermarkets (Whole Foods, Kroger, Trader Joe's).
         - Transport: Gas (Shell), Uber (rides), parking, public transit.
         - Shopping: Amazon, Target, Clothing, Electronics.
         - Housing: Rent, mortgage, repairs.
         - Utilities: Internet, phone, electricity, subscriptions (Netflix).`;

    const prompt = `Categorize this transaction: "${description}" ($${amount}). Return JSON: { "category": "Name" }`;

    // Create a timeout promise to prevent the UI from hanging indefinitely
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Gemini request timed out")), 8000)
    );

    const apiPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are a financial assistant. 
        Definitions: ${guidance}
        Return ONLY raw JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING }
          }
        }
      }
    });

    // Race the API call against the timeout
    // @ts-ignore
    const response = await Promise.race([apiPromise, timeoutPromise]);

    // @ts-ignore
    const jsonText = cleanJsonString(response.text);
    if (!jsonText) return defaultCategory;

    const parsed = JSON.parse(jsonText);
    
    if (categories.includes(parsed.category)) {
      return parsed.category;
    }
    
    return defaultCategory;

  } catch (error) {
    // Log error but don't crash app
    console.error("Categorization failed (using default):", error);
    return defaultCategory;
  }
};