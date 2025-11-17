
import React, { useState, useCallback } from 'react';
import { Studio } from './components/Studio';
import { Header } from './components/Header';
import { Inspiration } from './components/Inspiration';
import { ImageGenerator } from './components/ImageGenerator';
import { Library } from './components/Library';
import { Icon } from './components/Icon';
import type { AppView } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('studio');
  const [initialImage, setInitialImage] = useState<string | null>(null);
  const [initialImageMime, setInitialImageMime] = useState<string | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  const handleDesignReady = useCallback((imageData: string, mimeType: string, prompt: string) => {
    setInitialImage(imageData);
    setInitialImageMime(mimeType);
    setInitialPrompt(prompt);
    setView('studio');
  }, []);

  const resetStudio = useCallback(() => {
    setInitialImage(null);
    setInitialImageMime(null);
    setInitialPrompt(null);
    setView('studio');
  }, []);

  const renderView = () => {
    switch (view) {
      case 'inspiration':
        return <Inspiration />;
      case 'image_generator':
        return <ImageGenerator onDesignReady={handleDesignReady} />;
       case 'library':
        return <Library onUseDesign={handleDesignReady} />;
      case 'studio':
      default:
        return <Studio initialImage={initialImage} initialImageMime={initialImageMime} initialPrompt={initialPrompt} onReset={resetStudio} />;
    }
  };

  const NavButton = ({
    targetView,
    icon,
    label,
  }: {
    targetView: AppView;
    icon: string;
    label: string;
  }) => (
    <button
      onClick={() => setView(targetView)}
      className={`flex flex-col items-center justify-center space-y-1 w-20 px-1 py-2 rounded-lg transition-all duration-200 ${
        view === targetView
          ? 'bg-primary-600 text-white scale-105 shadow-lg'
          : 'bg-gray-700/50 hover:bg-gray-600/70 text-gray-300'
      }`}
    >
      <Icon name={icon} className="w-6 h-6" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        {renderView()}
      </main>
      <footer className="sticky bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm p-3 border-t border-gray-700">
        <div className="container mx-auto flex justify-center items-center space-x-2 sm:space-x-4">
          <NavButton targetView="studio" icon="document_scanner" label="Studio" />
          <NavButton targetView="image_generator" icon="image" label="Generator" />
          <NavButton targetView="library" icon="library" label="Library" />
          <NavButton targetView="inspiration" icon="spark" label="Inspiration" />
        </div>
      </footer>
    </div>
  );
};

export default App;
