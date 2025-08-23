
import React from 'react';

/**
 * Utility functions for image uploads and processing
 */

/**
 * Resizes an image to the specified dimensions and returns as a Blob
 */
export const resizeImage = async (file: File, maxWidth = 800, maxHeight = 800, quality = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            resolve(blob);
          },
          file.type,
          quality
        );
      };
      img.onerror = () => {
        reject(new Error('Image loading error'));
      };
    };
    reader.onerror = () => {
      reject(new Error('FileReader error'));
    };
  });
};

/**
 * Uploads an image to Supabase storage
 */
export const uploadProductImage = async (file: File): Promise<string> => {
  try {
    // Validate file before processing
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please select an image file.');
    }
    
    // Resize the image
    const resizedImageBlob = await resizeImage(file);
    
    // Create a new File from the Blob
    const resizedImageFile = new File(
      [resizedImageBlob], 
      file.name, 
      { type: file.type }
    );
    
    // Generate a unique file name
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    // Import the Supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Upload to the products bucket
    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, resizedImageFile);
    
    if (error) throw error;
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Helper function to properly handle image container click events
 * This ensures the click event on the container properly triggers the file input with a single click
 */
export const handleImageContainerClick = (inputRef: React.RefObject<HTMLInputElement>, imageUrl?: string) => {
  // Only trigger file dialog if there's no existing image
  if (!imageUrl && inputRef.current) {
    inputRef.current.click();
  }
};

/**
 * Create the ImageUploadField component for product forms
 */
export const createImageUploadField = ({ form, fieldName = 'image_url', isUploading = false }: {
  form: any;
  fieldName?: string;
  isUploading?: boolean;
}) => {
  const imageUrl = form.watch(fieldName);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  
  const triggerUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };
  
  return (
    <div className="grid gap-2">
      <label htmlFor="product-image">Imagen del producto</label>
      <div className="flex flex-col items-center gap-4">
        {imageUrl ? (
          <div className="relative w-full max-w-[200px] h-[200px] mx-auto border rounded-md overflow-hidden">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <button 
              type="button"
              className="absolute top-2 right-2 w-8 h-8 p-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.setValue(fieldName, '');
              }}
              aria-label="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        ) : (
          <button 
            type="button"
            onClick={triggerUploadClick}
            className="w-full h-[140px] border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mb-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p className="text-sm text-muted-foreground">Haz clic para subir una imagen</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG o GIF (200x200px)</p>
          </button>
        )}
        
        <div className="w-full">
          <input
            id="product-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Handle file selection - this would typically call a parent component's method
                // that handles the upload
                const uploadHandler = form.uploadHandler || (() => {});
                uploadHandler(e);
              }
            }}
            disabled={isUploading}
            ref={imageInputRef}
          />
          
          <button 
            type="button"
            className="w-full px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center gap-2 text-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              triggerUploadClick(e);
            }} 
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Subiendo...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
