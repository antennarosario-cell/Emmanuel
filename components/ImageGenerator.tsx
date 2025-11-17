
import React, { useState, useCallback } from 'react';
import { Icon } from './Icon';
import * as geminiService from '../services/geminiService';
import * as libraryStore from '../utils/libraryStore';

interface ImageGeneratorProps {
  onDesignReady: (imageData: string, mimeType: string, prompt: string) => void;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onDesignReady }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16'>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your tattoo idea.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setIsSaved(false);

    try {
      const fullPrompt = `A clean, 2D vector-style tattoo design of ${prompt}. Bold lines, solid white background, suitable for printing as a stencil.`;
      const imageBytes = await geminiService.generateImage(fullPrompt, aspectRatio);
      setGeneratedImage(imageBytes);
    } catch (e) {
      console.error(e);
      setError('Sorry, the image could not be generated. Please try a different prompt.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio]);

  const handleUseDesign = () => {
    if (generatedImage) {
        onDesignReady(generatedImage, 'image/png', prompt);
    }
  }
  
  const handleSaveToLibrary = () => {
    if (generatedImage) {
        libraryStore.saveImageToLibrary({
            imageData: generatedImage,
            mimeType: 'image/png',
            prompt: prompt,
        });
        setIsSaved(true);
    }
  }


  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gray-800/50 rounded-xl shadow-2xl p-6 space-y-6">
        <div className="text-center">
            <h2 className="text-2xl font-bold">Tattoo Idea Generator</h2>
            <p className="text-gray-400">Describe your idea and let AI bring it to life.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
           <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., a majestic lion wearing a crown, in a geometric style"
            className="flex-grow bg-gray-700 border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2">
             <div className="flex gap-2">
                <button onClick={() => setAspectRatio('1:1')} className={`px-4 py-2 w-full rounded-lg text-sm ${aspectRatio === '1:1' ? 'bg-primary-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Square (1:1)</button>
                <button onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 w-full rounded-lg text-sm ${aspectRatio === '9:16' ? 'bg-primary-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Tall (9:16)</button>
              </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition transform hover:scale-105 shadow-lg disabled:bg-gray-500 disabled:scale-100"
            >
                <Icon name="spark" className="w-5 h-5"/>
                {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-center">{error}</div>}

        <div className="w-full bg-gray-900/50 min-h-[300px] flex items-center justify-center rounded-lg">
            {isLoading ? (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto"></div>
                    <p className="mt-3 text-gray-400">Creating your design...</p>
                </div>
            ) : generatedImage ? (
                <div className="p-4 flex flex-col items-center gap-4">
                    <img src={`data:image/png;base64,${generatedImage}`} alt="Generated tattoo design" className="max-w-full max-h-80 object-contain rounded-md bg-white p-1" />
                     <div className="flex flex-wrap justify-center gap-2">
                        <button onClick={handleUseDesign} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition transform hover:scale-105 shadow-lg">
                            <Icon name="document_scanner" className="w-5 h-5" />
                            Use in Studio
                        </button>
                         <button onClick={handleSaveToLibrary} disabled={isSaved} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition transform hover:scale-105 shadow-lg disabled:bg-green-600">
                            <Icon name={isSaved ? "bookmarkSolid" : "bookmark"} className="w-5 h-5" />
                            {isSaved ? 'Saved!' : 'Save to Library'}
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-gray-500">Your generated image will appear here</p>
            )}
        </div>
      </div>
    </div>
  );
};
