
export type AppView = 'studio' | 'inspiration' | 'image_generator' | 'library';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string; image?: string; imageMime?: string }[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export interface LibraryImage {
  id: string;
  imageData: string; // base64 string without data URI prefix
  mimeType: string;
  prompt: string;
  createdAt: string; // ISO string
}
