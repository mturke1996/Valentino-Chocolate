import { ImageUploadResponse } from '../types';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export const uploadToImgBB = async (file: File): Promise<ImageUploadResponse> => {
  if (!IMGBB_API_KEY) {
    return {
      success: false,
      url: '',
      message: 'ImgBB API key not configured',
    };
  }

  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        url: data.data.url,
      };
    } else {
      return {
        success: false,
        url: '',
        message: data.error?.message || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('ImgBB upload error:', error);
    return {
      success: false,
      url: '',
      message: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

export const uploadMultipleToImgBB = async (
  files: File[]
): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadToImgBB(file));
  const results = await Promise.all(uploadPromises);
  
  return results
    .filter(result => result.success)
    .map(result => result.url);
};

