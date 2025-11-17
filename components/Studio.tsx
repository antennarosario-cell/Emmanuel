
import React, { useState, useCallback, useRef } from 'react';
import { fileToBase64 } from '../utils/fileUtils';
import * as geminiService from '../services/geminiService';
import * as libraryStore from '../utils/libraryStore';
import { Icon } from './Icon';
import { Chat } from './Chat';
import { VideoGenerator } from './VideoGenerator';

interface StudioProps {
  initialImage: string | null;
  initialImageMime: string | null;
  initialPrompt: string | null;
  onReset: () => void;
}

export const Studio: React.FC<StudioProps> = ({ initialImage, initialImageMime, initialPrompt, onReset }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage);
  const [uploadedMimeType, setUploadedMimeType] = useState<string | null>(initialImageMime);
  
  const [recreatedImage, setRecreatedImage] = useState<string | null>(initialImage);
  const [recreatedMimeType, setRecreatedMimeType] = useState<string | null>(initialImageMime);
  const [recreationPrompt, setRecreationPrompt] = useState<string | null>(initialPrompt);
  const [isRecreatedSaved, setIsRecreatedSaved] = useState(false);

  const [analysis, setAnalysis] = useState<{ style: string; concept: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'chat' | 'video'>('main');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setIsLoading(true);
      setUploadedImage(null);
      setRecreatedImage(null);
      setAnalysis(null);
      setIsRecreatedSaved(false);
      try {
        const base64String = await fileToBase64(file);
        const mimeType = file.type;
        setUploadedImage(base64String);
        setUploadedMimeType(mimeType);

        const analysisResult = await geminiService.analyzeTattoo(base64String, mimeType);
        setAnalysis({ style: analysisResult.style, concept: analysisResult.concept });
        setRecreationPrompt(analysisResult.recreationPrompt);

        const newImageBase64 = await geminiService.generateImage(analysisResult.recreationPrompt);
        setRecreatedImage(newImageBase64);
        setRecreatedMimeType('image/png');
      } catch (err) {
        console.error(err);
        setError('Failed to process image. Please try another one.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleSaveRecreated = () => {
    if (recreatedImage && recreationPrompt) {
        libraryStore.saveImageToLibrary({
            imageData: recreatedImage,
            mimeType: recreatedMimeType || 'image/png',
            prompt: recreationPrompt,
        });
        setIsRecreatedSaved(true);
    }
  }

  const triggerFileSelect = () => fileInputRef.current?.click();

  const resetAll = () => {
      setUploadedImage(null);
      setUploadedMimeType(null);
      setRecreatedImage(null);
      setRecreatedMimeType(null);
      setAnalysis(null);
      setIsLoading(false);
      setError(null);
      setView('main');
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onReset();
  }


  if (view === 'chat' && recreatedImage) {
    return <Chat initialImage={recreatedImage} initialMimeType={recreatedMimeType || 'image/png'} onBack={() => setView('main')} />;
  }
  
  if (view === 'video' && recreatedImage) {
    return <VideoGenerator designImage={recreatedImage} designMimeType={recreatedMimeType || 'image/png'} onBack={() => setView('main')} />;
  }


  const Uploader = () => (
    <div className="w-full max-w-2xl mx-auto text-center flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-2xl bg-gray-800/50">
      <Icon name="upload" className="w-16 h-16 text-primary-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Upload Your Tattoo</h2>
      <p className="text-gray-400 mb-6">Let AI analyze the style and recreate it for you.</p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <button onClick={triggerFileSelect} className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-transform transform hover:scale-105 shadow-lg">
        Select Image
      </button>
    </div>
  );

  const LoadingIndicator = () => (
    <div className="text-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-400 mx-auto"></div>
        <p className="mt-4 text-lg font-semibold text-gray-300">AI is analyzing your design...</p>
        <p className="text-gray-400">This might take a moment.</p>
    </div>
  );


  if (isLoading) {
    return <div className="flex-grow flex items-center justify-center">{LoadingIndicator()}</div>;
  }
  
  if (!uploadedImage && !recreatedImage) {
    return <div className="flex-grow flex items-center justify-center">{Uploader()}</div>;
  }

  return (
    <div className="flex-grow flex flex-col space-y-6">
      {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-center">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Original Tattoo</h3>
          {uploadedImage && <img src={`data:${uploadedMimeType};base64,${uploadedImage}`} alt="Uploaded Tattoo" className="rounded-lg shadow-lg w-full object-contain max-h-96" />}
        </div>
        <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-xl relative">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">2D Printable Version</h3>
          {recreatedImage && (
            <>
              <img src={`data:${recreatedMimeType};base64,${recreatedImage}`} alt="Recreated Tattoo" className="rounded-lg shadow-lg w-full object-contain max-h-96 bg-white" />
              <button
                  onClick={handleSaveRecreated}
                  disabled={isRecreatedSaved}
                  title={isRecreatedSaved ? "Saved to Library" : "Save to Library"}
                  className="absolute top-2 right-2 p-2 bg-gray-900/50 rounded-full text-white hover:bg-primary-600 disabled:bg-green-600 disabled:text-white transition-colors"
              >
                  <Icon name={isRecreatedSaved ? "bookmarkSolid" : "bookmark"} className="w-5 h-5"/>
              </button>
            </>
          )}
        </div>
      </div>
      
      {analysis && (
        <div className="p-4 bg-gray-800/50 rounded-xl">
          <h3 className="text-lg font-bold mb-2">AI Analysis</h3>
          <p><strong className="font-semibold text-primary-400">Style:</strong> {analysis.style}</p>
          <p><strong className="font-semibold text-primary-400">Concept:</strong> {analysis.concept}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
        <button onClick={() => setView('chat')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition transform hover:scale-105 shadow-lg">
          <Icon name="chat" className="w-5 h-5" />
          Refine with Chat
        </button>
        <button onClick={() => setView('video')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition transform hover:scale-105 shadow-lg">
          <Icon name="movie" className="w-5 h-5" />
          Create Video Simulation
        </button>
        <button onClick={resetAll} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition transform hover:scale-105 shadow-lg">
           <Icon name="arrowPath" className="w-5 h-5" />
           Start Over
        </button>
      </div>
    </div>
  );
};
