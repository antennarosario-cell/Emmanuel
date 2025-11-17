
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, GroundingChunk } from '../types';
import * as geminiService from '../services/geminiService';
import { Icon } from './Icon';

export const Inspiration: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  const handleSendMessage = useCallback(async (e: React.FormEvent, prompt?: string) => {
    e.preventDefault();
    const messageText = prompt || input;
    if (!messageText.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', parts: [{ text: messageText }] }];
    setMessages(newMessages);
    if (!prompt) setInput('');
    setIsLoading(true);
    setSources([]);

    try {
      const result = await geminiService.askWithGoogleSearch(messageText);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: result.text }] }]);
      setSources(result.groundingChunks || []);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I couldn't get an answer for that. Please try again." }] }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);
  
  const QuickPromptButton: React.FC<{ text: string }> = ({ text }) => (
    <button
      onClick={(e) => handleSendMessage(e, text)}
      className="bg-gray-700/80 text-left p-3 rounded-lg hover:bg-gray-600/80 transition-colors text-sm"
      disabled={isLoading}
    >
      {text}
    </button>
  );

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-gray-800/50 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-center">Tattoo Inspiration</h2>
        <p className="text-center text-sm text-gray-400">Ask about tattoo styles, history, or artists, powered by Google Search.</p>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.length === 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <QuickPromptButton text="What's the history of American traditional tattoos?" />
                <QuickPromptButton text="Find some examples of neo-traditional artists." />
                <QuickPromptButton text="Explain the symbolism of a dragon in Japanese tattoos." />
                <QuickPromptButton text="What are some popular fine-line tattoo ideas?" />
             </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0"><Icon name="spark" className="w-5 h-5 text-white" /></div>}
              <div className={`max-w-md lg:max-w-lg rounded-xl p-3 ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                 <div className="prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: msg.parts[0].text.replace(/\n/g, '<br />') }} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-2 justify-start">
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
          {sources.length > 0 && (
            <div className="pt-2">
                <h4 className="text-xs font-bold text-gray-400 mb-2">SOURCES:</h4>
                <div className="flex flex-wrap gap-2">
                    {sources.map((source, i) => source.web && (
                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" key={i} className="text-xs bg-gray-700 text-primary-300 px-2 py-1 rounded-md hover:bg-gray-600 transition">
                            {new URL(source.web.uri).hostname}
                        </a>
                    ))}
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
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
