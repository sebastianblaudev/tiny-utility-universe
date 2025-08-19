
import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadProductImage } from '@/utils/imageUploadUtils';
import ProductImage from './ProductImage';

interface ProductImageManagerProps {
  imageUrl: string | null | undefined;
  productName: string;
  color?: string;
  productId?: string;
  onImageChange: (newImageUrl: string) => void;
  className?: string;
  allowClickToUpload?: boolean;
}

const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  imageUrl,
  productName,
  color,
  productId,
  onImageChange,
  className = '',
  allowClickToUpload = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      
      const newImageUrl = await uploadProductImage(file);
      onImageChange(newImageUrl);
      
      // Clear the input value so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Error al subir la imagen. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = (e: React.MouseEvent) => {
    // Explicitly prevent default behavior and stop propagation to prevent modal close
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const removeImage = (e: React.MouseEvent) => {
    // Explicitly prevent default behavior and stop propagation to prevent modal close
    e.preventDefault();
    e.stopPropagation();
    onImageChange('');
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (allowClickToUpload) {
      e.stopPropagation();
      triggerFileInput(e);
    }
  };

  return (
    <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Image preview area */}
      <div 
        className={`relative w-full aspect-square rounded-md overflow-hidden border bg-background ${allowClickToUpload ? 'cursor-pointer' : ''}`}
        onClick={handleImageClick}
        title={allowClickToUpload ? "Haz clic para cambiar la imagen" : ""}
      >
        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : null}
        
        <ProductImage 
          imageUrl={imageUrl}
          productName={productName}
          color={color}
          productId={productId}
          className="h-full w-full object-cover"
        />
        
        {/* Overlay with actions */}
        <div 
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30"
          onClick={(e) => e.stopPropagation()} // Prevent event bubbling
        >
          <button
            type="button"
            onClick={triggerFileInput}
            className="bg-primary text-primary-foreground p-2 rounded-full m-1"
            disabled={isUploading}
          >
            <Upload size={18} />
          </button>
          
          {imageUrl && (
            <button
              type="button"
              onClick={removeImage}
              className="bg-destructive text-destructive-foreground p-2 rounded-full m-1"
              disabled={isUploading}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
        onClick={(e) => e.stopPropagation()} // Prevent event bubbling
      />
      
      {/* Error message */}
      {error && (
        <p className="text-destructive text-sm mt-1">{error}</p>
      )}
      
      {/* Upload button below image */}
      <button
        type="button"
        onClick={triggerFileInput}
        className="mt-2 w-full flex items-center justify-center gap-2 text-sm py-1.5 px-3 rounded-md border bg-background hover:bg-accent"
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Subiendo...</span>
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4" />
            <span>{imageUrl ? 'Cambiar imagen' : 'Subir imagen'}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ProductImageManager;
