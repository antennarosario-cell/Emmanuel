
import { GoogleGenAI, type GenerateContentResponse, type Chat, Type, Modality } from "@google/genai";

// Assume API_KEY is set in the environment
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeTattoo = async (base64Image: string, mimeType: string): Promise<{ style: string, concept: string, recreationPrompt: string }> => {
  const prompt = `Analyze this tattoo image.
  1.  Identify the primary artistic style (e.g., American Traditional, Japanese Irezumi, Blackwork, Realism, Neo-traditional, etc.).
  2.  Describe the main concepts and subjects depicted in the tattoo.
  3.  Generate a detailed, descriptive prompt for an image generation AI. This prompt must instruct the AI to recreate the tattoo design as faithfully and similarly as possible to the original photo. The final image must be on a solid white background. If any part of the tattoo design is obscured, cropped, or not fully visible in the photo, the prompt must instruct the AI to intelligently and artistically complete the design, recreating the non-visible parts in a style that is perfectly consistent with the visible tattoo. The goal is to produce a complete, high-fidelity 2D representation of the full tattoo design, ready for printing.

  Return the response as a JSON object with the keys "style", "concept", and "recreationPrompt".`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt },
      ],
    },
    config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                style: { type: Type.STRING },
                concept: { type: Type.STRING },
                recreationPrompt: { type: Type.STRING },
            },
            required: ['style', 'concept', 'recreationPrompt']
        }
    }
  });

  const jsonString = response.text.trim();
  return JSON.parse(jsonString);
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1'): Promise<string> => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio,
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    return response.generatedImages[0].image.imageBytes;
  }
  throw new Error('Image generation failed.');
};

export const createChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
    });
};

export const sendMessageWithImageEdit = async (prompt: string, base64Image: string, mimeType: string): Promise<string> => {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error('Image editing failed to produce an image.');
};


export const generateVideo = async (prompt: string, base64Image: string, mimeType: string, aspectRatio: '16:9' | '9:16') => {
  // Always create a new instance before Veo calls to use the latest key
  const freshAI = new GoogleGenAI({ apiKey: API_KEY });

  let operation = await freshAI.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    image: {
      imageBytes: base64Image,
      mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio,
    }
  });

  return operation;
};

export const pollVideoOperation = async (operation: any) => {
   // Always create a new instance before Veo calls to use the latest key
  const freshAI = new GoogleGenAI({ apiKey: API_KEY });
  return await freshAI.operations.getVideosOperation({operation: operation});
}

export const fetchVideo = async (uri: string): Promise<Blob> => {
  const response = await fetch(`${uri}&key=${API_KEY}`);
  if (!response.ok) {
    throw new Error('Failed to fetch video file.');
  }
  return response.blob();
}


export const askWithGoogleSearch = async (prompt: string): Promise<{ text: string, groundingChunks: any[] }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return {
    text: response.text,
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
  };
};
