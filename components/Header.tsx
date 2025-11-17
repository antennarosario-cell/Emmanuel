
import React from 'react';
import { Icon } from './Icon';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-center">
        <Icon name="spark" className="w-8 h-8 text-primary-400 mr-3" />
        <h1 className="text-xl md:text-2xl font-bold text-gray-100 tracking-tight">
          AI Tattoo Design Studio
        </h1>
      </div>
    </header>
  );
};
