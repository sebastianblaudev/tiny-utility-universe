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
  // Si hay imagen, mostrar con el aspecto cuadrado normal
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
  
  // Si no hay imagen, devolver null para mostrar una card minimalista
  return null;
};

export default ProductImage;
