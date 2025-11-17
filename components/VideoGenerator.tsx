import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as geminiService from '../services/geminiService';
import { Icon } from './Icon';

interface VideoGeneratorProps {
  designImage: string;
  designMimeType: string;
  onBack: () => void;
}

const loadingMessages = [
    "Warming up the virtual tattoo machine...",
    "Inking the digital skin...",
    "Applying realistic lighting and shadows...",
    "Finalizing the details...",
    "This can take a few minutes, hang tight!",
];

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ designImage, designMimeType, onBack }) => {
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [checkingApiKey, setCheckingApiKey] = useState(true);
  const [prompt, setPrompt] = useState('a person\'s forearm');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  const operationRef = useRef<any>(null);

  const checkApiKey = useCallback(async () => {
    setCheckingApiKey(true);
    // @ts-ignore
    if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
      setApiKeySelected(true);
    } else {
      setApiKeySelected(false);
    }
    setCheckingApiKey(false);
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);
  
  useEffect(() => {
    // FIX: Use ReturnType<typeof setInterval> for browser compatibility instead of NodeJS.Timeout
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
        interval = setInterval(() => {
            setLoadingMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                return loadingMessages[(currentIndex + 1) % loadingMessages.length];
            });
        }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSelectKey = async () => {
    try {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Assume success and let the generate call verify
        setApiKeySelected(true);
        setError(null);
    } catch (e) {
        console.error("Error opening API key selection:", e);
        setError("Could not open the API key selection dialog.");
    }
  };

  const pollOperation = useCallback(async (op: any) => {
    try {
        const updatedOp = await geminiService.pollVideoOperation(op);
        operationRef.current = updatedOp;

        if (updatedOp.done) {
            const uri = updatedOp.response?.generatedVideos?.[0]?.video?.uri;
            if (uri) {
                const videoBlob = await geminiService.fetchVideo(uri);
                setVideoUrl(URL.createObjectURL(videoBlob));
            } else {
                throw new Error("Video generation completed, but no video URI was found.");
            }
            setIsLoading(false);
        } else {
            setTimeout(() => pollOperation(updatedOp), 10000); // Poll every 10 seconds
        }
    } catch (e: any) {
        console.error("Polling error:", e);
        setError(`An error occurred while checking video status: ${e.message}`);
        setIsLoading(false);
    }
  }, []);

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
        setError("Please describe the body part for the simulation.");
        return;
    }
    setError(null);
    setIsLoading(true);
    setVideoUrl(null);
    setLoadingMessage(loadingMessages[0]);

    try {
      const fullPrompt = `Create a realistic video showing this tattoo design on ${prompt}. Show the final, healed tattoo on the skin.`;
      const initialOp = await geminiService.generateVideo(fullPrompt, designImage, designMimeType, aspectRatio);
      operationRef.current = initialOp;
      pollOperation(initialOp);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Requested entity was not found")) {
          setError("API Key not found. Please select a valid API key.");
          setApiKeySelected(false);
      } else {
          setError(`Failed to start video generation: ${e.message}`);
      }
      setIsLoading(false);
    }
  };
  
  if (checkingApiKey) {
      return <div>Checking API Key...</div>
  }

  if (!apiKeySelected) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800/50 rounded-xl max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">API Key Required for Video Generation</h2>
            <p className="text-gray-400 mb-6">
                The Veo video model requires you to select an API key associated with a project that has billing enabled.
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline ml-1">Learn more</a>
            </p>
            <button onClick={handleSelectKey} className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition">
                Select API Key
            </button>
            {error && <p className="text-red-400 mt-4">{error}</p>}
             <button onClick={onBack} className="mt-6 text-sm text-gray-400 hover:text-white">← Back to Studio</button>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-6 bg-gray-800/50 rounded-xl shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Video Simulation</h2>
        <button onClick={onBack} className="text-gray-400 hover:text-white">&times;</button>
      </div>

      {isLoading ? (
        <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-400 mx-auto"></div>
            <p className="mt-4 text-lg font-semibold text-gray-300">{loadingMessage}</p>
        </div>
      ) : videoUrl ? (
         <div className="space-y-4">
            <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg shadow-lg"></video>
            <div className="flex justify-center gap-4">
              <a href={videoUrl} download="tattoo_simulation.mp4" className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
                Download Video
              </a>
              <button onClick={() => setVideoUrl(null)} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition">
                Create Another
              </button>
            </div>
         </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 md:w-1/3">
            <img src={`data:${designMimeType};base64,${designImage}`} alt="Tattoo Design" className="rounded-lg shadow-lg bg-white p-1"/>
          </div>
          <div className="flex-grow space-y-4">
            <div>
              <label htmlFor="bodyPart" className="block text-sm font-medium text-gray-300 mb-1">Body Part</label>
              <input 
                id="bodyPart"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., left bicep, shoulder blade"
                className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
              <div className="flex gap-2">
                <button onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 rounded-lg ${aspectRatio === '16:9' ? 'bg-primary-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Landscape (16:9)</button>
                <button onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 rounded-lg ${aspectRatio === '9:16' ? 'bg-primary-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Portrait (9:16)</button>
              </div>
            </div>
            <button onClick={handleGenerateVideo} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition transform hover:scale-105 shadow-lg">
                <Icon name="movie" className="w-5 h-5"/>
                Generate Video
            </button>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};