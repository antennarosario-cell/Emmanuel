
import React, { useState, useEffect } from 'react';
import * as libraryStore from '../utils/libraryStore';
import type { LibraryImage } from '../types';
import { Icon } from './Icon';

interface LibraryProps {
  onUseDesign: (imageData: string, mimeType: string, prompt: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ onUseDesign }) => {
  const [images, setImages] = useState<LibraryImage[]>([]);

  useEffect(() => {
    setImages(libraryStore.getLibraryImages());
  }, []);

  const handleDelete = (id: string) => {
    // Add confirmation before deleting
    if (window.confirm("Are you sure you want to delete this design?")) {
        libraryStore.deleteImageFromLibrary(id);
        setImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const handleShare = (image: LibraryImage) => {
    // "Sharing" prompts a download, which the user can then upload to Google Drive or other services.
    const link = document.createElement('a');
    link.href = `data:${image.mimeType};base64,${image.imageData}`;
    link.download = `tattoo-design-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 h-full">
        <Icon name="library" className="w-16 h-16 text-gray-500 mb-4" />
        <h2 className="text-2xl font-bold">Your Library is Empty</h2>
        <p className="text-gray-400">Use the "Save to Library" button on generated designs to add them here.</p>
      </div>
    );
  }

  return (
    <div className="flex-grow p-2 sm:p-4">
      <h2 className="text-2xl font-bold text-center mb-6">My Design Library</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(image => (
          <div key={image.id} className="group relative bg-gray-800 rounded-lg overflow-hidden shadow-lg aspect-square">
            <a href={`data:${image.mimeType};base64,${image.imageData}`} target="_blank" rel="noopener noreferrer" title="View larger image">
              <img 
                src={`data:${image.mimeType};base64,${image.imageData}`} 
                alt={image.prompt} 
                className="w-full h-full object-cover bg-white" 
              />
            </a>
            <div className="absolute inset-0 bg-black/70 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
              <p className="text-xs text-gray-200 line-clamp-3 md:line-clamp-4">{image.prompt}</p>
              <div className="flex items-center justify-end gap-2">
                 <button onClick={() => onUseDesign(image.imageData, image.mimeType, image.prompt)} className="p-2 rounded-full bg-black/50 hover:bg-primary-600 transition-colors" title="Use in Studio">
                    <Icon name="document_scanner" className="w-4 h-4 text-white"/>
                 </button>
                 <button onClick={() => handleShare(image)} className="p-2 rounded-full bg-black/50 hover:bg-green-600 transition-colors" title="Share to Google Drive (via Download)">
                    <Icon name="share" className="w-4 h-4 text-white"/>
                 </button>
                 <button onClick={() => handleDelete(image.id)} className="p-2 rounded-full bg-black/50 hover:bg-red-600 transition-colors" title="Delete">
                    <Icon name="trash" className="w-4 h-4 text-white"/>
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
