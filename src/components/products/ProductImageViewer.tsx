
import React from 'react';
import { Modal } from '@/components/Modal';
import ProductImageManager from './ProductImageManager';

interface ProductImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null | undefined;
  productName: string;
  color?: string;
  productId?: string;
  onImageChange: (newImageUrl: string) => void;
}

const ProductImageViewer: React.FC<ProductImageViewerProps> = ({
  isOpen,
  onClose,
  imageUrl,
  productName,
  color,
  productId,
  onImageChange,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Imagen del producto"
      size="md"
    >
      <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <ProductImageManager
          imageUrl={imageUrl}
          productName={productName}
          color={color}
          productId={productId}
          onImageChange={onImageUrl => {
            onImageChange(onImageUrl);
          }}
          className="w-full max-w-md mx-auto"
          allowClickToUpload={true}
        />
      </div>
    </Modal>
  );
};

export default ProductImageViewer;
