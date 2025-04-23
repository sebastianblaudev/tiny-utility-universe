
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PizzaSizeSelectorProps {
  onSizeSelect: (size: string, price: number) => void;
  onClose: () => void;
  sizes: {
    personal: number;
    mediana: number;
    familiar: number;
  };
}

const PizzaSizeSelector = ({ onSizeSelect, onClose, sizes }: PizzaSizeSelectorProps) => {
  const [selectedSize, setSelectedSize] = React.useState<string | null>(null);

  const handleSizeSelected = (size: string) => {
    setSelectedSize(size);
  };

  const handleConfirm = () => {
    if (selectedSize) {
      onSizeSelect(selectedSize, sizes[selectedSize as keyof typeof sizes]);
    }
  };

  // Filter out sizes with no price or price of 0
  const availableSizes = Object.entries(sizes || {}).filter(([_, price]) => price && price > 0);

  // Si no hay tamaños disponibles, mostrar un mensaje
  if (!sizes || availableSizes.length === 0) {
    return (
      <div className="flex flex-col space-y-4 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 -top-2 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          ✕
        </Button>
        <div className="p-4 text-center text-white">
          No hay tamaños disponibles para este producto.
        </div>
        <Button 
          onClick={onClose} 
          className="bg-orange-600 hover:bg-orange-700 w-full"
        >
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 -top-2 text-gray-400 hover:text-white"
        onClick={onClose}
      >
        ✕
      </Button>
      <RadioGroup
        value={selectedSize || ""}
        onValueChange={handleSizeSelected}
        className="space-y-3"
      >
        {availableSizes.map(([size, price]) => (
          <div key={size} className="flex items-center space-x-3 bg-[#252525] p-3 rounded-md">
            <RadioGroupItem value={size} id={size} className="text-white border-white" />
            <Label htmlFor={size} className="text-white">
              {size.charAt(0).toUpperCase() + size.slice(1)} - ${price}
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      <Button 
        onClick={handleConfirm} 
        disabled={!selectedSize}
        className="bg-orange-600 hover:bg-orange-700 w-full"
      >
        Confirmar
      </Button>
    </div>
  );
};

export default PizzaSizeSelector;
