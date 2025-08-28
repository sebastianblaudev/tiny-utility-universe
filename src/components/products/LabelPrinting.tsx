import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductType } from '@/types';
import { PrinterIcon } from 'lucide-react';
import JsBarcode from 'jsbarcode';

type LabelPrintingProps = {
  isOpen: boolean;
  onClose: () => void;
  product: ProductType | null;
};

const LabelPrinting = ({ isOpen, onClose, product }: LabelPrintingProps) => {
  const [labelCount, setLabelCount] = useState(1);
  const [labels, setLabels] = useState<ProductType[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const [priceFormat, setPriceFormat] = useState('normal'); // 'normal', 'discount', 'special'
  const [discountPrice, setDiscountPrice] = useState('');

  const prepareLabels = () => {
    if (!product) return;
    
    const count = Math.max(1, Math.min(100, Number(labelCount))); // Limit to 1-100 labels
    const labelsArray: ProductType[] = [];
    for (let i = 0; i < count; i++) {
      labelsArray.push({
        ...product,
        price: 
          priceFormat === 'discount' && discountPrice ? 
          parseFloat(discountPrice) : 
          product.price
      });
    }
    setLabels(labelsArray);
  };

  const printLabels = useReactToPrint({
    documentTitle: "Product Labels",
    contentRef: printRef,
    onAfterPrint: () => {
      setLabels([]);
      onClose();
    },
  });

  const handlePrint = async (): Promise<void> => {
    prepareLabels();
    
    return new Promise((resolve) => {
      setTimeout(() => {
        generateBarcodes();
        if (printRef.current && printLabels) {
          printLabels();
        }
        resolve();
      }, 100);
    });
  };

  const generateBarcodes = () => {
    if (!product?.barcode) return;
    
    const barcodeElements = document.querySelectorAll('.barcode-canvas');
    barcodeElements.forEach((element) => {
      try {
        JsBarcode(element, product.barcode || '0000000000000', {
          format: 'EAN13',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 0
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Imprimir etiquetas</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label-count">Cantidad de etiquetas</Label>
                <Input
                  id="label-count"
                  type="number"
                  min="1"
                  max="100"
                  value={labelCount}
                  onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price-format">Formato de precio</Label>
                <select
                  id="price-format"
                  className="w-full rounded-md border border-input p-2"
                  value={priceFormat}
                  onChange={(e) => setPriceFormat(e.target.value)}
                >
                  <option value="normal">Precio normal</option>
                  <option value="discount">Precio de oferta</option>
                  <option value="special">Precio especial</option>
                </select>
              </div>
              
              {priceFormat === 'discount' && (
                <div className="space-y-2">
                  <Label htmlFor="discount-price">Precio de oferta</Label>
                  <Input
                    id="discount-price"
                    type="number"
                    step="0.01"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder={product?.price?.toString() || ''}
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handlePrint}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="hidden">
        <div ref={printRef} className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {labels.map((label, index) => (
              <div key={index} className="border p-2 w-[4cm] h-[6cm] flex flex-col items-center justify-between text-center overflow-hidden">
                <div className="font-bold text-sm truncate w-full">{label.name}</div>
                
                {label.barcode && (
                  <div className="py-1">
                    <canvas className="barcode-canvas w-full"></canvas>
                  </div>
                )}
                
                {priceFormat === 'normal' && (
                  <div className="text-xl font-bold">${label.price?.toFixed(2)}</div>
                )}
                
                {priceFormat === 'discount' && (
                  <div className="space-y-1">
                    {product?.price && (
                      <div className="line-through text-sm">${product.price.toFixed(2)}</div>
                    )}
                    <div className="text-xl font-bold">${label.price?.toFixed(2)}</div>
                  </div>
                )}
                
                {priceFormat === 'special' && (
                  <div className="bg-black text-white w-full py-1 font-bold">
                    ${label.price?.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LabelPrinting;
