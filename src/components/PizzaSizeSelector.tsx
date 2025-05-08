
import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Pencil, Check } from "lucide-react";

interface PizzaSizeSelectorProps {
  onSizeSelect: (size: string, price: number) => void;
  onClose: () => void;
  sizes: {
    [key: string]: number;
    personal?: number;
    mediana?: number;
    familiar?: number;
  };
}

const PizzaSizeSelector = ({ onSizeSelect, onClose, sizes }: PizzaSizeSelectorProps) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showCustomSizeForm, setShowCustomSizeForm] = useState(false);
  const [customSizeName, setCustomSizeName] = useState('');
  const [customSizePrice, setCustomSizePrice] = useState<number>(0);
  
  // State for editing size names
  const [editingSizeName, setEditingSizeName] = useState<string | null>(null);
  const [editedSizeName, setEditedSizeName] = useState<string>('');

  const handleSizeSelected = (size: string) => {
    setSelectedSize(size);
  };

  const handleConfirm = () => {
    if (selectedSize) {
      onSizeSelect(selectedSize, sizes[selectedSize]);
    }
  };

  const handleStartEditSize = (size: string) => {
    setEditingSizeName(size);
    setEditedSizeName(size);
  };

  const handleSaveEditedSize = () => {
    if (editingSizeName && editedSizeName.trim() !== '') {
      // Create new sizes object with the edited name as key
      const newSizes = { ...sizes };
      
      // Store the price of the original size
      const originalPrice = newSizes[editingSizeName];
      
      // Delete the original size
      delete newSizes[editingSizeName];
      
      // Add the new size with the saved price
      newSizes[editedSizeName.toLowerCase()] = originalPrice;
      
      // Update selected size if it's the one being edited
      if (selectedSize === editingSizeName) {
        setSelectedSize(editedSizeName.toLowerCase());
      }
      
      // Update the parent component with the new sizes
      onSizeSelect(editedSizeName.toLowerCase(), originalPrice);
      
      // Reset editing state
      setEditingSizeName(null);
      setEditedSizeName('');
    }
  };

  const handleAddCustomSize = () => {
    if (customSizeName.trim() === '') {
      return;
    }
    
    // Normalize the custom size name (lowercase for consistency)
    const normalizedName = customSizeName.toLowerCase().trim();
    
    // Create a new size object with the custom size
    const newSizes = {
      ...sizes,
      [normalizedName]: customSizePrice
    };
    
    // Select the new size and notify parent component
    setSelectedSize(normalizedName);
    onSizeSelect(normalizedName, customSizePrice);
    
    // Reset form
    setShowCustomSizeForm(false);
    setCustomSizeName('');
    setCustomSizePrice(0);
  };

  // Filter out sizes with no price or price of 0
  const availableSizes = Object.entries(sizes || {}).filter(([_, price]) => price && price > 0);

  // Si no hay tamaños disponibles y no estamos mostrando el formulario de tamaño personalizado
  if (!sizes || (availableSizes.length === 0 && !showCustomSizeForm)) {
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
          onClick={() => setShowCustomSizeForm(true)} 
          className="bg-purple-600 hover:bg-purple-700 w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar tamaño personalizado
        </Button>
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
        <X className="h-4 w-4" />
      </Button>
      
      {showCustomSizeForm ? (
        <div className="space-y-4 bg-[#252525] p-4 rounded-md">
          <h3 className="text-white font-medium">Crear tamaño personalizado</h3>
          <div className="space-y-2">
            <Label htmlFor="custom-size-name" className="text-white">
              Nombre del tamaño
            </Label>
            <Input
              id="custom-size-name"
              value={customSizeName}
              onChange={(e) => setCustomSizeName(e.target.value)}
              placeholder="Ej: Gigante, Mini, etc."
              className="bg-[#333] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-size-price" className="text-white">
              Precio
            </Label>
            <Input
              id="custom-size-price"
              type="number"
              value={customSizePrice}
              onChange={(e) => setCustomSizePrice(Number(e.target.value))}
              placeholder="Precio"
              className="bg-[#333] text-white"
            />
          </div>
          <div className="flex space-x-2 pt-2">
            <Button 
              onClick={handleAddCustomSize}
              className="bg-purple-600 hover:bg-purple-700 w-full"
              disabled={!customSizeName.trim() || customSizePrice <= 0}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
            <Button 
              onClick={() => setShowCustomSizeForm(false)}
              variant="outline" 
              className="border-gray-600 text-white hover:bg-gray-700 w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <RadioGroup
            value={selectedSize || ""}
            onValueChange={handleSizeSelected}
            className="space-y-3"
          >
            {availableSizes.map(([size, price]) => (
              <div key={size} className="flex items-center space-x-3 bg-[#252525] p-3 rounded-md">
                <RadioGroupItem value={size} id={size} className="text-white border-white" />
                <Label htmlFor={size} className="text-white flex-1">
                  {editingSizeName === size ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={editedSizeName} 
                        onChange={(e) => setEditedSizeName(e.target.value)}
                        className="bg-[#333] text-white h-8 w-full"
                        autoFocus
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-green-700 hover:bg-green-800 h-8 px-2"
                        onClick={handleSaveEditedSize}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>
                        {size.charAt(0).toUpperCase() + size.slice(1)} - ${price}
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 ml-2 text-gray-400 hover:text-purple-400"
                        onClick={(e) => {
                          e.preventDefault();  // Prevent RadioGroup from selecting this item
                          handleStartEditSize(size);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <Button 
            onClick={() => setShowCustomSizeForm(true)}
            variant="outline" 
            className="border border-purple-600 text-purple-400 hover:bg-purple-700/30 flex items-center justify-center"
          >
            <Plus className="mr-2 h-4 w-4" /> Agregar tamaño personalizado
          </Button>
          
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedSize}
            className="bg-orange-600 hover:bg-orange-700 w-full"
          >
            Confirmar
          </Button>
        </>
      )}
    </div>
  );
};

export default PizzaSizeSelector;
