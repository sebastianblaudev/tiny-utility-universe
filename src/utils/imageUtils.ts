/**
 * Utility functions for handling images
 */

/**
 * Resizes and optimizes an image to 200x200px
 * @param file Original image file
 * @returns A Promise that resolves to a compressed image File
 */
export const resizeAndOptimizeImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Validate file input
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set target dimensions
        canvas.width = 200;
        canvas.height = 200;
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw image with white background (in case of transparent PNGs)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate dimensions to maintain aspect ratio
        let drawWidth = img.width;
        let drawHeight = img.height;
        let xOffset = 0;
        let yOffset = 0;
        
        // Handle images with different aspect ratios
        if (img.width > img.height) {
          drawHeight = canvas.height;
          drawWidth = (img.width / img.height) * drawHeight;
          xOffset = (canvas.width - drawWidth) / 2;
        } else {
          drawWidth = canvas.width;
          drawHeight = (img.height / img.width) * drawWidth;
          yOffset = (canvas.height - drawHeight) / 2;
        }
        
        // Draw the image centered in the canvas
        ctx.drawImage(img, xOffset, yOffset, drawWidth, drawHeight);
        
        // Convert to blob with quality setting
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Could not create image blob'));
            return;
          }
          
          // Create a new file from the blob
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          resolve(optimizedFile);
        }, 'image/jpeg', 0.7); // 0.7 quality provides good balance of quality and size
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
  });
};

/**
 * Converts an image to grayscale and optimizes it for logo use
 * @param file Original image file
 * @returns A Promise that resolves to a grayscale, optimized image File
 */
export const processLogoImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Validate file input
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Create canvas for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Calculate dimensions to fit within 200x200 while maintaining aspect ratio
        let targetWidth = img.width;
        let targetHeight = img.height;
        const maxSize = 200;
        
        if (targetWidth > maxSize || targetHeight > maxSize) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxSize) / targetWidth);
            targetWidth = maxSize;
          } else {
            targetWidth = Math.round((targetWidth * maxSize) / targetHeight);
            targetHeight = maxSize;
          }
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Draw the image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        // Get image data to apply grayscale filter
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data;
        
        // Apply grayscale filter
        for (let i = 0; i < data.length; i += 4) {
          // Calculate grayscale using luminance formula
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          data[i] = gray;     // Red
          data[i + 1] = gray; // Green
          data[i + 2] = gray; // Blue
          // Alpha channel (data[i + 3]) remains unchanged
        }
        
        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to blob with high compression for smaller file size
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Could not create image blob'));
            return;
          }
          
          // Create a new file from the blob with a descriptive name
          const processedFileName = file.name.replace(/\.[^/.]+$/, '_grayscale.jpg');
          const optimizedFile = new File([blob], processedFileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          resolve(optimizedFile);
        }, 'image/jpeg', 0.6); // Lower quality for smaller file size
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
  });
};

/**
 * Get a file size in a readable format
 * @param size File size in bytes
 * @returns Formatted size string (KB or MB)
 */
export const getReadableFileSize = (size: number): string => {
  if (size < 1024) {
    return `${size} bytes`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
};

/**
 * Safely creates a unique filename for storage
 * @param userId User ID
 * @param originalName Original filename
 * @returns A storage-safe filename
 */
export const createSafeFileName = (userId: string, originalName: string): string => {
  // Extract file extension
  const fileExt = originalName.split('.').pop() || 'jpg';
  
  // Create timestamp
  const timestamp = Date.now();
  
  // Create unique filename with user ID and timestamp
  return `${userId}_${timestamp}.${fileExt}`;
};

/**
 * Validates image file before upload
 * @param file File to validate
 * @param maxSizeInMB Maximum allowed size in MB
 * @returns Error message or null if valid
 */
export const validateImageFile = (file: File, maxSizeInMB: number = 5): string | null => {
  // Check if file exists
  if (!file) return 'No file selected';
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'Selected file is not an image';
  }
  
  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return `Image exceeds maximum size of ${maxSizeInMB}MB`;
  }
  
  // File is valid
  return null;
};
