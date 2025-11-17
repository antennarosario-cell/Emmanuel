
import type { LibraryImage } from '../types';

const LIBRARY_KEY = 'tattoo_design_library';

export const getLibraryImages = (): LibraryImage[] => {
  try {
    const items = window.localStorage.getItem(LIBRARY_KEY);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error("Error reading from localStorage", error);
    return [];
  }
};

export const saveImageToLibrary = (image: Omit<LibraryImage, 'id' | 'createdAt'>): LibraryImage => {
  const images = getLibraryImages();
  const newImage: LibraryImage = {
    ...image,
    id: `img_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updatedImages = [newImage, ...images];
  try {
    window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedImages));
    return newImage;
  } catch (error) {
    console.error("Error writing to localStorage", error);
    // This could happen if storage is full.
    throw new Error("Could not save image. Storage might be full.");
  }
};

export const deleteImageFromLibrary = (id: string): void => {
  const images = getLibraryImages();
  const updatedImages = images.filter(image => image.id !== id);
  try {
    window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedImages));
  } catch (error) {
    console.error("Error updating localStorage", error);
  }
};
