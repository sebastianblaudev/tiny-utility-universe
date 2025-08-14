import React from 'react';
import { Package } from 'lucide-react';
import { isLightColor, getProductDisplayColor } from '@/utils/productUtils';

interface ProductImageProps {
  imageUrl?: string | null;
  productName: string;
  color?: string;
  className?: string;
  productId?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({ 
  imageUrl, 
  productName, 
  color,
  productId,
  className = '' 
}) => {
  if (imageUrl) {
    return (
      <div className={`relative aspect-square overflow-hidden rounded-md ${className}`}>
        <img
          src={imageUrl}
          alt={productName}
          className="h-full w-full object-cover transition-all hover:scale-105"
        />
      </div>
    );
  }
  
  // If color is provided, use it directly
  // If not but we have a productId, generate one based on ID and name
  // Otherwise use a default color
  const displayColor = color || (productId ? getProductDisplayColor({ id: productId, name: productName }) : '#e2e8f0');
  
  // Determine if text should be dark or light based on background color
  const isLight = isLightColor(displayColor);
  const textColor = isLight ? 'text-gray-800' : 'text-white';
  
  return (
    <div 
      className={`relative aspect-square overflow-hidden rounded-md flex items-center justify-center ${className}`}
      style={{ backgroundColor: displayColor }}
    >
      <Package 
        className={`h-12 w-12 ${textColor}`} 
      />
    </div>
  );
};

export default ProductImage;
