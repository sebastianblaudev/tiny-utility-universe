
import React from 'react';

interface LabelTemplateProps {
  productName: string;
  productPrice: string;
  productCode: string;
  showBarcode?: boolean;
}

// Individual label component
const LabelTemplate = ({ 
  productName, 
  productPrice, 
  productCode,
  showBarcode = true
}: LabelTemplateProps) => {
  return (
    <div className="label-template p-2 border-2 border-gray-300 min-w-[30mm] min-h-[20mm] flex flex-col justify-between items-center text-center">
      <div className="product-name text-xs font-bold overflow-hidden text-ellipsis w-full">
        {productName}
      </div>
      
      <div className="product-price text-lg font-bold my-1">
        {productPrice}
      </div>
      
      {showBarcode && (
        <div className="barcode-container w-full text-center">
          <div className="text-[8px] text-center mt-1">{productCode}</div>
        </div>
      )}
    </div>
  );
};

// Grid layout for multiple labels
export const LabelTemplateGrid = ({ products }: { products: any[] }) => {
  return (
    <div className="grid grid-cols-3 gap-1 p-2">
      {products.map((product, index) => (
        <LabelTemplate
          key={`${product.id}-${index}`}
          productName={product.name}
          productPrice={`$${product.price.toFixed(2)}`}
          productCode={product.code}
        />
      ))}
    </div>
  );
};

export default LabelTemplate;
