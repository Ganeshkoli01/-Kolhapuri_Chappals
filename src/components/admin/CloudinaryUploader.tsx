import React, { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CloudinaryUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const CloudinaryUploader: React.FC<CloudinaryUploaderProps> = ({ 
  images, 
  onImagesChange,
  maxImages = 5
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images in total.`);
      return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast.error('Cloudinary credentials missing in .env.local');
      return;
    }

    setUploading(true);
    const newImages = [...images];

    try {
      // Upload each file sequentially (or could use Promise.all)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        newImages.push(data.secure_url);
      }

      onImagesChange(newImages);
      toast.success('Images uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading to Cloudinary:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="relative">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading || images.length >= maxImages}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className={`
          border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors
          ${uploading || images.length >= maxImages ? 'bg-gray-50 border-gray-200' : 'bg-cream border-saddle/30 hover:border-saddle'}
        `}>
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-saddle animate-spin mb-3" />
              <p className="text-sm text-gray-500 font-medium">Uploading images...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-saddle mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">Click or drag images to upload</p>
              <p className="text-xs text-gray-500">
                {images.length} / {maxImages} uploaded. Supported formats: JPG, PNG, WEBP.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((url, idx) => (
            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <img src={url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="bg-white text-red-500 p-2 rounded-full hover:bg-red-50 hover:scale-110 transition-all shadow-sm"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {idx === 0 && (
                <div className="absolute top-2 left-2 bg-maroon text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                  PRIMARY
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
