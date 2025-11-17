
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types';
import * as geminiService from '../services/geminiService';
import * as libraryStore from '../utils/libraryStore';
import { Icon } from './Icon';

interface ChatProps {
  initialImage: string;
  initialMimeType: string;
  onBack: () => void;
}

export const Chat: React.FC<ChatProps> = ({ initialImage, initialMimeType, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', parts: [{ text: "Here is your 2D design. How would you like to refine it? For example, you can say 'add a retro filter' or 'make the snake red'.", image: initialImage, imageMime: initialMimeType }] }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedImages, setSavedImages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSaveImage = (imageData: string, prompt: string) => {
    libraryStore.saveImageToLibrary({
        imageData,
        mimeType: 'image/png',
        prompt: `Chat refinement: ${prompt}`
    });
    setSavedImages(prev => new Set(prev).add(imageData));
  };


  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const lastModelImageMsg = [...messages, userMessage].reverse().find(m => m.role === 'model' && m.parts.some(p => p.image));
      const contextImagePart = lastModelImageMsg?.parts.find(p => p.image);
      
      if (!contextImagePart?.image || !contextImagePart?.imageMime) {
          throw new Error("Could not find a base image to edit.");
      }

      const newImageBase64 = await geminiService.sendMessageWithImageEdit(currentInput, contextImagePart.image, contextImagePart.imageMime);

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Here is the updated design based on: "${currentInput}"`, image: newImageBase64, imageMime: 'image/png' }] }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I couldn't process that request. Please try again." }] }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);


  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-gray-800/50 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">Design Chat</h2>
        <button onClick={onBack} className="text-gray-400 hover:text-white">&times;</button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0"><Icon name="spark" className="w-5 h-5 text-white" /></div>}
              <div className={`max-w-md lg:max-w-lg rounded-xl p-3 ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                {msg.parts.map((part, partIndex) => (
                  <div key={partIndex}>
                    {part.text && <p className="mb-2">{part.text}</p>}
                    {part.image && (
                      <div className="relative group">
                        <img src={`data:${part.imageMime};base64,${part.image}`} alt="Tattoo design" className="rounded-lg bg-white p-1" />
                        <button
                          onClick={() => handleSaveImage(part.image!, msg.parts[0].text)}
                          disabled={savedImages.has(part.image)}
                          title={savedImages.has(part.image) ? "Saved to Library" : "Save to Library"}
                          className="absolute top-2 right-2 p-2 bg-gray-900/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-600 disabled:bg-green-600 disabled:opacity-100"
                        >
                           <Icon name={savedImages.has(part.image) ? "bookmarkSolid" : "bookmark"} className="w-4 h-4"/>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0"><Icon name="spark" className="w-5 h-5 text-white" /></div>
              <div className="max-w-md rounded-xl p-3 bg-gray-700 text-gray-200 rounded-bl-none">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
	                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
	                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., make it black and white..."
            className="flex-grow bg-gray-700 border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-500" disabled={isLoading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
